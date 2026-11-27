from datetime import datetime, timedelta
from decimal import Decimal
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.extensions import db
from backend.models import (
    User, FarmerProfile, Product,
    Community, BulkCampaign, CampaignTargetCommunity,
    CommunityOrder, CommunityOrderItem, CommunityReview
)
from backend.utils_geo import haversine_meters
from backend.export_db_excel import export_all_tables_to_excel

campaigns_bp = Blueprint('campaigns', __name__)


def _get_farmer_profile(user_id):
    user = User.query.get(user_id)
    if not user or user.role != 'farmer' or not user.farmer_profile:
        return None
    return user.farmer_profile


@campaigns_bp.route('/farmer/communities', methods=['GET'])
@jwt_required()
def discover_communities_for_farmer():
    user_id = int(get_jwt_identity())
    farmer = _get_farmer_profile(user_id)
    if not farmer:
        return jsonify({'error': 'Farmer account required.'}), 403

    max_km = request.args.get('max_km', default=20.0, type=float)
    sort_by = request.args.get('sort_by', default='distance', type=str)

    f_lat = float(farmer.latitude) if farmer.latitude is not None else 17.4474
    f_lng = float(farmer.longitude) if farmer.longitude is not None else 78.3762

    comms = Community.query.all()
    results = []
    for comm in comms:
        dist_m = haversine_meters(f_lat, f_lng, comm.latitude, comm.longitude)
        dist_km = round(dist_m / 1000.0, 2) if dist_m is not None else 0.0
        if dist_km <= max_km:
            c_dict = comm.to_dict(distance_m=dist_m)
            c_dict['recent_reviews'] = [
                r.to_dict() for r in comm.reviews.order_by(CommunityReview.created_at.desc()).limit(3).all()
            ]
            results.append(c_dict)

    if sort_by == 'rating':
        results.sort(key=lambda c: (-c['avg_farmer_rating'], c.get('distance_km', 999)))
    elif sort_by == 'members':
        results.sort(key=lambda c: (-c['members_count'], c.get('distance_km', 999)))
    else:
        results.sort(key=lambda c: c.get('distance_km', 999))

    return jsonify({
        'communities': results,
        'farmer_location': {'latitude': f_lat, 'longitude': f_lng},
    }), 200


@campaigns_bp.route('/farmer/demand-requests', methods=['GET'])
@jwt_required()
def get_community_demand_requests():
    user_id = int(get_jwt_identity())
    farmer = _get_farmer_profile(user_id)
    if not farmer:
        return jsonify({'error': 'Farmer account required.'}), 403

    f_lat = float(farmer.latitude) if farmer.latitude is not None else 17.4474
    f_lng = float(farmer.longitude) if farmer.longitude is not None else 78.3762

    open_orders = CommunityOrder.query.filter_by(status='open_demand').order_by(CommunityOrder.created_at.desc()).all()
    results = []
    for co in open_orders:
        comm = co.community
        dist_m = haversine_meters(f_lat, f_lng, comm.latitude, comm.longitude) if comm else None
        d = co.to_dict(include_delivery_contacts=False)
        d['distance_km'] = round(dist_m / 1000.0, 2) if dist_m is not None else None
        d['community_rating'] = comm.to_dict().get('avg_farmer_rating', 0.0) if comm else 0.0
        results.append(d)

    return jsonify({'demand_requests': results}), 200


@campaigns_bp.route('/farmer/create', methods=['POST'])
@jwt_required()
def create_bulk_campaign():
    user_id = int(get_jwt_identity())
    farmer = _get_farmer_profile(user_id)
    if not farmer:
        return jsonify({'error': 'Farmer account required.'}), 403

    data = request.get_json() or {}
    if not data.get('reservation_agreed'):
        return jsonify({'error': 'You must confirm the Stock Reservation Agreement before starting the timer.'}), 400

    product = Product.query.filter_by(id=data.get('product_id'), farmer_id=farmer.id).first()
    if not product:
        return jsonify({'error': 'Valid product owned by you is required.'}), 404

    total_stock = Decimal(str(data.get('total_stock_kg') or product.available_quantity))
    min_bulk = Decimal(str(data.get('min_bulk_kg') or product.min_bulk_quantity or 50))
    duration_minutes = int(data.get('duration_minutes') or 180)
    target_ids = data.get('target_community_ids') or []

    if total_stock <= 0:
        return jsonify({'error': 'Reserved stock must be greater than 0.'}), 400
    if not target_ids:
        return jsonify({'error': 'Select at least one apartment/community on the map or list.'}), 400

    base_price = Decimal(str(data.get('base_price') or product.price))
    tier_30 = Decimal(str(data.get('tier_30_price') or round(float(base_price) * 0.90, 2)))
    tier_80 = Decimal(str(data.get('tier_80_price') or round(float(base_price) * 0.80, 2)))
    tier_100 = Decimal(str(data.get('tier_100_price') or (product.bulk_price or round(float(base_price) * 0.70, 2))))

    now = datetime.utcnow()
    expires = now + timedelta(minutes=duration_minutes)

    campaign = BulkCampaign(
        farmer_id=farmer.id,
        product_id=product.id,
        mode=data.get('mode') or 'supply_campaign',
        total_stock_kg=total_stock,
        allocated_kg=Decimal('0.00'),
        min_bulk_kg=min_bulk,
        base_price=base_price,
        tier_30_price=tier_30,
        tier_80_price=tier_80,
        tier_100_price=tier_100,
        delivery_price_per_km=Decimal(str(product.delivery_price_per_km or 0)),
        max_delivery_km=Decimal(str(product.max_delivery_km or 20)),
        reservation_agreed=True,
        duration_minutes=duration_minutes,
        starts_at=now,
        expires_at=expires,
        status='active',
    )
    db.session.add(campaign)
    db.session.flush()

    demand_order_id = data.get('demand_order_id')
    if demand_order_id:
        demand_co = CommunityOrder.query.get(demand_order_id)
        if demand_co:
            demand_co.campaign_id = campaign.id
            demand_co.status = 'campaign_active'
            demand_co.expires_at = expires
            campaign.allocated_kg = (campaign.allocated_kg or Decimal('0.00')) + (demand_co.current_qty_kg or Decimal('0.00'))
            if demand_co.community_id not in target_ids:
                target_ids.append(demand_co.community_id)

    for cid in target_ids:
        comm = Community.query.get(cid)
        if not comm:
            continue
        db.session.add(CampaignTargetCommunity(campaign_id=campaign.id, community_id=comm.id))
        existing_co = CommunityOrder.query.filter_by(campaign_id=campaign.id, community_id=comm.id).first()
        if not existing_co:
            db.session.add(CommunityOrder(
                community_id=comm.id,
                campaign_id=campaign.id,
                product_id=product.id,
                initiated_by_user_id=user_id,
                title_note=f"Reserved Farm Deal by {farmer.farm_name or 'Farmer'}",
                target_qty_kg=total_stock,
                current_qty_kg=Decimal('0.00'),
                status='campaign_active',
                expires_at=expires,
            ))

    db.session.commit()
    return jsonify({
        'message': 'Stock reserved and campaign launched to selected communities!',
        'campaign': campaign.to_dict(),
    }), 201


@campaigns_bp.route('/farmer/list', methods=['GET'])
@jwt_required()
def list_farmer_campaigns():
    user_id = int(get_jwt_identity())
    farmer = _get_farmer_profile(user_id)
    if not farmer:
        return jsonify({'error': 'Farmer account required.'}), 403

    campaigns = BulkCampaign.query.filter_by(farmer_id=farmer.id).order_by(BulkCampaign.created_at.desc()).all()
    results = []
    for camp in campaigns:
        c_dict = camp.to_dict()
        # Reveal delivery contacts & landmarks ONLY after campaign is locked/delivering/completed
        reveal_contacts = camp.status in ('locked', 'out_for_delivery', 'completed')
        cos = CommunityOrder.query.filter_by(campaign_id=camp.id).all()
        c_dict['community_orders'] = [co.to_dict(include_delivery_contacts=reveal_contacts) for co in cos]
        results.append(c_dict)

    return jsonify({'campaigns': results}), 200


@campaigns_bp.route('/farmer/<int:campaign_id>/lock-and-deliver', methods=['POST'])
@jwt_required()
def lock_and_deliver_campaign(campaign_id):
    user_id = int(get_jwt_identity())
    farmer = _get_farmer_profile(user_id)
    if not farmer:
        return jsonify({'error': 'Farmer account required.'}), 403

    camp = BulkCampaign.query.filter_by(id=campaign_id, farmer_id=farmer.id).first_or_404()
    data = request.get_json() or {}
    next_status = data.get('status') or 'locked'
    if next_status not in ('locked', 'out_for_delivery', 'completed'):
        return jsonify({'error': 'Invalid campaign status.'}), 400

    final_price, active_tier = camp.current_tier_price()
    camp.status = next_status

    co_status = 'confirmed' if next_status == 'locked' else ('out_for_delivery' if next_status == 'out_for_delivery' else 'delivered')
    cos = CommunityOrder.query.filter_by(campaign_id=camp.id).all()
    for co in cos:
        co.status = co_status
        for item in co.items.all():
            item.unit_price_locked = Decimal(str(final_price))

    db.session.commit()
    return jsonify({
        'message': f'Campaign marked as {next_status}. Delivery details unlocked!',
        'campaign': camp.to_dict(),
        'final_unit_price': final_price,
        'active_tier': active_tier,
        'community_orders': [co.to_dict(include_delivery_contacts=True) for co in cos],
    }), 200


@campaigns_bp.route('/farmer/communities/<int:community_id>/review', methods=['POST'])
@jwt_required()
def farmer_review_community(community_id):
    user_id = int(get_jwt_identity())
    farmer = _get_farmer_profile(user_id)
    if not farmer:
        return jsonify({'error': 'Farmer account required.'}), 403

    Community.query.get_or_404(community_id)
    data = request.get_json() or {}
    rating = int(data.get('rating') or 5)
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5.'}), 400

    review = CommunityReview(
        community_id=community_id,
        farmer_id=farmer.id,
        community_order_id=data.get('community_order_id'),
        rating=rating,
        payment_score=int(data.get('payment_score') or rating),
        pickup_score=int(data.get('pickup_score') or rating),
        communication_score=int(data.get('communication_score') or rating),
        comment=(data.get('comment') or '').strip(),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({
        'message': 'Thank you! Community rating saved.',
        'review': review.to_dict(),
    }), 201


@campaigns_bp.route('/export-excel', methods=['GET'])
def export_excel_endpoint():
    path = export_all_tables_to_excel()
    return send_file(path, as_attachment=True, download_name='kisandirect_database_export.xlsx')
