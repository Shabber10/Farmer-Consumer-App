import random
import string
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.extensions import db
from backend.models import (
    User, Address, CartItem, Product, Notification,
    Community, CommunityMember, BulkCampaign,
    CommunityOrder, CommunityOrderItem, CommunityReview
)
from backend.utils_geo import haversine_meters

communities_bp = Blueprint('communities', __name__)


def _generate_community_code():
    for _ in range(10):
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        code = f"KD-{suffix}"
        if not Community.query.filter_by(community_code=code).first():
            return code
    return f"KD-{random.randint(10000, 99999)}"


def _get_user_coords_and_contact(user_id):
    user = User.query.get(user_id)
    addr = Address.query.filter_by(user_id=user_id, is_default=True).first() or Address.query.filter_by(user_id=user_id).first()
    lat = float(addr.latitude) if addr and addr.latitude is not None else None
    lng = float(addr.longitude) if addr and addr.longitude is not None else None
    landmark = addr.landmark if addr and addr.landmark else (addr.address_line if addr else '')
    phone = user.mobile_number if user else ''
    return lat, lng, landmark, phone


@communities_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby_communities():
    user_id = int(get_jwt_identity())
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius_m = request.args.get('radius_m', default=500.0, type=float)

    if lat is None or lng is None:
        lat, lng, _, _ = _get_user_coords_and_contact(user_id)

    all_comms = Community.query.order_by(Community.created_at.desc()).all()
    results = []
    for comm in all_comms:
        dist = haversine_meters(lat, lng, comm.latitude, comm.longitude) if (lat is not None and lng is not None) else None
        if dist is None or dist <= radius_m:
            results.append(comm.to_dict(distance_m=dist))

    results.sort(key=lambda c: c.get('distance_m') if c.get('distance_m') is not None else 999999)
    return jsonify({'communities': results, 'radius_m': radius_m}), 200


@communities_bp.route('', methods=['POST'])
@jwt_required()
def create_community():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    name = (data.get('name') or '').strip()
    address_line = (data.get('address_line') or '').strip()
    landmark = (data.get('landmark') or '').strip()
    dropoff_point = (data.get('dropoff_point') or 'Main Gate Security').strip()
    community_type = (data.get('community_type') or 'apartment').strip()
    block_name = (data.get('block_name') or '').strip()
    floor_name = (data.get('floor_name') or '').strip()
    flat_number = (data.get('flat_number') or '').strip()

    if not name:
        return jsonify({'error': 'Apartment / Community name is required.'}), 400
    if not block_name or not floor_name or not flat_number:
        return jsonify({'error': 'Block / Tower, Floor, and Flat No. are required (kept private from other members).'}), 400

    lat = data.get('latitude')
    lng = data.get('longitude')
    if lat is None or lng is None:
        u_lat, u_lng, u_landmark, _ = _get_user_coords_and_contact(user_id)
        lat = u_lat if u_lat is not None else 17.4474
        lng = u_lng if u_lng is not None else 78.3762
        if not landmark:
            landmark = u_landmark
    if not address_line:
        address_line = landmark or f"{name}, Hyderabad"

    community = Community(
        community_code=_generate_community_code(),
        name=name,
        community_type=community_type,
        address_line=address_line,
        landmark=landmark,
        dropoff_point=dropoff_point,
        latitude=Decimal(str(lat)),
        longitude=Decimal(str(lng)),
        pincode=(data.get('pincode') or '').strip() or None,
        admin_user_id=user_id,
    )
    db.session.add(community)
    db.session.flush()

    member = CommunityMember(
        community_id=community.id,
        user_id=user_id,
        role='admin',
        block_name=(data.get('block_name') or '').strip(),
        floor_name=(data.get('floor_name') or '').strip(),
        flat_number=(data.get('flat_number') or '').strip(),
        status='active',
    )
    db.session.add(member)
    db.session.commit()

    return jsonify({
        'message': 'Community created successfully!',
        'community': community.to_dict(),
        'membership': member.to_dict(include_private=True),
    }), 201


@communities_bp.route('/<int:community_id>/join', methods=['POST'])
@jwt_required()
def join_community(community_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    community = Community.query.get_or_404(community_id)

    block_name = (data.get('block_name') or '').strip()
    floor_name = (data.get('floor_name') or '').strip()
    flat_number = (data.get('flat_number') or '').strip()
    if not block_name or not floor_name or not flat_number:
        return jsonify({'error': 'Block / Tower, Floor, and Flat No. are required (kept private from other members).'}), 400

    existing = CommunityMember.query.filter_by(community_id=community_id, user_id=user_id).first()
    if existing:
        existing.status = 'active'
        existing.block_name = block_name
        existing.floor_name = floor_name
        existing.flat_number = flat_number
        db.session.commit()
        return jsonify({
            'message': f'Joined {community.name}!',
            'community': community.to_dict(),
            'membership': existing.to_dict(include_private=True),
        }), 200

    member = CommunityMember(
        community_id=community_id,
        user_id=user_id,
        role='member',
        block_name=block_name,
        floor_name=floor_name,
        flat_number=flat_number,
        status='active',
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({
        'message': f'Joined {community.name}!',
        'community': community.to_dict(),
        'membership': member.to_dict(include_private=True),
    }), 201


@communities_bp.route('/join-by-code', methods=['POST'])
@jwt_required()
def join_by_code():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    code = (data.get('community_code') or '').strip().upper()
    if not code:
        return jsonify({'error': 'Community code is required.'}), 400

    block_name = (data.get('block_name') or '').strip()
    floor_name = (data.get('floor_name') or '').strip()
    flat_number = (data.get('flat_number') or '').strip()
    if not block_name or not floor_name or not flat_number:
        return jsonify({'error': 'Block / Tower, Floor, and Flat No. are required (kept private from other members).'}), 400

    community = Community.query.filter_by(community_code=code).first()
    if not community:
        return jsonify({'error': f'No community found with code {code}.'}), 404

    existing = CommunityMember.query.filter_by(community_id=community.id, user_id=user_id).first()
    if existing:
        existing.status = 'active'
        existing.block_name = block_name
        existing.floor_name = floor_name
        existing.flat_number = flat_number
        db.session.commit()
        return jsonify({'community': community.to_dict(), 'membership': existing.to_dict(include_private=True)}), 200

    member = CommunityMember(
        community_id=community.id,
        user_id=user_id,
        role='member',
        block_name=block_name,
        floor_name=floor_name,
        flat_number=flat_number,
        status='active',
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({
        'message': f'Joined {community.name}!',
        'community': community.to_dict(),
        'membership': member.to_dict(include_private=True),
    }), 201


@communities_bp.route('/leave', methods=['POST'])
@jwt_required()
def leave_community():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    target_comm_id = data.get('community_id')
    query = CommunityMember.query.filter_by(user_id=user_id, status='active')
    if target_comm_id:
        query = query.filter_by(community_id=int(target_comm_id))
    membership = query.order_by(CommunityMember.joined_at.desc()).first()
    if not membership:
        return jsonify({'error': 'You are not currently in any community.'}), 404

    community = membership.community
    comm_name = community.name if community else 'Community'
    was_admin = (membership.role == 'admin')
    comm_id = membership.community_id
    db.session.delete(membership)
    db.session.flush()

    if was_admin and community:
        next_member = CommunityMember.query.filter_by(community_id=comm_id, status='active').order_by(CommunityMember.joined_at.asc()).first()
        if next_member:
            next_member.role = 'admin'
            community.admin_user_id = next_member.user_id

    db.session.commit()
    return jsonify({'message': f'Exited {comm_name} successfully.'}), 200


@communities_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_community():
    user_id = int(get_jwt_identity())
    membership = CommunityMember.query.filter_by(user_id=user_id, status='active').order_by(CommunityMember.joined_at.desc()).first()
    if not membership:
        return jsonify({'community': None, 'membership': None, 'orders': [], 'members': []}), 200

    community = membership.community
    now = datetime.utcnow()
    raw_orders = CommunityOrder.query.filter_by(community_id=community.id).order_by(CommunityOrder.created_at.desc()).all()
    orders = []
    for o in raw_orders:
        exp = (o.campaign.expires_at if o.campaign else None) or o.expires_at
        if exp and exp <= now and o.items.count() == 0 and float(o.current_qty_kg or 0) <= 0:
            continue
        orders.append(o)
    members = CommunityMember.query.filter_by(community_id=community.id, status='active').all()

    return jsonify({
        'community': community.to_dict(),
        'membership': membership.to_dict(include_private=True),
        'orders': [o.to_dict(include_delivery_contacts=False) for o in orders],
        'members': [m.to_dict(include_private=False) for m in members],
    }), 200


@communities_bp.route('/<int:community_id>/push-cart', methods=['POST'])
@jwt_required()
def push_cart_to_community(community_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    community = Community.query.get_or_404(community_id)

    membership = CommunityMember.query.filter_by(community_id=community_id, user_id=user_id, status='active').first()
    if not membership:
        return jsonify({'error': 'Join this community first before pushing items.'}), 403

    cart_items = CartItem.query.filter_by(buyer_id=user_id).all()
    if not cart_items:
        return jsonify({'error': 'Your cart is empty.'}), 400

    _, _, landmark, phone = _get_user_coords_and_contact(user_id)
    if membership.block_name or membership.flat_number:
        unit_str = ' '.join(p for p in [membership.block_name, membership.floor_name, membership.flat_number] if p)
        landmark = f"{unit_str} ({community.name})" if unit_str else landmark

    note = (data.get('title_note') or '').strip()
    created_orders = []

    for ci in cart_items:
        product = ci.product
        if not product:
            continue

        # Check if an open community order already exists for this product in this community
        existing_co = CommunityOrder.query.filter(
            CommunityOrder.community_id == community_id,
            CommunityOrder.product_id == product.id,
            CommunityOrder.status.in_(['open_demand', 'campaign_active'])
        ).first()

        qty = Decimal(str(ci.quantity))
        if existing_co:
            if existing_co.campaign_id:
                camp = db.session.query(BulkCampaign).with_for_update().get(existing_co.campaign_id)
                prod_locked = db.session.query(Product).with_for_update().get(product.id)
                if camp and ((camp.allocated_kg + qty) > camp.total_stock_kg or prod_locked.available_quantity < qty):
                    return jsonify({
                        'error': f'Only {float(min(camp.total_stock_kg - camp.allocated_kg, prod_locked.available_quantity))} kg left in {product.name}.'
                    }), 400
                if camp:
                    camp.allocated_kg = camp.allocated_kg + qty
                    prod_locked.available_quantity = prod_locked.available_quantity - qty
                    prod_locked.sync_stock_flags()
            existing_co.current_qty_kg = (existing_co.current_qty_kg or Decimal('0.00')) + qty
            target_co = existing_co
        else:
            target_qty = Decimal(str(product.min_bulk_quantity or 50))
            target_co = CommunityOrder(
                community_id=community_id,
                product_id=product.id,
                initiated_by_user_id=user_id,
                title_note=note or f"Group buy for {product.name}",
                target_qty_kg=target_qty,
                current_qty_kg=qty,
                status='open_demand',
            )
            db.session.add(target_co)
            db.session.flush()

        item_entry = CommunityOrderItem(
            community_order_id=target_co.id,
            user_id=user_id,
            quantity_kg=qty,
            delivery_landmark=landmark,
            contact_phone=phone,
        )
        db.session.add(item_entry)
        created_orders.append(target_co)

    if data.get('clear_cart', True):
        CartItem.query.filter_by(buyer_id=user_id).delete()

    db.session.commit()
    return jsonify({
        'message': f'Pushed {len(created_orders)} item(s) to {community.name}!',
        'orders': [o.to_dict() for o in created_orders],
    }), 201


@communities_bp.route('/orders/<int:order_id>/contribute', methods=['POST'])
@jwt_required()
def contribute_to_community_order(order_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    qty_val = data.get('quantity_kg')
    if qty_val is None or float(qty_val) <= 0:
        return jsonify({'error': 'Please enter a valid quantity > 0.'}), 400

    qty = Decimal(str(qty_val))
    co = CommunityOrder.query.get_or_404(order_id)

    membership = CommunityMember.query.filter_by(community_id=co.community_id, user_id=user_id, status='active').first()
    if not membership:
        return jsonify({'error': 'Join this community first to participate.'}), 403

    if co.status not in ('open_demand', 'campaign_active'):
        return jsonify({'error': 'This group order is already locked or completed.'}), 400

    exp = (co.campaign.expires_at if co.campaign else None) or co.expires_at
    if exp and exp <= datetime.utcnow():
        return jsonify({'error': 'Timer has ended for this community deal. You can no longer add to it.'}), 400

    if co.campaign_id:
        camp = db.session.query(BulkCampaign).with_for_update().get(co.campaign_id)
        prod_locked = db.session.query(Product).with_for_update().get(co.product_id)
        if not camp or camp.status != 'active':
            return jsonify({'error': 'This campaign is no longer active.'}), 400
        if not prod_locked or not prod_locked.is_available or prod_locked.available_quantity <= 0:
            return jsonify({'error': 'This product is currently unavailable / out of stock.'}), 400
        if (camp.allocated_kg + qty) > camp.total_stock_kg or prod_locked.available_quantity < qty:
            avail = float(min(camp.total_stock_kg - camp.allocated_kg, prod_locked.available_quantity))
            return jsonify({'error': f'Only {avail} kg remaining in stock pool.'}), 400
        camp.allocated_kg = camp.allocated_kg + qty
        prod_locked.available_quantity = prod_locked.available_quantity - qty
        prod_locked.sync_stock_flags()

    co.current_qty_kg = (co.current_qty_kg or Decimal('0.00')) + qty
    _, _, landmark, phone = _get_user_coords_and_contact(user_id)

    item = CommunityOrderItem(
        community_order_id=co.id,
        user_id=user_id,
        quantity_kg=qty,
        delivery_landmark=landmark,
        contact_phone=phone,
    )
    db.session.add(item)
    db.session.commit()

    return jsonify({
        'message': f'Added {float(qty)} kg to group order!',
        'order': co.to_dict(),
    }), 200


@communities_bp.route('/orders/<int:order_id>/complete-and-distribute', methods=['POST'])
@jwt_required()
def complete_and_distribute_order(order_id):
    user_id = int(get_jwt_identity())
    co = CommunityOrder.query.get_or_404(order_id)
    membership = CommunityMember.query.filter_by(community_id=co.community_id, user_id=user_id, status='active').first()
    if not membership:
        return jsonify({'error': 'Join this community first.'}), 403

    order_dict = co.to_dict()
    final_price = Decimal(str(order_dict['effective_price']))
    co.final_unit_price = final_price
    co.price_distributed = True
    co.status = 'completed'

    notified_users = set()
    for item in co.items.all():
        item.unit_price_locked = final_price
        if item.payment_status not in ('paid', 'cod_confirmed'):
            item.payment_status = 'awaiting_choice'
            item.payment_method = 'COD'
        if item.user_id not in notified_users:
            notified_users.add(item.user_id)
            share_amt = float(item.quantity_kg) * float(final_price)
            db.session.add(Notification(
                user_id=item.user_id,
                title=f"Pool Completed: {order_dict['product_name']}",
                message=f"Final price ₹{float(final_price):.2f}/{order_dict['unit']} locked! Your share is ₹{share_amt:.2f}. Pay in-app or via Cash on Delivery (COD)."
            ))

    db.session.commit()
    return jsonify({
        'message': f'Pool completed & final price ₹{float(final_price):.2f}/{order_dict["unit"]} distributed to members.',
        'order': co.to_dict(),
    }), 200


@communities_bp.route('/orders/<int:order_id>/pay-share', methods=['POST'])
@jwt_required()
def pay_community_share(order_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    method = (data.get('payment_method') or 'COD').upper()
    if method not in ('COD', 'ONLINE'):
        return jsonify({'error': 'payment_method must be COD or ONLINE'}), 400

    co = CommunityOrder.query.get_or_404(order_id)
    if not co.price_distributed and co.status != 'completed':
        return jsonify({'error': 'Payment opens only after the community pool completes and final prices are distributed.'}), 400

    my_items = CommunityOrderItem.query.filter_by(community_order_id=co.id, user_id=user_id).all()
    if not my_items:
        return jsonify({'error': 'You have no items in this community order.'}), 404

    for item in my_items:
        item.payment_method = method
        item.payment_status = 'paid' if method == 'ONLINE' else 'cod_confirmed'

    db.session.commit()
    return jsonify({
        'message': 'Paid in app!' if method == 'ONLINE' else 'Confirmed Cash on Delivery (COD)!',
        'order': co.to_dict(),
    }), 200


@communities_bp.route('/<int:community_id>/reviews', methods=['GET'])
@jwt_required()
def get_community_reviews(community_id):
    Community.query.get_or_404(community_id)
    reviews = CommunityReview.query.filter_by(community_id=community_id).order_by(CommunityReview.created_at.desc()).all()
    return jsonify({'reviews': [r.to_dict() for r in reviews]}), 200
