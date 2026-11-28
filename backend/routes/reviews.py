from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from backend.extensions import db
from backend.models import ProductReview, OrderFeedback, Product, FarmerProfile, Order, OrderItem, Notification, ReviewHelpfulVote

reviews_bp = Blueprint('reviews', __name__)


def _build_summary(reviews_list):
    total = len(reviews_list)
    breakdown = {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
    if total == 0:
        return {
            'average_rating': 0.0,
            'total_reviews': 0,
            'farmer_average_rating': 0.0,
            'rating_breakdown': breakdown
        }

    total_prod = 0
    total_farmer = 0
    for r in reviews_list:
        total_prod += r.rating
        total_farmer += r.farmer_rating
        key = str(max(1, min(5, int(r.rating))))
        breakdown[key] += 1

    return {
        'average_rating': round(total_prod / total, 1),
        'total_reviews': total,
        'farmer_average_rating': round(total_farmer / total, 1),
        'rating_breakdown': breakdown
    }


def _resolve_product(product_ref):
    ref = str(product_ref or '').strip()
    if not ref:
        return None
    prod = Product.query.filter_by(slug=ref).first()
    if not prod and ref.isdigit():
        prod = Product.query.get(int(ref))
    return prod


@reviews_bp.route('/product/<string:product_ref>', methods=['GET'])
def get_product_reviews(product_ref):
    product = _resolve_product(product_ref)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    product_id = product.id

    sort = request.args.get('sort', 'recent')
    query = ProductReview.query.filter_by(product_id=product_id)

    if sort == 'highest':
        query = query.order_by(ProductReview.rating.desc(), ProductReview.created_at.desc())
    elif sort == 'lowest':
        query = query.order_by(ProductReview.rating.asc(), ProductReview.created_at.desc())
    elif sort == 'helpful':
        query = query.order_by(ProductReview.helpful_count.desc(), ProductReview.created_at.desc())
    else:
        query = query.order_by(ProductReview.created_at.desc())

    reviews = query.all()
    all_product_reviews = ProductReview.query.filter_by(product_id=product_id).all()
    summary = _build_summary(all_product_reviews)

    # Also include overall farmer rating across all their products
    farmer_reviews = ProductReview.query.filter_by(farmer_id=product.farmer_id).all()
    farmer_count = len(farmer_reviews)
    summary['farmer_overall_rating'] = round(
        sum(r.farmer_rating for r in farmer_reviews) / farmer_count, 1
    ) if farmer_count > 0 else 0.0
    summary['farmer_total_reviews'] = farmer_count

    my_review = None
    voted_ids = set()
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            uid_int = int(uid)
            existing = ProductReview.query.filter_by(product_id=product_id, buyer_id=uid_int).first()
            if existing:
                my_review = existing.to_dict()
            review_ids = [r.id for r in reviews]
            if review_ids:
                voted_ids = {
                    v.review_id
                    for v in ReviewHelpfulVote.query.filter(
                        ReviewHelpfulVote.user_id == uid_int,
                        ReviewHelpfulVote.review_id.in_(review_ids)
                    ).all()
                }
    except Exception:
        pass

    return jsonify({
        'summary': summary,
        'reviews': [r.to_dict(helpful_by_me=(r.id in voted_ids)) for r in reviews],
        'my_review': my_review
    }), 200


@reviews_bp.route('/product/<string:product_ref>', methods=['POST'])
@jwt_required()
def submit_product_review(product_ref):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') not in ['buyer', 'admin']:
        return jsonify({'error': 'Only buyers can submit product reviews'}), 403

    product = _resolve_product(product_ref)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    product_id = product.id

    data = request.get_json() or {}
    try:
        rating = int(data.get('rating', 0))
        farmer_rating = int(data.get('farmer_rating', rating))
    except (TypeError, ValueError):
        return jsonify({'error': 'Ratings must be integers from 1 to 5'}), 400

    title = (data.get('title') or '').strip()
    comment = (data.get('comment') or '').strip()

    if rating < 1 or rating > 5 or farmer_rating < 1 or farmer_rating > 5:
        return jsonify({'error': 'Product and farmer ratings must be between 1 and 5 stars'}), 400
    if not comment:
        return jsonify({'error': 'Please write a short review comment'}), 400

    # Check if buyer has a non-cancelled order for this product
    purchased_item = (
        db.session.query(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.buyer_id == user_id,
            OrderItem.product_id == product_id,
            Order.order_status != 'Cancelled'
        )
        .first()
    )
    is_verified = purchased_item is not None
    order_id = purchased_item.order_id if purchased_item else None

    existing = ProductReview.query.filter_by(product_id=product_id, buyer_id=user_id).first()
    if existing:
        existing.rating = rating
        existing.farmer_rating = farmer_rating
        existing.title = title
        existing.comment = comment
        existing.is_verified_purchase = existing.is_verified_purchase or is_verified
        if order_id and not existing.order_id:
            existing.order_id = order_id
        db.session.commit()
        return jsonify({'message': 'Review updated successfully', 'review': existing.to_dict()}), 200

    review = ProductReview(
        product_id=product_id,
        farmer_id=product.farmer_id,
        buyer_id=user_id,
        order_id=order_id,
        rating=rating,
        farmer_rating=farmer_rating,
        title=title,
        comment=comment,
        is_verified_purchase=is_verified
    )
    db.session.add(review)

    # Notify farmer of new review
    if product.farmer and product.farmer.user_id:
        notif = Notification(
            user_id=product.farmer.user_id,
            title=f"New {rating}★ Review on {product.name}",
            message=f'"{comment[:100]}"'
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify({'message': 'Review submitted successfully', 'review': review.to_dict()}), 201


@reviews_bp.route('/<int:review_id>/helpful', methods=['POST'])
@jwt_required()
def mark_review_helpful(review_id):
    user_id = int(get_jwt_identity())
    review = ProductReview.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404

    existing_vote = ReviewHelpfulVote.query.filter_by(review_id=review_id, user_id=user_id).first()
    if existing_vote:
        db.session.delete(existing_vote)
        review.helpful_count = max(0, (review.helpful_count or 0) - 1)
        helpful_by_me = False
    else:
        db.session.add(ReviewHelpfulVote(review_id=review_id, user_id=user_id))
        review.helpful_count = (review.helpful_count or 0) + 1
        helpful_by_me = True

    db.session.commit()
    return jsonify({'helpful_count': review.helpful_count, 'helpful_by_me': helpful_by_me}), 200


@reviews_bp.route('/<int:review_id>/reply', methods=['POST'])
@jwt_required()
def reply_to_review(review_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'farmer':
        return jsonify({'error': 'Only farmers can reply to reviews'}), 403

    farmer = FarmerProfile.query.filter_by(user_id=user_id).first()
    if not farmer:
        return jsonify({'error': 'Farmer profile not found'}), 404

    review = ProductReview.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    if review.farmer_id != farmer.id:
        return jsonify({'error': 'You can only reply to reviews for your own products'}), 403

    data = request.get_json() or {}
    reply_text = (data.get('reply') or '').strip()
    if not reply_text:
        return jsonify({'error': 'Reply text cannot be empty'}), 400

    review.farmer_reply = reply_text
    review.farmer_replied_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Reply posted successfully', 'review': review.to_dict()}), 200


@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    user_id = int(get_jwt_identity())
    review = ProductReview.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    if review.buyer_id != user_id:
        return jsonify({'error': 'You can only delete your own review'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted successfully'}), 200


@reviews_bp.route('/farmer', methods=['GET'])
@jwt_required()
def get_farmer_reviews():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'farmer':
        return jsonify({'error': 'Unauthorized access'}), 403

    farmer = FarmerProfile.query.filter_by(user_id=user_id).first()
    if not farmer:
        return jsonify({'error': 'Farmer profile not found'}), 404

    reviews = ProductReview.query.filter_by(farmer_id=farmer.id).order_by(ProductReview.created_at.desc()).all()
    summary = _build_summary(reviews)

    return jsonify({
        'summary': summary,
        'reviews': [r.to_dict() for r in reviews]
    }), 200


@reviews_bp.route('/pending-delivery', methods=['GET'])
@jwt_required()
def get_pending_delivery_reviews():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'buyer':
        return jsonify({'pending_orders': []}), 200

    completed_orders = (
        Order.query.filter(
            Order.buyer_id == user_id,
            Order.order_status.in_(['Completed', 'Delivered'])
        )
        .order_by(Order.updated_at.desc())
        .all()
    )
    rated_ids = {
        fb.order_id
        for fb in OrderFeedback.query.filter_by(buyer_id=user_id).all()
    }
    pending = [o.to_dict(include_items=True) for o in completed_orders if o.id not in rated_ids]
    return jsonify({'pending_orders': pending}), 200


@reviews_bp.route('/order/<int:order_id>', methods=['POST'])
@jwt_required()
def submit_order_delivery_feedback(order_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') not in ['buyer', 'admin']:
        return jsonify({'error': 'Only buyers can rate delivered orders'}), 403

    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order.buyer_id != user_id:
        return jsonify({'error': 'Unauthorized order access'}), 403
    if order.order_status not in ('Completed', 'Delivered'):
        return jsonify({'error': 'Order can only be rated after delivery is completed'}), 400

    data = request.get_json() or {}
    try:
        overall_rating = int(data.get('overall_rating', 5))
        delivery_rating = int(data.get('delivery_rating', overall_rating))
        farmer_rating = int(data.get('farmer_rating', overall_rating))
    except (TypeError, ValueError):
        return jsonify({'error': 'Ratings must be integers from 1 to 5'}), 400

    for val in (overall_rating, delivery_rating, farmer_rating):
        if val < 1 or val > 5:
            return jsonify({'error': 'All ratings must be between 1 and 5 stars'}), 400

    raw_tags = data.get('feedback_tags', [])
    if isinstance(raw_tags, list):
        tags_str = ','.join(str(t).strip() for t in raw_tags if str(t).strip())
    else:
        tags_str = str(raw_tags or '').strip()

    comment = (data.get('comment') or '').strip()

    # Save or update OrderFeedback
    feedback = OrderFeedback.query.filter_by(order_id=order_id).first()
    if feedback:
        feedback.overall_rating = overall_rating
        feedback.delivery_rating = delivery_rating
        feedback.farmer_rating = farmer_rating
        feedback.feedback_tags = tags_str
        feedback.comment = comment
    else:
        feedback = OrderFeedback(
            order_id=order_id,
            buyer_id=user_id,
            overall_rating=overall_rating,
            delivery_rating=delivery_rating,
            farmer_rating=farmer_rating,
            feedback_tags=tags_str,
            comment=comment
        )
        db.session.add(feedback)

    # Save or update per-product reviews submitted with this order
    items_payload = data.get('items', [])
    notified_farmers = set()
    for item_rev in items_payload:
        pid = item_rev.get('product_id')
        if not pid:
            continue
        product = Product.query.get(int(pid))
        if not product:
            continue

        try:
            item_rating = int(item_rev.get('rating', overall_rating))
        except (TypeError, ValueError):
            item_rating = overall_rating
        item_rating = max(1, min(5, item_rating))
        item_comment = (item_rev.get('comment') or '').strip() or comment or f"Rated {item_rating}★ after delivery"
        item_title = (item_rev.get('title') or '').strip()

        existing_rev = ProductReview.query.filter_by(product_id=product.id, buyer_id=user_id).first()
        if existing_rev:
            existing_rev.rating = item_rating
            existing_rev.farmer_rating = farmer_rating
            existing_rev.title = item_title or existing_rev.title
            existing_rev.comment = item_comment
            existing_rev.is_verified_purchase = True
            existing_rev.order_id = order.id
        else:
            db.session.add(ProductReview(
                product_id=product.id,
                farmer_id=product.farmer_id,
                buyer_id=user_id,
                order_id=order.id,
                rating=item_rating,
                farmer_rating=farmer_rating,
                title=item_title,
                comment=item_comment,
                is_verified_purchase=True
            ))

        if product.farmer and product.farmer.user_id and product.farmer.user_id not in notified_farmers:
            notified_farmers.add(product.farmer.user_id)
            db.session.add(Notification(
                user_id=product.farmer.user_id,
                title=f"Delivery Feedback: {order.order_number} ({overall_rating}★)",
                message=comment[:120] if comment else f"Buyer rated delivery {delivery_rating}★ and produce {item_rating}★."
            ))

    db.session.commit()
    return jsonify({
        'message': 'Thank you for rating your delivery!',
        'feedback': feedback.to_dict()
    }), 201
