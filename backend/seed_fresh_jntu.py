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
    ("Pulses", "High-protein lentils, desi chickpeas, red gram (toor dal), and unpolished pulses.", "https://images.unsplash.com/photo-1585992629739-89f81ec40ef8?w=500&auto=format&fit=crop&q=80"),
    ("Spices", "Pure farm turmeric, Guntur red chillies, coriander seeds, and whole aromatic spices.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80"),
    ("Other Products", "Cold-pressed organic oils, wild forest honey, organic jaggery, and rural dairy products.", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80"),
]

FARMER_SPECS = [
    ("Ramesh Patel", "Green Valley Organic Farms", "Patancheru", "Sangareddy", "502319", 17.5326, 78.2642),
    ("Lakshmi Devi", "Annapurna Natural Orchards", "Tellapur", "Sangareddy", "502032", 17.4692, 78.2889),
    ("Venkatesh Rao", "Medchal Agro Farms", "Medchal", "Medchal-Malkajgiri", "501401", 17.6295, 78.4814),
    ("Srinivas Reddy", "Shankarpally Rythu Farm", "Shankarpally", "Rangareddy", "501203", 17.4562, 78.1324),
    ("Padma Kumari", "Bachupally Fresh Greens", "Bachupally", "Medchal-Malkajgiri", "500090", 17.5480, 78.3610),
    ("Narsimha Yadav", "Dundigal Harvest Hub", "Dundigal", "Medchal-Malkajgiri", "500043", 17.5890, 78.4120),
    ("Anjaiah Goud", "Moinabad Organic Belt", "Moinabad", "Rangareddy", "501504", 17.3291, 78.2683),
    ("Malleshwar Rao", "Bowenpally Farm Collective", "Bowenpally", "Hyderabad", "500011", 17.4772, 78.4754),
    ("Satyam Naidu", "Shamshabad Mango Groves", "Shamshabad", "Rangareddy", "501218", 17.2543, 78.4012),
    ("Sujatha Reddy", "Kandi Natural Produce", "Kandi", "Sangareddy", "502285", 17.5710, 78.1220),
    ("Bhaskar Verma", "Ghatkesar Spice & Pulse", "Ghatkesar", "Medchal-Malkajgiri", "501301", 17.4512, 78.6819),
    ("Murali Krishna", "Miyapur Urban Agro", "Miyapur", "Hyderabad", "500049", 17.5110, 78.3520),
    ("Harish Chandra", "Ameenpur Lakeview Farm", "Ameenpur", "Sangareddy", "502032", 17.5230, 78.3210),
    ("Koteswara Rao", "Kompally Fresh Orchards", "Kompally", "Medchal-Malkajgiri", "500100", 17.5450, 78.4870),
    ("Devendar Singh", "Chevella Millet & Honey", "Chevella", "Rangareddy", "501503", 17.3065, 78.1348),
]

PRODUCT_CATALOG = [
    ("Desi Tomatoes", "Vegetables", "kg", 32, 22, 40, 140, True, "both", "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"),
    ("Red Onions", "Vegetables", "kg", 38, 28, 50, 180, False, "both", "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80"),
    ("Farm Fresh Potatoes", "Vegetables", "kg", 30, 22, 50, 200, False, "both", "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80"),
    ("Green Spinach (Palak)", "Vegetables", "bunch", 24, 16, 30, 90, True, "both", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80"),
    ("Okra (Bhindi)", "Vegetables", "kg", 48, 35, 30, 110, True, "individual_only", "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80"),
    ("Fresh Carrots", "Vegetables", "kg", 54, 40, 35, 120, True, "both", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80"),
    ("Green Capsicum", "Vegetables", "kg", 60, 44, 30, 100, False, "both", "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80"),
    ("Cauliflower", "Vegetables", "piece", 40, 28, 30, 95, True, "apartments_only", "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80"),
    ("Banganapalli Mangoes", "Fruits", "kg", 110, 82, 40, 160, True, "both", "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"),
    ("Fresh Red Dragon Fruit", "Fruits", "kg", 140, 98, 40, 120, True, "both", "https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80"),
    ("Ruby Pomegranate", "Fruits", "kg", 150, 112, 35, 110, True, "both", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"),
    ("Yellaki Bananas", "Fruits", "dozen", 65, 48, 30, 120, False, "both", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80"),
    ("Sweet Watermelon", "Fruits", "piece", 55, 38, 30, 130, False, "apartments_only", "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=600&auto=format&fit=crop&q=80"),
    ("Fresh Guava", "Fruits", "kg", 70, 50, 30, 100, True, "individual_only", "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600&auto=format&fit=crop&q=80"),
    ("Sona Masoori Rice (Aged)", "Grains", "kg", 64, 52, 50, 300, True, "both", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"),
    ("Foxtail Millet (Korralu)", "Grains", "kg", 95, 76, 30, 120, True, "both", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80"),
    ("Organic Jowar (Sorghum)", "Grains", "kg", 58, 45, 40, 150, True, "apartments_only", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"),
    ("Unpolished Toor Dal", "Pulses", "kg", 155, 126, 35, 140, True, "both", "https://images.unsplash.com/photo-1585992629739-89f81ec40ef8?w=600&auto=format&fit=crop&q=80"),
    ("Desi Moong Dal", "Pulses", "kg", 140, 114, 30, 120, True, "both", "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&auto=format&fit=crop&q=80"),
    ("Black Chickpeas (Kala Chana)", "Pulses", "kg", 110, 88, 30, 110, False, "both", "https://images.unsplash.com/photo-1585996926237-9a4b7d2b8a3f?w=600&auto=format&fit=crop&q=80"),
    ("Nizamabad Turmeric Powder", "Spices", "kg", 220, 175, 25, 90, True, "both", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80"),
    ("Guntur Red Chillies", "Spices", "kg", 260, 210, 25, 85, False, "both", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80"),
    ("Wild Forest Honey", "Other Products", "litre", 480, 390, 20, 75, True, "both", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"),
    ("Organic Sugarcane Jaggery", "Other Products", "kg", 85, 66, 35, 140, True, "both", "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=600&auto=format&fit=crop&q=80"),
]

JNTU_APARTMENTS = [
    ("KD-LBZ01", "Lodha Bellezza", "gated_society", "KPHB Phase 4, Near JNTU Metro Station, Hyderabad", "Tower A Security Desk", 17.4932, 78.3915, "500072"),
    ("KD-MLT02", "Malaysian Township", "gated_society", "Rain Tree Park, KPHB Phase 5, Hyderabad", "Clubhouse Parcel Room", 17.4895, 78.3842, "500072"),
    ("KD-VTP03", "Vertex Panache", "apartment", "Nizampet Road, Near JNTU Metro, Hyderabad", "Main Gate Security", 17.5085, 78.3865, "500090"),
    ("KD-VSU04", "Vasavi Urban", "gated_society", "Bachupally-Nizampet Link Road, Hyderabad", "Block C Lobby", 17.5210, 78.3810, "500090"),
    ("KD-PGM05", "Pragathi Green Meadows", "apartment", "Pragathi Nagar, Kukatpally, Hyderabad", "Gate 1 Drop Point", 17.5155, 78.3980, "500090"),
    ("KD-IVC06", "Indis Viva City", "gated_society", "Hafeezpet-Kondapur Road, Near JNTU, Hyderabad", "Tower 2 Reception", 17.4820, 78.3680, "500084"),
    ("KD-BLB07", "Bollineni Bion", "gated_society", "Kothaguda-Kondapur Cross, Hyderabad", "Parcel Lockers Bay", 17.4612, 78.3688, "500084"),
    ("KD-CCO08", "Cybercity Oriana", "apartment", "Moosapet-Kukatpally Y Junction, Hyderabad", "Main Lobby Desk", 17.4725, 78.4210, "500018"),
    ("KD-MHM09", "My Home Mangala", "gated_society", "Kondapur Main Road, Hyderabad", "Tower B Security Desk", 17.4589, 78.3621, "500084"),
    ("KD-HRS10", "Hill Ridge Springs", "gated_society", "Miyapur-Gachibowli Corridor, Hyderabad", "East Gate Kiosk", 17.4945, 78.3652, "500049"),
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
    "Naidu", "Varma", "Prasad", "Murthy", "Bhat",
]

JNTU_STREETS = [
    ("KPHB Phase 1 Main Rd", "Kukatpally", "500072", "Near JNTU Metro Pillar 714", 17.4987, 78.3887),
    ("KPHB Phase 3 Road", "Kukatpally", "500072", "Opposite Forum Sujana Mall", 17.4849, 78.3905),
    ("Nizampet X Road", "Nizampet", "500090", "Near Hanuman Temple", 17.5042, 78.3879),
    ("Pragathi Nagar Lake Rd", "Pragathi Nagar", "500090", "Near Aleap Circle", 17.5162, 78.3964),
    ("Vasanth Nagar Colony", "Kukatpally", "500085", "Behind JNTU College Gate", 17.4958, 78.3845),
    ("Hydernagar Main Rd", "Hydernagar", "500085", "Near Metro Station Exit B", 17.5015, 78.3782),
    ("Miyapur Allwyn X Rd", "Miyapur", "500049", "Near Miyapur Metro", 17.4968, 78.3614),
    ("Hafeezpet Flyover Rd", "Hafeezpet", "500049", "Near Aditya Nagar", 17.4824, 78.3665),
]


def reset_and_seed_fresh():
    """Purge all non-admin data and seed fresh farmers, products with harvest_date, and 75 JNTU-area consumers."""
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

    # 3. Ensure Categories exist
    cat_map = {}
    for name, desc, img in CATEGORY_SPECS:
        cat = Category.query.filter_by(name=name).first()
        if not cat:
            cat = Category(name=name, description=desc, image=img, is_active=True)
            db.session.add(cat)
            db.session.flush()
        cat_map[name] = cat.id

    # 4. Seed 15 Farmers & 30+ Products (all with harvest_date)
    farmers = []
    products = []
    for idx, (fname, farm_name, village, district, pincode, lat, lng) in enumerate(FARMER_SPECS, start=1):
        u = User(
            full_name=fname,
            email=f"farmer{idx}@kisandirect.in",
            mobile_number=f"98765432{idx:02d}",
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
            latitude=Decimal(str(lat)),
            longitude=Decimal(str(lng)),
        )
        db.session.add(fp)
        db.session.flush()
        farmers.append(fp)

    for idx, spec in enumerate(PRODUCT_CATALOG):
        pname, cat_name, unit, price, bulk_p, min_bulk, avail_qty, is_org, sell_mode, img_url = spec
        fp = farmers[idx % len(farmers)]
        harvest_dt = today - timedelta(days=idx % 3)  # Today, yesterday, or 2 days ago
        prod = Product(
            farmer_id=fp.id,
            category_id=cat_map[cat_name],
            name=pname,
            description=f"Freshly harvested {pname} directly from {fp.farm_name}, {fp.village}. Harvested on {harvest_dt.isoformat()}.",
            image_url=img_url,
            price=Decimal(str(price)),
            bulk_price=Decimal(str(bulk_p)),
            min_bulk_quantity=Decimal(str(min_bulk)),
            delivery_price_per_km=Decimal(str(random.choice([4, 5, 6, 8]))),
            max_delivery_km=Decimal(str(random.randint(14, 19))),
            unit=unit,
            available_quantity=Decimal(str(avail_qty)),
            location=f"{fp.village}, {fp.district}",
            harvest_date=harvest_dt,
            is_organic=is_org,
            is_available=True,
            selling_mode=sell_mode,
            bulk_disabled=False,
        )
        db.session.add(prod)
        db.session.flush()
        products.append(prod)

    # 5. Seed 75 Consumers near JNTU Metro Station, Hyderabad
    buyers = []
    buyer_addresses = []
    for idx in range(1, 76):
        full_name = f"{FIRST_NAMES[(idx - 1) % len(FIRST_NAMES)]} {LAST_NAMES[(idx * 3) % len(LAST_NAMES)]}"
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

        # Assign address either at one of the 10 apartments (first 60) or near JNTU streets (remaining 15)
        if idx <= 60:
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

    # 6. Seed the 10 JNTU Apartments as Communities & join first 60 consumers
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

    for b_idx in range(60):
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

    # 7. Seed 3 active BulkCampaigns targeting JNTU apartments
    for c_i in range(3):
        prod = products[c_i]
        camp = BulkCampaign(
            farmer_id=prod.farmer_id,
            product_id=prod.id,
            title=f"Fresh {prod.name} Community Pool",
            total_stock_kg=Decimal("120.00"),
            min_bulk_kg=prod.min_bulk_quantity,
            reserved_kg=Decimal("35.00"),
            base_price=prod.price,
            tier_30_price=(prod.price * Decimal("0.90")).quantize(Decimal("0.01")),
            tier_80_price=(prod.price * Decimal("0.80")).quantize(Decimal("0.01")),
            tier_100_price=prod.bulk_price,
            status="active",
            ends_at=datetime.utcnow() + timedelta(hours=12),
        )
        db.session.add(camp)
        db.session.flush()
        for target_comm in communities[c_i * 2:(c_i * 2) + 3]:
            db.session.add(CampaignTargetCommunity(campaign_id=camp.id, community_id=target_comm.id))

    # 8. Seed sample completed & pending Orders + ProductReviews + CommunityReviews
    for o_i in range(5):
        buyer = buyers[o_i]
        addr = buyer_addresses[o_i]
        prod = products[o_i]
        qty = Decimal("3.00")
        sub = prod.price * qty
        deliv = Decimal("0.00") if sub >= Decimal("500.00") else Decimal("40.00")
        tot = sub + deliv
        ord_num = f"KD-{today.strftime('%Y%m%d')}-FR{o_i + 1:04d}"
        status = "Delivered" if o_i < 3 else "Pending"

        order = Order(
            order_number=ord_num,
            buyer_id=buyer.id,
            address_id=addr.id,
            subtotal=sub,
            delivery_fee=deliv,
            total_amount=tot,
            payment_status="Successful" if status == "Delivered" else "Pending",
            order_status=status,
            payment_method="UPI" if status == "Delivered" else "COD",
        )
        db.session.add(order)
        db.session.flush()

        fo = FarmerOrder(
            order_id=order.id,
            farmer_id=prod.farmer_id,
            subtotal=sub,
            status=status,
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
        ))

        if status == "Delivered":
            db.session.add(ProductReview(
                product_id=prod.id,
                farmer_id=prod.farmer_id,
                buyer_id=buyer.id,
                order_id=order.id,
                rating=5,
                farmer_rating=5,
                comment="Super fresh harvest! Delivered right on time near JNTU Metro.",
            ))

    for r_i in range(4):
        db.session.add(CommunityReview(
            community_id=communities[r_i].id,
            farmer_id=farmers[r_i].id,
            rating=5,
            payment_score=5,
            pickup_score=5,
            communication_score=5,
            comment="Smooth bulk drop-off at apartment security desk and instant settlement.",
        ))

    db.session.commit()
    return {
        "farmers": len(farmers),
        "consumers": len(buyers),
        "apartments": len(communities),
        "products": len(products),
        "harvest_date_all_set": True,
    }


if __name__ == "__main__":
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        db.create_all()
        summary = reset_and_seed_fresh()
        print("Fresh JNTU Seed Completed:", summary)
