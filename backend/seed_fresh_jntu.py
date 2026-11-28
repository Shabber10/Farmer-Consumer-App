import os
import sys
import random
from datetime import datetime, date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.extensions import db
from backend.models import (
    User, FarmerProfile, BuyerProfile, Address, Category, Product, CartItem,
    Order, FarmerOrder, OrderItem, Payment, Notification, SupportRequest,
    ProductReview, OrderFeedback, Community, CommunityMember,
    BulkCampaign, CampaignTargetCommunity, CommunityOrder, CommunityOrderItem, CommunityReview
)

CATEGORY_SPECS = [
    ("Vegetables", "Fresh, farm-harvested green vegetables, tubers, and organic produce.", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80"),
    ("Fruits", "Naturally ripened, pesticide-free seasonal fruits harvested directly from orchards.", "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80"),
    ("Grains", "Traditional paddy, wheat, millets, and staple cereals grown with authentic farming methods.", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80"),
    ("Pulses", "High-protein lentils, desi chickpeas, red gram (toor dal), and unpolished pulses.", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Tur_Dal.JPG/960px-Tur_Dal.JPG"),
    ("Spices", "Pure farm turmeric, Guntur red chillies, coriander seeds, and whole aromatic spices.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80"),
    ("Other Products", "Cold-pressed organic oils, wild forest honey, organic jaggery, and rural dairy products.", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80"),
]

# Farm hubs near JNTU Metro Station (17.4987, 78.3887) within 5–18 km
FARM_HUBS = [
    ("Patancheru", "Sangareddy", "502319", 17.5326, 78.2642),
    ("Tellapur", "Sangareddy", "502032", 17.4692, 78.2889),
    ("Bachupally", "Medchal-Malkajgiri", "500090", 17.5480, 78.3610),
    ("Dundigal", "Medchal-Malkajgiri", "500043", 17.5890, 78.4120),
    ("Medchal", "Medchal-Malkajgiri", "501401", 17.6100, 78.4600),
    ("Bowenpally", "Hyderabad", "500011", 17.4772, 78.4754),
    ("Kompally", "Medchal-Malkajgiri", "500100", 17.5450, 78.4870),
    ("Miyapur", "Hyderabad", "500049", 17.5110, 78.3520),
    ("Ameenpur", "Sangareddy", "502032", 17.5230, 78.3210),
    ("Nizampet Agro Belt", "Medchal-Malkajgiri", "500090", 17.5220, 78.3890),
    ("Alwal", "Hyderabad", "500010", 17.5020, 78.5010),
    ("Bolarum", "Hyderabad", "500010", 17.5310, 78.5150),
    ("Narsingi", "Rangareddy", "500075", 17.3920, 78.3560),
    ("Kollur", "Sangareddy", "502300", 17.4650, 78.2480),
    ("Chandanagar", "Hyderabad", "500050", 17.4940, 78.3270),
]

FARMER_FIRST_NAMES = [
    "Ramesh", "Lakshmi", "Venkatesh", "Srinivas", "Padma", "Narsimha", "Anjaiah", "Malleshwar", "Satyam", "Sujatha",
    "Bhaskar", "Murali", "Harish", "Koteswara", "Devendar", "Rajeshwar", "Subba", "Chandraiah", "Prakasham", "Kishan",
    "Mahesh", "Ramulu", "Yadaiah", "Balram", "Sudhakar",
]

FARMER_LAST_NAMES = [
    "Patel", "Devi", "Rao", "Reddy", "Kumari", "Yadav", "Goud", "Naidu", "Verma", "Krishna",
]

FARM_SUFFIXES = [
    "Organic Farms", "Natural Orchards", "Agro Farms", "Rythu Farm", "Fresh Greens",
    "Harvest Hub", "Farm Collective", "Natural Produce", "Kisan Orchards", "Eco Farms",
]

PRODUCT_CATALOG = [
    ("Desi Tomatoes", "Vegetables", "kg", 32, 22, 35, 140, True, "both", "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"),
    ("Red Onions", "Vegetables", "kg", 38, 28, 40, 180, False, "both", "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80"),
    ("Farm Fresh Potatoes", "Vegetables", "kg", 30, 22, 40, 200, False, "both", "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80"),
    ("Green Spinach (Palak)", "Vegetables", "bunch", 24, 16, 25, 95, True, "both", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80"),
    ("Okra (Bhindi)", "Vegetables", "kg", 48, 35, 25, 110, True, "individual_only", "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80"),
    ("Fresh Carrots", "Vegetables", "kg", 54, 40, 30, 120, True, "both", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80"),
    ("Green Capsicum", "Vegetables", "kg", 60, 44, 25, 100, False, "both", "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80"),
    ("Cauliflower", "Vegetables", "piece", 40, 28, 25, 95, True, "both", "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80"),
    ("Banganapalli Mangoes", "Fruits", "kg", 110, 82, 35, 160, True, "both", "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"),
    ("Fresh Red Dragon Fruit", "Fruits", "kg", 140, 98, 35, 120, True, "both", "https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80"),
    ("Ruby Pomegranate", "Fruits", "kg", 150, 112, 30, 110, True, "both", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"),
    ("Yellaki Bananas", "Fruits", "dozen", 65, 48, 25, 120, False, "both", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80"),
    ("Sweet Watermelon", "Fruits", "piece", 55, 38, 25, 130, False, "both", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Watermelon_cross_BNC.jpg/960px-Watermelon_cross_BNC.jpg"),
    ("Fresh Guava", "Fruits", "kg", 70, 50, 25, 100, True, "individual_only", "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600&auto=format&fit=crop&q=80"),
    ("Sona Masoori Rice (Aged)", "Grains", "kg", 64, 52, 40, 300, True, "both", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"),
    ("Foxtail Millet (Korralu)", "Grains", "kg", 95, 76, 25, 120, True, "both", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80"),
    ("Organic Jowar (Sorghum)", "Grains", "kg", 58, 45, 35, 150, True, "apartments_only", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"),
    ("Unpolished Toor Dal", "Pulses", "kg", 155, 126, 30, 140, True, "both", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Tur_Dal.JPG/960px-Tur_Dal.JPG"),
    ("Desi Moong Dal", "Pulses", "kg", 140, 114, 25, 120, True, "both", "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&auto=format&fit=crop&q=80"),
    ("Black Chickpeas (Kala Chana)", "Pulses", "kg", 110, 88, 25, 110, False, "both", "https://upload.wikimedia.org/wikipedia/commons/3/3d/Chickpea.jpg"),
    ("Nizamabad Turmeric Powder", "Spices", "kg", 220, 175, 20, 90, True, "both", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80"),
    ("Guntur Red Chillies", "Spices", "kg", 260, 210, 20, 85, False, "both", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80"),
    ("Wild Forest Honey", "Other Products", "litre", 480, 390, 20, 75, True, "both", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"),
    ("Organic Sugarcane Jaggery", "Other Products", "kg", 85, 66, 30, 140, True, "both", "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Jaggery%2C_bd.jpg/960px-Jaggery%2C_bd.jpg"),
]

# 4 Apartment Communities near JNTU Metro Station, Hyderabad
JNTU_APARTMENTS = [
    ("KD-LBZ01", "Lodha Bellezza", "gated_society", "KPHB Phase 4, Near JNTU Metro Station, Hyderabad", "Tower A Security Desk", 17.4932, 78.3915, "500072"),
    ("KD-MLT02", "Malaysian Township", "gated_society", "Rain Tree Park, KPHB Phase 5, Hyderabad", "Clubhouse Parcel Room", 17.4895, 78.3842, "500072"),
    ("KD-VTP03", "Vertex Panache", "apartment", "Nizampet Road, Near JNTU Metro, Hyderabad", "Main Gate Security", 17.5085, 78.3865, "500090"),
    ("KD-VSU04", "Vasavi Urban", "gated_society", "Bachupally-Nizampet Link Road, Hyderabad", "Block C Lobby", 17.5210, 78.3810, "500090"),
]

FIRST_NAMES = [
    "Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Meera", "Karthik", "Divya", "Siddharth", "Anjali",
    "Nikhil", "Pooja", "Arjun", "Kavya", "Rahul", "Neha", "Varun", "Swati", "Aditya", "Ritu",
    "Sai", "Harika", "Pranav", "Keerthi", "Manish", "Shruti", "Teja", "Lavanya", "Deepak", "Nandini",
    "Suresh", "Ananya", "Kiran", "Bhavana", "Vivek", "Meghana", "Tarun", "Sravani", "Gaurav", "Ishita",
    "Akhil", "Pallavi", "Chaitanya", "Spandana", "Pavan", "Sindhu", "Vamsi", "Likhitha", "Naveen", "Soumya",
]

LAST_NAMES = [
    "Sharma", "Nair", "Kulkarni", "Iyer", "Reddy", "Deshmukh", "Rao", "Menon", "Joshi", "Verma",
    "Kapoor", "Malhotra", "Krishnan", "Choudhary", "Agarwal", "Bansal", "Mishra", "Saxena", "Goud", "Patel",
]

JNTU_STREETS = [
    ("KPHB Phase 1 Main Rd", "Kukatpally", "500072", "Near JNTU Metro Pillar 714", 17.4987, 78.3887),
    ("KPHB Phase 3 Road", "Kukatpally", "500072", "Opposite Forum Sujana Mall", 17.4849, 78.3905),
    ("Nizampet X Road", "Nizampet", "500090", "Near Hanuman Temple", 17.5042, 78.3879),
    ("Pragathi Nagar Lake Rd", "Pragathi Nagar", "500090", "Near Aleap Circle", 17.5162, 78.3964),
    ("Vasanth Nagar Colony", "Kukatpally", "500085", "Behind JNTU College Gate", 17.4958, 78.3845),
    ("Hydernagar Main Rd", "Hydernagar", "500085", "Near Metro Station Exit B", 17.5015, 78.3782),
]

REVIEW_COMMENTS = [
    "Super fresh harvest! Delivered right on time near JNTU Metro.",
    "Farm-direct quality is noticeably fresher and sweeter than supermarket produce.",
    "Clean packaging and accurate weight. Will definitely reorder!",
    "Great bulk discount for our apartment group, everyone loved it.",
    "Crisp vegetables harvested the same morning, zero spoilage.",
    "Polite farmer delivery directly to our security gate.",
]


def reset_and_seed_fresh():
    """Purge all non-admin data and seed 100 farmers (each with >=1 online product with harvest_date), 50 JNTU consumers, 4 apartments, and rich order/review history."""
    random.seed(202611)
    today = date.today()

    # 1. Clear child-to-parent tables cleanly
    CommunityReview.query.delete()
    CommunityOrderItem.query.delete()
    CommunityOrder.query.delete()
    CampaignTargetCommunity.query.delete()
    BulkCampaign.query.delete()
    CommunityMember.query.delete()
    Community.query.delete()
    OrderFeedback.query.delete()
    ProductReview.query.delete()
    Payment.query.delete()
    OrderItem.query.delete()
    FarmerOrder.query.delete()
    Order.query.delete()
    CartItem.query.delete()
    Product.query.delete()
    FarmerProfile.query.delete()
    BuyerProfile.query.delete()
    Address.query.delete()
    Notification.query.delete()
    SupportRequest.query.delete()
    User.query.filter(User.role != 'admin').delete()
    db.session.flush()

    # 2. Ensure Admin exists
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        admin = User(
            full_name="Platform Administrator",
            email="admin@gmail.com",
            mobile_number="9000000000",
            role="admin",
            language="en",
            is_verified=True,
            is_active=True,
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.flush()

    # 3. Ensure Categories exist (and update images)
    cat_map = {}
    for name, desc, img in CATEGORY_SPECS:
        cat = Category.query.filter_by(name=name).first()
        if not cat:
            cat = Category(name=name, description=desc, image=img, is_active=True)
            db.session.add(cat)
            db.session.flush()
        else:
            cat.image = img
        cat_map[name] = cat.id

    # 4. Seed 100 Farmers around Hyderabad / JNTU Metro & >= 1 online Product per farmer (all with harvest_date)
    farmers = []
    products = []
    for idx in range(1, 101):
        fname = f"{FARMER_FIRST_NAMES[(idx - 1) % len(FARMER_FIRST_NAMES)]} {FARMER_LAST_NAMES[((idx - 1) // 10 + idx) % len(FARMER_LAST_NAMES)]}"
        village, district, pincode, base_lat, base_lng = FARM_HUBS[(idx - 1) % len(FARM_HUBS)]
        farm_name = f"{fname.split()[0]} {FARM_SUFFIXES[(idx - 1) % len(FARM_SUFFIXES)]}"

        u = User(
            full_name=fname,
            email=f"farmer{idx}@kisandirect.in",
            mobile_number=f"987654{idx:04d}",
            role="farmer",
            language="en",
            is_verified=True,
            is_active=True,
        )
        u.set_password("farmer123")
        db.session.add(u)
        db.session.flush()

        fp = FarmerProfile(
            user_id=u.id,
            farm_name=farm_name,
            village=village,
            district=district,
            state="Telangana",
            pincode=pincode,
            landmark=f"Near {village} Rythu Vedika",
            latitude=Decimal(str(round(base_lat + random.uniform(-0.008, 0.008), 6))),
            longitude=Decimal(str(round(base_lng + random.uniform(-0.008, 0.008), 6))),
        )
        db.session.add(fp)
        db.session.flush()
        farmers.append(fp)

        # Guarantee at least 1 online product per farmer (2 products for first 30 farmers = 130 products total)
        num_prods = 2 if idx <= 30 else 1
        for p_offset in range(num_prods):
            spec = PRODUCT_CATALOG[(idx - 1 + p_offset * 7) % len(PRODUCT_CATALOG)]
            pname, cat_name, unit, base_p, base_bulk, min_bulk, base_avail, is_org, sell_mode, img_url = spec
            # Keep almost all products visible to individual & apartment consumers, with a small variation
            price_val = Decimal(str(max(15, base_p + ((idx % 5) - 2))))
            bulk_val = Decimal(str(min(int(price_val) - 5, max(10, base_bulk + ((idx % 4) - 2)))))
            avail_val = Decimal(str(base_avail + (idx % 5) * 10))
            harvest_dt = today - timedelta(days=(idx + p_offset) % 3)

            prod = Product(
                farmer_id=fp.id,
                category_id=cat_map[cat_name],
                name=pname,
                description=f"Freshly harvested {pname} directly from {farm_name}, {village}. Harvested on {harvest_dt.isoformat()}.",
                image_url=img_url,
                price=price_val,
                bulk_price=bulk_val,
                min_bulk_quantity=Decimal(str(min_bulk)),
                delivery_price_per_km=Decimal(str(random.choice([4, 5, 6, 8]))),
                max_delivery_km=Decimal("20.00"),
                unit=unit,
                available_quantity=avail_val,
                location=f"{village}, {district}",
                harvest_date=harvest_dt,
                is_organic=is_org,
                is_available=True,
                selling_mode=sell_mode if (idx % 12 == 0) else "both",
                bulk_disabled=False,
                dispatch_started_at=datetime.utcnow() - timedelta(hours=3),
            )
            db.session.add(prod)
            db.session.flush()
            products.append(prod)

    # 5. Seed 50 Consumers near JNTU Metro Station, Hyderabad
    buyers = []
    buyer_addresses = []
    for idx in range(1, 51):
        full_name = f"{FIRST_NAMES[idx - 1]} {LAST_NAMES[(idx * 3) % len(LAST_NAMES)]}"
        u = User(
            full_name=full_name,
            email=f"consumer{idx:02d}@kisandirect.in",
            mobile_number=f"991100{idx:04d}",
            role="buyer",
            language="en",
            is_verified=True,
            is_active=True,
        )
        u.set_password("buyer123")
        db.session.add(u)
        db.session.flush()
        db.session.add(BuyerProfile(user_id=u.id))

        if idx <= 40:
            apt = JNTU_APARTMENTS[(idx - 1) % len(JNTU_APARTMENTS)]
            _, apt_name, _, apt_addr, dropoff, base_lat, base_lng, pincode = apt
            block = random.choice(["Tower A", "Tower B", "Tower C", "Block D"])
            floor_no = random.randint(1, 14)
            flat_no = f"{block.split()[-1]}-{floor_no}{random.randint(1, 8):02d}"
            addr = Address(
                user_id=u.id,
                door_number=flat_no,
                street=f"{apt_name}, {apt_addr}",
                village="Kukatpally (JNTU)",
                district="Hyderabad",
                state="Telangana",
                pincode=pincode,
                landmark=dropoff,
                latitude=Decimal(str(round(base_lat + random.uniform(-0.0012, 0.0012), 6))),
                longitude=Decimal(str(round(base_lng + random.uniform(-0.0012, 0.0012), 6))),
                is_default=True,
            )
        else:
            street, area, pincode, lm, base_lat, base_lng = JNTU_STREETS[idx % len(JNTU_STREETS)]
            addr = Address(
                user_id=u.id,
                door_number=f"H.No {random.randint(1, 9)}-{random.randint(10, 99)}/{random.randint(1, 20)}",
                street=street,
                village=area,
                district="Hyderabad",
                state="Telangana",
                pincode=pincode,
                landmark=lm,
                latitude=Decimal(str(round(base_lat + random.uniform(-0.003, 0.003), 6))),
                longitude=Decimal(str(round(base_lng + random.uniform(-0.003, 0.003), 6))),
                is_default=True,
            )
        db.session.add(addr)
        db.session.flush()
        buyers.append(u)
        buyer_addresses.append(addr)

    # 6. Seed 4 JNTU Apartment Communities & join first 40 consumers (10 per community)
    communities = []
    for c_idx, spec in enumerate(JNTU_APARTMENTS):
        code, name, ctype, addr_line, dropoff, lat, lng, pincode = spec
        admin_buyer = buyers[c_idx]
        comm = Community(
            community_code=code,
            name=name,
            community_type=ctype,
            address_line=addr_line,
            dropoff_point=dropoff,
            latitude=Decimal(str(lat)),
            longitude=Decimal(str(lng)),
            pincode=pincode,
            admin_user_id=admin_buyer.id,
        )
        db.session.add(comm)
        db.session.flush()
        communities.append(comm)

    for b_idx in range(40):
        comm = communities[b_idx % len(communities)]
        is_admin = b_idx < len(communities)
        block = random.choice(["Tower A", "Tower B", "Tower C"])
        floor_num = random.randint(1, 12)
        db.session.add(CommunityMember(
            community_id=comm.id,
            user_id=buyers[b_idx].id,
            role="admin" if is_admin else "member",
            block_name=block,
            floor_name=f"{floor_num}th Floor",
            flat_number=f"{block.split()[-1]}-{floor_num}{random.randint(1, 6):02d}",
            status="active",
        ))
    db.session.flush()

    # 7. Seed 4 BulkCampaigns & linked CommunityOrders
    for c_i in range(4):
        prod = products[c_i]
        is_completed_pool = (c_i == 3)
        camp = BulkCampaign(
            farmer_id=prod.farmer_id,
            product_id=prod.id,
            mode="supply_campaign",
            total_stock_kg=Decimal("100.00"),
            min_bulk_kg=prod.min_bulk_quantity,
            allocated_kg=Decimal("85.00") if is_completed_pool else Decimal("45.00"),
            base_price=prod.price,
            tier_30_price=(prod.price * Decimal("0.90")).quantize(Decimal("0.01")),
            tier_80_price=(prod.price * Decimal("0.80")).quantize(Decimal("0.01")),
            tier_100_price=prod.bulk_price,
            delivery_price_per_km=prod.delivery_price_per_km or Decimal("5.00"),
            max_delivery_km=prod.max_delivery_km or Decimal("18.00"),
            reservation_agreed=True,
            duration_minutes=720,
            starts_at=datetime.utcnow() - timedelta(hours=2),
            expires_at=datetime.utcnow() + timedelta(hours=10),
            status="completed" if is_completed_pool else "active",
        )
        db.session.add(camp)
        db.session.flush()

        for target_comm in communities:
            db.session.add(CampaignTargetCommunity(campaign_id=camp.id, community_id=target_comm.id))
            locked_p = (prod.price * Decimal("0.80")).quantize(Decimal("0.01")) if is_completed_pool else None
            co = CommunityOrder(
                community_id=target_comm.id,
                campaign_id=camp.id,
                product_id=prod.id,
                initiated_by_user_id=target_comm.admin_user_id,
                title_note=f"JNTU Apartment Group Pool for {prod.name} (COD until completion)",
                target_qty_kg=camp.total_stock_kg,
                current_qty_kg=Decimal("85.00") if is_completed_pool else Decimal("45.00"),
                status="completed" if is_completed_pool else "campaign_active",
                price_distributed=is_completed_pool,
                final_unit_price=locked_p,
                expires_at=datetime.utcnow() + timedelta(hours=10),
            )
            db.session.add(co)
            db.session.flush()

            comm_members = CommunityMember.query.filter_by(community_id=target_comm.id, status="active").limit(6).all()
            for m_idx, cm in enumerate(comm_members):
                db.session.add(CommunityOrderItem(
                    community_order_id=co.id,
                    user_id=cm.user_id,
                    quantity_kg=Decimal(str(5 + (m_idx % 3) * 5)),
                    unit_price_locked=locked_p,
                    delivery_landmark=f"{cm.block_name or 'Tower A'} {cm.flat_number or ''}".strip(),
                    contact_phone=cm.user.mobile_number if cm.user else "",
                    payment_status="awaiting_choice" if is_completed_pool else "pending_cod",
                    payment_method="COD",
                ))
                if c_i == 0:
                    db.session.add(Notification(
                        user_id=cm.user_id,
                        title=f"Live Apartment Deal: {prod.name}",
                        message=f"6/10 neighbors joined in {target_comm.name}. Add your share before timer ends!",
                    ))

    # 8. Seed 35 Past & Active Orders + ProductReviews + OrderFeedbacks
    orders_count = 35
    reviews_count = 0
    for o_i in range(orders_count):
        buyer = buyers[o_i % len(buyers)]
        addr = buyer_addresses[o_i % len(buyer_addresses)]
        prod = products[o_i % len(products)]
        qty = Decimal(str(random.randint(2, 6)))
        sub = prod.price * qty
        deliv = Decimal("0.00") if sub >= Decimal("500.00") else Decimal("40.00")
        tot = sub + deliv
        days_ago = max(0, 20 - (o_i % 20))
        created_dt = datetime.utcnow() - timedelta(days=days_ago, hours=o_i % 6)
        ord_num = f"KD-{(today - timedelta(days=days_ago)).strftime('%Y%m%d')}-FR{o_i + 1:04d}"

        if o_i < 24:
            status = "Delivered"
        elif o_i < 31:
            status = "Confirmed"
        else:
            status = "Packed"

        order = Order(
            order_number=ord_num,
            buyer_id=buyer.id,
            address_id=addr.id,
            subtotal=sub,
            delivery_fee=deliv,
            total_amount=tot,
            payment_status="Successful" if status == "Delivered" else "Pending",
            order_status=status,
            payment_method="UPI" if o_i % 2 == 0 else "COD",
            created_at=created_dt,
        )
        db.session.add(order)
        db.session.flush()

        fo = FarmerOrder(
            order_id=order.id,
            farmer_id=prod.farmer_id,
            subtotal=sub,
            status=status,
            delivery_otp=str(1100 + (o_i * 137) % 8899),
            created_at=created_dt,
        )
        db.session.add(fo)
        db.session.flush()

        db.session.add(OrderItem(
            order_id=order.id,
            farmer_order_id=fo.id,
            product_id=prod.id,
            product_name_snapshot=prod.name,
            unit_price=prod.price,
            unit=prod.unit,
            quantity=qty,
            subtotal=sub,
        ))
        db.session.add(Payment(
            order_id=order.id,
            payment_provider=order.payment_method,
            transaction_id=f"TXN-FRESH-{o_i + 1:04d}",
            amount=tot,
            status=order.payment_status,
            payment_reference=f"REF-{ord_num}",
            created_at=created_dt,
        ))

        if status == "Delivered":
            db.session.add(ProductReview(
                product_id=prod.id,
                farmer_id=prod.farmer_id,
                buyer_id=buyer.id,
                order_id=order.id,
                rating=random.choice([4, 5, 5]),
                farmer_rating=random.choice([4, 5, 5]),
                comment=REVIEW_COMMENTS[o_i % len(REVIEW_COMMENTS)],
                created_at=created_dt + timedelta(hours=3),
            ))
            reviews_count += 1
            if o_i < 12:
                db.session.add(OrderFeedback(
                    order_id=order.id,
                    buyer_id=buyer.id,
                    overall_rating=5,
                    delivery_rating=5,
                    farmer_rating=5,
                    feedback_tags="Fresh Produce,On Time",
                    comment="On-time farm delivery near JNTU Metro.",
                    created_at=created_dt + timedelta(hours=4),
                ))
        else:
            db.session.add(Notification(
                user_id=prod.farmer.user_id,
                title=f"Order {status}: {ord_num}",
                message=f"{buyer.full_name} ordered {float(qty)} {prod.unit} of {prod.name} (₹{float(sub):.2f}).",
            ))

    # 9. Seed 12 CommunityReviews across the 4 apartments
    for r_i in range(12):
        comm = communities[r_i % len(communities)]
        farmer = farmers[r_i % len(farmers)]
        db.session.add(CommunityReview(
            community_id=comm.id,
            farmer_id=farmer.id,
            rating=random.choice([4, 5, 5]),
            payment_score=5,
            pickup_score=5,
            communication_score=random.choice([4, 5]),
            comment=f"Great coordination at {comm.name} ({comm.dropoff_point}). Smooth bulk drop-off!",
        ))

    db.session.commit()
    return {
        "farmers": len(farmers),
        "consumers": len(buyers),
        "apartments": len(communities),
        "products": len(products),
        "orders": orders_count,
        "product_reviews": reviews_count,
        "community_reviews": 12,
        "harvest_date_all_set": True,
    }


if __name__ == "__main__":
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        db.create_all()
        summary = reset_and_seed_fresh()
        print("Fresh JNTU Seed Completed:", summary)
