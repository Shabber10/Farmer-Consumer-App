import os
import sys
import random
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.extensions import db
from backend.models import (
    User, FarmerProfile, BuyerProfile, Address,
    Category, Product, Community, CommunityMember
)
from backend.export_db_excel import export_all_tables_to_excel

FARMER_NAMES = [
    'Venkatesh Rao', 'Srinivas Reddy', 'Ramesh Goud', 'Narsimha Yadav', 'Lakshmi Narayana',
    'Padma Devi', 'Malleshwar Rao', 'Koteswara Rao', 'Satyam Naidu', 'Anjaiah Patel',
    'Rajeshwar Verma', 'Subba Rao', 'Bhaskar Reddy', 'Chandraiah Goud', 'Prakasham Nayak',
    'Sujatha Kumari', 'Harish Chandra', 'Murali Krishna', 'Kishan Lal', 'Devendar Singh',
]

CONSUMER_NAMES = [
    'Aarav Sharma', 'Priya Nair', 'Rohan Kulkarni', 'Sneha Iyer', 'Vikram Aditya',
    'Meera Deshmukh', 'Karthikeya Rao', 'Divya Menon', 'Siddharth Joshi', 'Anjali Verma',
    'Nikhil Kapoor', 'Pooja Reddy', 'Arjun Malhotra', 'Kavya Krishnan', 'Rahul Choudhary',
    'Neha Agarwal', 'Varun Bansal', 'Swati Mishra', 'Aditya Saxena', 'Ritu Chatterjee',
]

FARM_AREAS = [
    ('Shankarpally', 'Rangareddy', '501203', 17.4562, 78.1324),
    ('Moinabad', 'Rangareddy', '501504', 17.3291, 78.2683),
    ('Shamshabad', 'Rangareddy', '501218', 17.2543, 78.4012),
    ('Medchal', 'Medchal-Malkajgiri', '501401', 17.6295, 78.4814),
    ('Ghatkesar', 'Medchal-Malkajgiri', '501301', 17.4512, 78.6819),
    ('Patancheru', 'Sangareddy', '502319', 17.5326, 78.2642),
    ('Chevella', 'Rangareddy', '501503', 17.3065, 78.1348),
    ('Tellapur', 'Sangareddy', '502032', 17.4692, 78.2889),
]

CONSUMER_AREAS = [
    ('Madhapur', 'Hyderabad', '500081', 17.4483, 78.3915, 'Near Cyber Towers'),
    ('Kondapur', 'Hyderabad', '500084', 17.4622, 78.3568, 'Opposite Botanical Garden'),
    ('Gachibowli', 'Hyderabad', '500032', 17.4401, 78.3489, 'Near DLF Cyber City'),
    ('Miyapur', 'Hyderabad', '500049', 17.4968, 78.3614, 'Near Metro Pillar 612'),
    ('Kukatpally', 'Hyderabad', '500072', 17.4849, 78.4138, 'Phase 3 KPHB Main Gate'),
]

SAMPLE_PRODUCTS = [
    ('Desi Tomatoes', 'Vegetables', 'kg', 28, 20, 80, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'),
    ('Red Onions', 'Vegetables', 'kg', 34, 25, 120, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80'),
    ('Farm Fresh Potatoes', 'Vegetables', 'kg', 30, 22, 150, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80'),
    ('Green Spinach', 'Vegetables', 'bunch', 20, 14, 60, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80'),
    ('Banganapalli Mangoes', 'Fruits', 'kg', 95, 70, 90, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80'),
    ('Pomegranate Ruby', 'Fruits', 'kg', 130, 95, 70, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'),
    ('Sona Masoori Rice', 'Grains', 'kg', 62, 50, 200, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'),
    ('Organic Toor Dal', 'Pulses', 'kg', 145, 118, 100, 'https://images.unsplash.com/photo-1585996926237-9a4b7d2b8a3f?w=600&auto=format&fit=crop&q=80'),
]


def seed_20_each():
    app = create_app()
    with app.app_context():
        db.create_all()
        random.seed(2026)

        cat_map = {c.name.lower(): c.id for c in Category.query.all()}
        default_cat_id = next(iter(cat_map.values()), 1)

        farmers_created = 0
        for i in range(1, 21):
            email = f"farmer_{i:02d}@kisandirect.in"
            if User.query.filter_by(email=email).first():
                continue
            name = FARMER_NAMES[i - 1]
            village, district, pincode, base_lat, base_lng = FARM_AREAS[i % len(FARM_AREAS)]
            lat = Decimal(str(round(base_lat + random.uniform(-0.015, 0.015), 6)))
            lng = Decimal(str(round(base_lng + random.uniform(-0.015, 0.015), 6)))

            u = User(
                full_name=name,
                email=email,
                mobile_number=f"981100{i:04d}",
                role='farmer',
                is_verified=True,
            )
            u.set_password('pass1234')
            db.session.add(u)
            db.session.flush()

            fp = FarmerProfile(
                user_id=u.id,
                farm_name=f"{name.split()[0]} Agro Farms",
                village=village,
                district=district,
                state='Telangana',
                pincode=pincode,
                landmark=f"Near {village} Gram Panchayat",
                latitude=lat,
                longitude=lng,
            )
            db.session.add(fp)
            db.session.flush()

            # Add 2 products per farmer
            for prod_spec in random.sample(SAMPLE_PRODUCTS, 2):
                pname, cat_name, unit, price, bulk_p, qty, img = prod_spec
                cat_id = cat_map.get(cat_name.lower(), default_cat_id)
                db.session.add(Product(
                    farmer_id=fp.id,
                    category_id=cat_id,
                    name=pname,
                    image_url=img,
                    price=Decimal(str(price)),
                    bulk_price=Decimal(str(bulk_p)),
                    min_bulk_quantity=Decimal(str(random.choice([30, 40, 50]))),
                    delivery_price_per_km=Decimal(str(random.randint(3, 10))),
                    max_delivery_km=Decimal(str(random.randint(10, 19))),
                    unit=unit,
                    available_quantity=Decimal(str(qty)),
                    location=f"{village}, {district}",
                    is_available=True,
                ))
            farmers_created += 1

        db.session.flush()
        communities = Community.query.all()

        consumers_created = 0
        for i in range(1, 21):
            email = f"consumer_{i:02d}@kisandirect.in"
            if User.query.filter_by(email=email).first():
                continue
            name = CONSUMER_NAMES[i - 1]
            area, city, pincode, base_lat, base_lng, landmark = CONSUMER_AREAS[i % len(CONSUMER_AREAS)]
            lat = Decimal(str(round(base_lat + random.uniform(-0.008, 0.008), 6)))
            lng = Decimal(str(round(base_lng + random.uniform(-0.008, 0.008), 6)))

            u = User(
                full_name=name,
                email=email,
                mobile_number=f"992200{i:04d}",
                role='buyer',
                is_verified=True,
            )
            u.set_password('pass1234')
            db.session.add(u)
            db.session.flush()

            db.session.add(BuyerProfile(user_id=u.id))
            db.session.add(Address(
                user_id=u.id,
                door_number=f"Flat {100 + i}",
                street=f"{area} Main Road",
                village=area,
                district=city,
                state='Telangana',
                pincode=pincode,
                landmark=landmark,
                latitude=lat,
                longitude=lng,
                is_default=True,
            ))

            if communities:
                comm = communities[i % len(communities)]
                if not CommunityMember.query.filter_by(community_id=comm.id, user_id=u.id).first():
                    db.session.add(CommunityMember(
                        community_id=comm.id,
                        user_id=u.id,
                        role='member',
                        block_name=f"Block {chr(65 + (i % 4))}",
                        floor_name=f"{(i % 8) + 1}th Floor",
                        flat_number=f"{chr(65 + (i % 4))}-{100 + i}",
                        status='active',
                    ))
            consumers_created += 1

        db.session.commit()
        excel_path = export_all_tables_to_excel()
        print(f"Created {farmers_created} farmers and {consumers_created} consumers.")
        print(f"Total farmers: {User.query.filter_by(role='farmer').count()}, Total consumers: {User.query.filter_by(role='buyer').count()}, Total products: {Product.query.count()}")
        print(f"Updated Excel export: {excel_path}")


if __name__ == '__main__':
    seed_20_each()
