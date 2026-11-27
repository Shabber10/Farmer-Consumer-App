import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.extensions import db
from backend.models import (
    User, FarmerProfile, Product, Category,
    Community, CommunityMember, BulkCampaign, CampaignTargetCommunity,
    CommunityOrder, CommunityOrderItem, CommunityReview
)
from backend.export_db_excel import export_all_tables_to_excel


def seed_hybrid_data():
    app = create_app()
    with app.app_context():
        db.create_all()

        # Find an existing farmer and buyer from DB (or create clean ones if missing)
        farmer_user = User.query.filter_by(role='farmer').first()
        buyer_user = User.query.filter_by(role='buyer').first()

        if not farmer_user or not farmer_user.farmer_profile:
            print("No farmer found in DB; skipping community campaign seed.")
            return
        farmer = farmer_user.farmer_profile

        if not buyer_user:
            print("No buyer found in DB; skipping community seed.")
            return

        # Ensure a Dragon Fruit product exists for the shared 100 kg campaign example
        cat = Category.query.filter(Category.name.ilike('%Fruit%')).first() or Category.query.first()
        dragon_prod = Product.query.filter(Product.name.ilike('%Dragon Fruit%')).first()
        if not dragon_prod and cat:
            dragon_prod = Product(
                farmer_id=farmer.id,
                category_id=cat.id,
                name='Fresh Red Dragon Fruit',
                image_url='https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80',
                price=Decimal('100.00'),
                bulk_price=Decimal('70.00'),
                min_bulk_quantity=Decimal('50.00'),
                delivery_price_per_km=Decimal('5.00'),
                max_delivery_km=Decimal('18.00'),
                unit='kg',
                available_quantity=Decimal('100.00'),
                location=f"{farmer.village}, {farmer.district}",
                is_available=True,
            )
            db.session.add(dragon_prod)
            db.session.flush()

        # Seed real apartment communities if none exist
        if Community.query.count() == 0:
            comm_specs = [
                {
                    'code': 'KD-MHM01',
                    'name': 'My Home Mangala',
                    'type': 'gated_society',
                    'address': 'Kondapur Main Road, Hyderabad',
                    'dropoff': 'Tower B Security Desk',
                    'lat': Decimal('17.458900'),
                    'lng': Decimal('78.362100'),
                    'pincode': '500084',
                },
                {
                    'code': 'KD-RBR02',
                    'name': 'Rainbow Residency',
                    'type': 'apartment',
                    'address': 'Madhapur Image Hospital Lane, Hyderabad',
                    'dropoff': 'Main Gate Parcel Room',
                    'lat': Decimal('17.448100'),
                    'lng': Decimal('78.382200'),
                    'pincode': '500081',
                },
                {
                    'code': 'KD-GVA03',
                    'name': 'Green Valley Apartments',
                    'type': 'apartment',
                    'address': 'HITEC City Phase 2, Madhapur',
                    'dropoff': 'Clubhouse Lobby',
                    'lat': Decimal('17.443500'),
                    'lng': Decimal('78.377200'),
                    'pincode': '500081',
                },
            ]
            created_comms = []
            for spec in comm_specs:
                c = Community(
                    community_code=spec['code'],
                    name=spec['name'],
                    community_type=spec['type'],
                    address_line=spec['address'],
                    dropoff_point=spec['dropoff'],
                    latitude=spec['lat'],
                    longitude=spec['lng'],
                    pincode=spec['pincode'],
                    admin_user_id=buyer_user.id,
                )
                db.session.add(c)
                db.session.flush()
                created_comms.append(c)

            # Join buyer to My Home Mangala as admin
            db.session.add(CommunityMember(
                community_id=created_comms[0].id,
                user_id=buyer_user.id,
                role='admin',
                block_name='Tower B',
                floor_name='5th Floor',
                flat_number='B-503',
                status='active',
            ))

            # Seed a verified farmer review on Rainbow Residency & My Home Mangala
            db.session.add(CommunityReview(
                community_id=created_comms[0].id,
                farmer_id=farmer.id,
                rating=5,
                payment_score=5,
                pickup_score=5,
                communication_score=5,
                comment='Prompt payment and security desk helped unload crates quickly.',
            ))
            db.session.add(CommunityReview(
                community_id=created_comms[1].id,
                farmer_id=farmer.id,
                rating=4,
                payment_score=5,
                pickup_score=4,
                communication_score=4,
                comment='Smooth coordination at Main Gate.',
            ))

            # Seed one active shared-inventory BulkCampaign (100 kg Dragon Fruit across 2 apartments)
            if dragon_prod:
                now = datetime.utcnow()
                expires = now + timedelta(minutes=180)
                camp = BulkCampaign(
                    farmer_id=farmer.id,
                    product_id=dragon_prod.id,
                    mode='supply_campaign',
                    total_stock_kg=Decimal('100.00'),
                    allocated_kg=Decimal('35.00'),
                    min_bulk_kg=Decimal('50.00'),
                    base_price=Decimal('100.00'),
                    tier_30_price=Decimal('90.00'),
                    tier_80_price=Decimal('80.00'),
                    tier_100_price=Decimal('70.00'),
                    delivery_price_per_km=Decimal('5.00'),
                    max_delivery_km=Decimal('18.00'),
                    reservation_agreed=True,
                    duration_minutes=180,
                    starts_at=now,
                    expires_at=expires,
                    status='active',
                )
                db.session.add(camp)
                db.session.flush()

                for idx, qty in [(0, Decimal('20.00')), (1, Decimal('15.00'))]:
                    comm = created_comms[idx]
                    db.session.add(CampaignTargetCommunity(campaign_id=camp.id, community_id=comm.id))
                    co = CommunityOrder(
                        community_id=comm.id,
                        campaign_id=camp.id,
                        product_id=dragon_prod.id,
                        initiated_by_user_id=farmer_user.id,
                        title_note='Reserved Farm Harvest — Shared 100 kg Pool',
                        target_qty_kg=Decimal('100.00'),
                        current_qty_kg=qty,
                        status='campaign_active',
                        expires_at=expires,
                    )
                    db.session.add(co)
                    db.session.flush()
                    db.session.add(CommunityOrderItem(
                        community_order_id=co.id,
                        user_id=buyer_user.id,
                        quantity_kg=qty,
                        delivery_landmark=comm.dropoff_point,
                        contact_phone=buyer_user.mobile_number,
                    ))

        db.session.commit()
        excel_path = export_all_tables_to_excel()
        print(f"Seeded hybrid community marketplace & exported Excel to: {excel_path}")


if __name__ == '__main__':
    seed_hybrid_data()
