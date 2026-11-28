import os
import re
import requests as http_requests
from decimal import Decimal
from datetime import datetime, date
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from backend.extensions import db
from backend.models import Product, FarmerProfile, Category, User, Address
from backend.utils_geo import is_visible_in_expanding_hex_ring

products_bp = Blueprint('products', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@products_bp.route('', methods=['GET'])
def get_products():
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', '').strip()
    location = request.args.get('location', '').strip()
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    sort_by = request.args.get('sort_by', 'newest')  # newest, price_asc, price_desc
    only_organic = request.args.get('is_organic', type=lambda v: v.lower() == 'true')
    farmer_id = request.args.get('farmer_id', type=int)

    query = Product.query.filter(
        Product.is_available == True,
        Product.available_quantity > 0,
        Product.selling_mode != 'apartments_only'
    )

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if farmer_id:
        query = query.filter(Product.farmer_id == farmer_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_filter)) |
            (Product.description.ilike(search_filter)) |
            (Product.location.ilike(search_filter))
        )
    if location:
        query = query.filter(Product.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(Product.price >= Decimal(str(min_price)))
    if max_price is not None:
        query = query.filter(Product.price <= Decimal(str(max_price)))
    if only_organic:
        query = query.filter(Product.is_organic == True)

    if sort_by == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort_by == 'price_desc':
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    products = query.all()

    # Backend-only expanding hexagon ring geo-dispatch for individual consumers
    buyer_lat, buyer_lng = None, None
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            addr = Address.query.filter_by(user_id=int(uid), is_default=True).first() or Address.query.filter_by(user_id=int(uid)).first()
            if addr and addr.latitude is not None and addr.longitude is not None:
                buyer_lat, buyer_lng = float(addr.latitude), float(addr.longitude)
    except Exception:
        pass

    if buyer_lat is not None and buyer_lng is not None and not farmer_id:
        now = datetime.utcnow()
        nearby = [
            p for p in products
            if is_visible_in_expanding_hex_ring(
                p.farmer.latitude if p.farmer else None,
                p.farmer.longitude if p.farmer else None,
                buyer_lat,
                buyer_lng,
                p.dispatch_started_at or p.created_at,
                float(p.max_delivery_km or 20.0),
                now=now,
            )
        ]
        # Fallback to all matching products if user's current pin is outside all farmers' delivery radii
        if nearby:
            products = nearby

    return jsonify({'products': [p.to_dict() for p in products]}), 200

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify({'product': product.to_dict()}), 200

@products_bp.route('/upload-image', methods=['POST'])
@jwt_required()
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected image file'}), 400
    if file and allowed_file(file.filename):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        farmer_folder = f"farmer_{user.farmer_profile.id}" if user and user.farmer_profile else "farmer_general"
        filename = secure_filename(f"{int(datetime.utcnow().timestamp())}_{file.filename}")

        supabase_url = os.environ.get('SUPABASE_URL', '').rstrip('/')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY', '')
        if supabase_url and supabase_key:
            file_bytes = file.read()
            object_path = f"{farmer_folder}/{filename}"
            resp = http_requests.post(
                f"{supabase_url}/storage/v1/object/product-images/{object_path}",
                headers={
                    'Authorization': f'Bearer {supabase_key}',
                    'apikey': supabase_key,
                    'Content-Type': file.mimetype or 'image/jpeg',
                    'x-upsert': 'true',
                },
                data=file_bytes,
                timeout=30,
            )
            if resp.status_code in (200, 201):
                image_url = f"{supabase_url}/storage/v1/object/public/product-images/{object_path}"
                return jsonify({'image_url': image_url, 'message': 'Image uploaded to cloud storage'}), 201

        target_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], farmer_folder)
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, filename)
        file.save(file_path)
        image_url = f"/uploads/{farmer_folder}/{filename}"
        return jsonify({'image_url': image_url, 'message': 'Image uploaded successfully'}), 201
    return jsonify({'error': 'File type not allowed'}), 400

@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'farmer':
        return jsonify({'error': 'Only registered farmers can add products'}), 403

    farmer = FarmerProfile.query.filter_by(user_id=user_id).first()
    if not farmer:
        return jsonify({'error': 'Farmer profile not found'}), 404

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category_id = data.get('category_id')
    price = data.get('price')
    unit = data.get('unit', 'kg').strip()
    available_quantity = data.get('available_quantity', 0)
    location = data.get('location', '').strip() or f"{farmer.village}, {farmer.district}"
    description = data.get('description', '').strip()
    image_url = data.get('image_url', '').strip()
    is_organic = bool(data.get('is_organic', False))
    harvest_date_str = data.get('harvest_date')

    bulk_price = data.get('bulk_price')
    min_bulk_quantity = data.get('min_bulk_quantity')
    delivery_areas = data.get('delivery_areas', '').strip()
    delivery_price_per_km = data.get('delivery_price_per_km')
    max_delivery_km = data.get('max_delivery_km')
    selling_mode = (data.get('selling_mode') or 'both').strip()
    if selling_mode not in ('both', 'apartments_only', 'individual_only'):
        selling_mode = 'both'

    if (
        not name or
        not category_id or
        not unit or
        price is None or
        available_quantity is None or
        bulk_price is None or
        min_bulk_quantity is None or
        delivery_price_per_km is None or
        max_delivery_km is None
    ):
        return jsonify({'error': 'All product fields including bulk pricing, delivery price per km, and max distance are required'}), 400
    if re.search(r'\d', name):
        return jsonify({'error': 'Product name must contain letters only (no numbers)'}), 400

    try:
        max_km_val = float(max_delivery_km)
        if max_km_val <= 0 or max_km_val >= 20:
            return jsonify({'error': 'Delivery distance must be less than 20 km (1 - 19 km)'}), 400

        if Decimal(str(bulk_price)) >= Decimal(str(price)):
            return jsonify({'error': 'Bulk price must be lower than individual/solo price'}), 400
        if Decimal(str(available_quantity)) <= Decimal(str(min_bulk_quantity)):
            return jsonify({'error': 'Available quantity must be greater than minimum bulk quantity'}), 400

        harvest_date = None
        if harvest_date_str:
            try:
                harvest_date = datetime.strptime(str(harvest_date_str).strip()[:10], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid harvest date format. Use YYYY-MM-DD.'}), 400
            if harvest_date > date.today():
                return jsonify({'error': 'Harvest date cannot be in the future. Please select today or a past date.'}), 400
        product = Product(
            farmer_id=farmer.id,
            category_id=category_id,
            name=name,
            description=description,
            image_url=image_url or None,
            price=Decimal(str(price)),
            bulk_price=Decimal(str(bulk_price)) if bulk_price is not None else Decimal(str(round(float(price) * 0.75, 2))),
            min_bulk_quantity=Decimal(str(min_bulk_quantity)) if min_bulk_quantity is not None else Decimal('50.00'),
            delivery_areas=delivery_areas or location or 'Local Hub',
            delivery_price_per_km=Decimal(str(delivery_price_per_km or 0)),
            max_delivery_km=Decimal(str(max_km_val)),
            unit=unit,
            available_quantity=Decimal(str(available_quantity)),
            location=location,
            harvest_date=harvest_date,
            is_organic=is_organic,
            is_available=True,
            selling_mode=selling_mode,
            dispatch_started_at=datetime.utcnow()
        )
        product.sync_stock_flags()
        db.session.add(product)
        db.session.commit()
        return jsonify({'message': 'Product added successfully', 'product': product.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create product: {str(e)}'}), 500

@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403

    farmer = FarmerProfile.query.filter_by(user_id=user_id).first()
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    if product.farmer_id != farmer.id:
        return jsonify({'error': 'Cannot edit products from another farm'}), 403

    data = request.get_json() or {}
    if 'name' in data:
        new_name = data['name'].strip()
        if not new_name or re.search(r'\d', new_name):
            return jsonify({'error': 'Product name must contain letters only (no numbers)'}), 400
        product.name = new_name
    if 'category_id' in data:
        product.category_id = int(data['category_id'])
    if 'price' in data:
        product.price = Decimal(str(data['price']))
    if 'bulk_price' in data and data['bulk_price'] is not None:
        product.bulk_price = Decimal(str(data['bulk_price']))
    if 'min_bulk_quantity' in data and data['min_bulk_quantity'] is not None:
        product.min_bulk_quantity = Decimal(str(data['min_bulk_quantity']))
    if 'delivery_areas' in data:
        product.delivery_areas = data['delivery_areas'].strip()
    if 'delivery_price_per_km' in data and data['delivery_price_per_km'] is not None:
        product.delivery_price_per_km = Decimal(str(data['delivery_price_per_km']))
    if 'max_delivery_km' in data and data['max_delivery_km'] is not None:
        max_km_val = float(data['max_delivery_km'])
        if max_km_val <= 0 or max_km_val >= 20:
            return jsonify({'error': 'Delivery distance must be less than 20 km (1 - 19 km)'}), 400
        product.max_delivery_km = Decimal(str(max_km_val))
    if 'unit' in data:
        product.unit = data['unit'].strip()
    if 'available_quantity' in data:
        product.available_quantity = Decimal(str(data['available_quantity']))
    if 'location' in data:
        product.location = data['location'].strip()
    if 'description' in data:
        product.description = data['description'].strip()
    if 'image_url' in data and data['image_url']:
        product.image_url = data['image_url'].strip()
    if 'is_organic' in data:
        product.is_organic = bool(data['is_organic'])
    if 'is_available' in data:
        product.is_available = bool(data['is_available'])
    if 'selling_mode' in data and data['selling_mode'] in ('both', 'apartments_only', 'individual_only'):
        product.selling_mode = data['selling_mode']
    if 'harvest_date' in data:
        if data['harvest_date']:
            try:
                parsed_hd = datetime.strptime(str(data['harvest_date']).strip()[:10], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid harvest date format. Use YYYY-MM-DD.'}), 400
            if parsed_hd > date.today():
                return jsonify({'error': 'Harvest date cannot be in the future. Please select today or a past date.'}), 400
            product.harvest_date = parsed_hd
        else:
            product.harvest_date = None

    if product.bulk_price is not None and product.price is not None and product.bulk_price >= product.price:
        return jsonify({'error': 'Bulk price must be lower than individual/solo price'}), 400
    if product.available_quantity is not None and product.min_bulk_quantity is not None and product.available_quantity <= product.min_bulk_quantity:
        return jsonify({'error': 'Available quantity must be greater than minimum bulk quantity'}), 400

    product.sync_stock_flags()
    db.session.commit()
    return jsonify({'message': 'Product updated successfully', 'product': product.to_dict()}), 200

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403

    farmer = FarmerProfile.query.filter_by(user_id=user_id).first()
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    if product.farmer_id != farmer.id:
        return jsonify({'error': 'Cannot delete products from another farm'}), 403

    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'}), 200
