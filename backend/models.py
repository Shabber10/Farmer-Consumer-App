from datetime import datetime
from decimal import Decimal
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    mobile_number = db.Column(db.String(20), unique=True, nullable=True, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'farmer' or 'buyer'
    language = db.Column(db.String(10), default='en')  # 'en', 'te', 'hi'
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer_profile = db.relationship('FarmerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    buyer_profile = db.relationship('BuyerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    addresses = db.relationship('Address', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    support_requests = db.relationship('SupportRequest', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'mobile_number': self.mobile_number,
            'email': self.email,
            'role': self.role,
            'language': self.language,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.role == 'farmer' and self.farmer_profile:
            data['farmer_profile'] = self.farmer_profile.to_dict()
        elif self.role == 'buyer' and self.buyer_profile:
            data['buyer_profile'] = self.buyer_profile.to_dict()
        return data


class FarmerProfile(db.Model):
    __tablename__ = 'farmer_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    farm_name = db.Column(db.String(150), nullable=True)
    village = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)
    landmark = db.Column(db.String(150), nullable=True)
    latitude = db.Column(db.Numeric(10, 6), nullable=True)
    longitude = db.Column(db.Numeric(10, 6), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship('Product', backref='farmer', lazy='dynamic', cascade='all, delete-orphan')
    farmer_orders = db.relationship('FarmerOrder', backref='farmer', lazy='dynamic')

    def to_dict(self):
        farmer_reviews = ProductReview.query.filter_by(farmer_id=self.id).all()
        farmer_review_count = len(farmer_reviews)
        farmer_rating = round(sum(r.farmer_rating for r in farmer_reviews) / farmer_review_count, 1) if farmer_review_count > 0 else 0.0
        return {
            'id': self.id,
            'user_id': self.user_id,
            'farm_name': self.farm_name or f"{self.user.full_name}'s Farm",
            'village': self.village,
            'district': self.district,
            'state': self.state,
            'pincode': self.pincode,
            'landmark': self.landmark,
            'latitude': float(self.latitude) if self.latitude is not None else None,
            'longitude': float(self.longitude) if self.longitude is not None else None,
            'location_display': f"{self.village}, {self.district}",
            'farmer_name': self.user.full_name if self.user else None,
            'mobile_number': self.user.mobile_number if self.user else None,
            'email': self.user.email if self.user else None,
            'farmer_rating': farmer_rating,
            'farmer_review_count': farmer_review_count
        }


class BuyerProfile(db.Model):
    __tablename__ = 'buyer_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Address(db.Model):
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    door_number = db.Column(db.String(50), nullable=False)
    street = db.Column(db.String(150), nullable=False)
    village = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)
    landmark = db.Column(db.String(150), nullable=True)
    latitude = db.Column(db.Numeric(10, 6), nullable=True)
    longitude = db.Column(db.Numeric(10, 6), nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def formatted_address(self):
        parts = [self.door_number, self.street, self.village, self.district, self.state]
        valid_parts = [p for p in parts if p]
        addr = ", ".join(valid_parts)
        if self.pincode:
            addr += f" - {self.pincode}"
        if self.landmark:
            addr += f" (Near {self.landmark})"
        return addr

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'door_number': self.door_number,
            'street': self.street,
            'village': self.village,
            'district': self.district,
            'state': self.state,
            'pincode': self.pincode,
            'landmark': self.landmark,
            'latitude': float(self.latitude) if self.latitude is not None else None,
            'longitude': float(self.longitude) if self.longitude is not None else None,
            'is_default': self.is_default,
            'formatted_address': self.formatted_address
        }


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    products = db.relationship('Product', backref='category', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image': self.image,
            'is_active': self.is_active,
            'product_count': self.products.count()
        }


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    bulk_price = db.Column(db.Numeric(10, 2), nullable=True)
    min_bulk_quantity = db.Column(db.Numeric(10, 2), nullable=True, default=Decimal('50.00'))
    delivery_areas = db.Column(db.String(255), nullable=True, default='Hyderabad & Surrounding Hubs')
    delivery_price_per_km = db.Column(db.Numeric(10, 2), nullable=True, default=Decimal('0.00'))
    max_delivery_km = db.Column(db.Numeric(5, 2), nullable=True, default=Decimal('20.00'))
    unit = db.Column(db.String(20), nullable=False, default='kg')  # 'kg', 'gram', 'bunch', 'dozen', 'litre', 'piece'
    available_quantity = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    location = db.Column(db.String(150), nullable=False)
    harvest_date = db.Column(db.Date, nullable=True)
    is_organic = db.Column(db.Boolean, default=False)
    is_available = db.Column(db.Boolean, default=True)
    selling_mode = db.Column(db.String(30), nullable=False, default='both')  # 'both' | 'apartments_only' | 'individual_only'
    bulk_disabled = db.Column(db.Boolean, nullable=False, default=False)
    dispatch_started_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def sync_stock_flags(self):
        """Auto-stop bulk when remaining < min_bulk_quantity; block product when stock == 0."""
        if self.available_quantity is None or self.available_quantity <= 0:
            self.available_quantity = Decimal('0.00')
            self.is_available = False
            self.bulk_disabled = True
        else:
            min_b = self.min_bulk_quantity or Decimal('50.00')
            self.bulk_disabled = bool(self.available_quantity < min_b)

    def to_dict(self):
        farmer_data = self.farmer.to_dict() if self.farmer else {}
        prod_reviews = ProductReview.query.filter_by(product_id=self.id).all()
        review_count = len(prod_reviews)
        average_rating = round(sum(r.rating for r in prod_reviews) / review_count, 1) if review_count > 0 else 0.0
        return {
            'id': self.id,
            'farmer_id': self.farmer_id,
            'farmer_name': farmer_data.get('farmer_name', 'Local Farmer'),
            'farm_name': farmer_data.get('farm_name', 'Farm Fresh'),
            'farmer_phone': farmer_data.get('mobile_number'),
            'farmer_latitude': farmer_data.get('latitude'),
            'farmer_longitude': farmer_data.get('longitude'),
            'farmer_rating': farmer_data.get('farmer_rating', 0.0),
            'farmer_review_count': farmer_data.get('farmer_review_count', 0),
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else 'General',
            'name': self.name,
            'description': self.description,
            'image_url': self.image_url,
            'price': float(self.price),
            'bulk_price': float(self.bulk_price) if self.bulk_price is not None else round(float(self.price) * 0.75, 2),
            'min_bulk_quantity': float(self.min_bulk_quantity) if self.min_bulk_quantity is not None else 50.0,
            'delivery_areas': self.delivery_areas or 'Hyderabad & Surrounding Hubs',
            'delivery_price_per_km': float(self.delivery_price_per_km) if self.delivery_price_per_km is not None else 0.0,
            'max_delivery_km': float(self.max_delivery_km) if self.max_delivery_km is not None else 20.0,
            'unit': self.unit,
            'available_quantity': float(self.available_quantity),
            'location': self.location,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'is_organic': self.is_organic,
            'is_available': self.is_available and (self.available_quantity > 0),
            'selling_mode': self.selling_mode or 'both',
            'bulk_disabled': bool(self.bulk_disabled or (self.available_quantity < (self.min_bulk_quantity or Decimal('50.00')))),
            'dispatch_started_at': self.dispatch_started_at.isoformat() if self.dispatch_started_at else None,
            'average_rating': average_rating,
            'review_count': review_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    quantity = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('1.00'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buyer = db.relationship('User', backref=db.backref('cart_items', lazy='dynamic', cascade='all, delete-orphan'))
    product = db.relationship('Product')

    def to_dict(self):
        unit_price = float(self.product.price) if self.product else 0.0
        qty = float(self.quantity)
        subtotal = round(unit_price * qty, 2)
        return {
            'id': self.id,
            'buyer_id': self.buyer_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': qty,
            'unit_price': unit_price,
            'subtotal': subtotal,
            'in_stock': (self.product.available_quantity >= self.quantity) if self.product else False
        }


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    address_id = db.Column(db.Integer, db.ForeignKey('addresses.id'), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    delivery_fee = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_status = db.Column(db.String(30), default='Pending')  # 'Pending', 'Successful', 'Failed', 'Refunded'
    order_status = db.Column(db.String(30), default='Pending')  # 'Pending', 'Accepted', 'Preparing', 'Ready for Dispatch', 'Completed', 'Cancelled'
    payment_method = db.Column(db.String(50), default='COD')  # 'COD', 'UPI', 'CARD', 'ONLINE_SANDBOX'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buyer = db.relationship('User', backref=db.backref('orders', lazy='dynamic'))
    address = db.relationship('Address')
    farmer_orders = db.relationship('FarmerOrder', backref='order', lazy='dynamic', cascade='all, delete-orphan')
    items = db.relationship('OrderItem', backref='order', lazy='dynamic', cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='order', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_items=True):
        existing_feedback = OrderFeedback.query.filter_by(order_id=self.id).first()
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.full_name if self.buyer else None,
            'buyer_phone': self.buyer.mobile_number if self.buyer else None,
            'address': self.address.to_dict() if self.address else None,
            'subtotal': float(self.subtotal),
            'delivery_fee': float(self.delivery_fee),
            'total_amount': float(self.total_amount),
            'payment_status': self.payment_status,
            'order_status': self.order_status,
            'payment_method': self.payment_method,
            'is_rated': existing_feedback is not None,
            'feedback': existing_feedback.to_dict() if existing_feedback else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
            data['farmer_orders'] = [fo.to_dict() for fo in self.farmer_orders]
        return data


class FarmerOrder(db.Model):
    __tablename__ = 'farmer_orders'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.id'), nullable=False, index=True)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(30), default='Pending')  # 'Pending', 'Accepted', 'Preparing', 'Ready for Dispatch', 'Completed', 'Cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('OrderItem', backref='farmer_order', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_number': self.order.order_number if self.order else None,
            'order_date': self.created_at.isoformat() if self.created_at else None,
            'farmer_id': self.farmer_id,
            'subtotal': float(self.subtotal),
            'status': self.status,
            'buyer_name': self.order.buyer.full_name if self.order and self.order.buyer else 'Buyer',
            'buyer_phone': self.order.buyer.mobile_number if self.order and self.order.buyer else None,
            'delivery_address': self.order.address.formatted_address if self.order and self.order.address else None,
            'items': [item.to_dict() for item in self.items]
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    farmer_order_id = db.Column(db.Integer, db.ForeignKey('farmer_orders.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    product_name_snapshot = db.Column(db.String(150), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    unit = db.Column(db.String(20), nullable=False, default='kg')
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'farmer_order_id': self.farmer_order_id,
            'product_id': self.product_id,
            'product_name': self.product_name_snapshot,
            'product_image': self.product.image_url if self.product else None,
            'unit_price': float(self.unit_price),
            'unit': self.unit,
            'quantity': float(self.quantity),
            'subtotal': float(self.subtotal)
        }


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    payment_provider = db.Column(db.String(50), default='COD')
    transaction_id = db.Column(db.String(100), nullable=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(30), default='Pending')  # 'Pending', 'Successful', 'Failed', 'Refunded'
    payment_reference = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'payment_provider': self.payment_provider,
            'transaction_id': self.transaction_id,
            'amount': float(self.amount),
            'status': self.status,
            'payment_reference': self.payment_reference,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SupportRequest(db.Model):
    __tablename__ = 'support_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProductReview(db.Model):
    __tablename__ = 'product_reviews'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1 to 5 product quality rating
    farmer_rating = db.Column(db.Integer, nullable=False, default=5)  # 1 to 5 farmer & delivery rating
    title = db.Column(db.String(120), nullable=True)
    comment = db.Column(db.Text, nullable=False)
    is_verified_purchase = db.Column(db.Boolean, default=False)
    helpful_count = db.Column(db.Integer, default=0)
    farmer_reply = db.Column(db.Text, nullable=True)
    farmer_replied_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship('Product', backref=db.backref('reviews', lazy='dynamic', cascade='all, delete-orphan'))
    buyer = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'farmer_id': self.farmer_id,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.full_name if self.buyer else 'Verified Buyer',
            'order_id': self.order_id,
            'rating': self.rating,
            'farmer_rating': self.farmer_rating,
            'title': self.title or '',
            'comment': self.comment,
            'is_verified_purchase': self.is_verified_purchase,
            'helpful_count': self.helpful_count or 0,
            'farmer_reply': self.farmer_reply,
            'farmer_replied_at': self.farmer_replied_at.isoformat() if self.farmer_replied_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class OrderFeedback(db.Model):
    __tablename__ = 'order_feedback'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    overall_rating = db.Column(db.Integer, nullable=False)
    delivery_rating = db.Column(db.Integer, nullable=False, default=5)
    farmer_rating = db.Column(db.Integer, nullable=False, default=5)
    feedback_tags = db.Column(db.String(255), nullable=True)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship('Order', backref=db.backref('order_feedback', uselist=False, cascade='all, delete-orphan'))

    def to_dict(self):
        tags = [t.strip() for t in (self.feedback_tags or '').split(',') if t.strip()]
        return {
            'id': self.id,
            'order_id': self.order_id,
            'buyer_id': self.buyer_id,
            'overall_rating': self.overall_rating,
            'delivery_rating': self.delivery_rating,
            'farmer_rating': self.farmer_rating,
            'feedback_tags': tags,
            'comment': self.comment or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Community(db.Model):
    """Apartment / gated society buying community with GPS coordinates and verified farmer ratings."""
    __tablename__ = 'communities'

    id = db.Column(db.Integer, primary_key=True)
    community_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    community_type = db.Column(db.String(40), nullable=False, default='apartment')
    address_line = db.Column(db.String(255), nullable=False)
    landmark = db.Column(db.String(150), nullable=True)
    dropoff_point = db.Column(db.String(150), nullable=False, default='Main Gate Security')
    latitude = db.Column(db.Numeric(10, 6), nullable=False)
    longitude = db.Column(db.Numeric(10, 6), nullable=False)
    pincode = db.Column(db.String(10), nullable=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship('CommunityMember', backref='community', lazy='dynamic', cascade='all, delete-orphan')
    community_orders = db.relationship('CommunityOrder', backref='community', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('CommunityReview', backref='community', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, distance_m=None):
        active_members = self.members.filter_by(status='active').count()
        revs = self.reviews.all()
        rev_count = len(revs)
        avg_rating = round(sum(r.rating for r in revs) / rev_count, 1) if rev_count > 0 else 0.0
        data = {
            'id': self.id,
            'community_code': self.community_code,
            'name': self.name,
            'community_type': self.community_type,
            'address_line': self.address_line,
            'landmark': self.landmark or '',
            'dropoff_point': self.dropoff_point,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'pincode': self.pincode or '',
            'admin_user_id': self.admin_user_id,
            'members_count': active_members,
            'avg_farmer_rating': avg_rating,
            'farmer_review_count': rev_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if distance_m is not None:
            data['distance_m'] = round(distance_m, 1)
            data['distance_km'] = round(distance_m / 1000.0, 2)
        return data


class CommunityMember(db.Model):
    """Membership linking a consumer to an apartment community with their block/floor/flat details."""
    __tablename__ = 'community_members'

    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False, default='member')  # 'admin' | 'member'
    block_name = db.Column(db.String(60), nullable=True)
    floor_name = db.Column(db.String(40), nullable=True)
    flat_number = db.Column(db.String(40), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='active')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    __table_args__ = (
        db.UniqueConstraint('community_id', 'user_id', name='uq_community_member'),
    )

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'community_id': self.community_id,
            'user_id': self.user_id,
            'full_name': self.user.full_name if self.user else 'Member',
            'role': self.role,
            'status': self.status,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }
        if include_private:
            data['block_name'] = self.block_name or ''
            data['floor_name'] = self.floor_name or ''
            data['flat_number'] = self.flat_number or ''
            data['mobile_number'] = self.user.mobile_number if self.user else ''
        return data


class BulkCampaign(db.Model):
    """Shared farmer inventory pool with reservation agreement, 30/80/100% discount slabs, and campaign timer."""
    __tablename__ = 'bulk_campaigns'

    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    mode = db.Column(db.String(30), nullable=False, default='supply_campaign')  # 'supply_campaign' | 'demand_fulfill'
    total_stock_kg = db.Column(db.Numeric(10, 2), nullable=False)
    allocated_kg = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    min_bulk_kg = db.Column(db.Numeric(10, 2), nullable=False)
    base_price = db.Column(db.Numeric(10, 2), nullable=False)
    tier_30_price = db.Column(db.Numeric(10, 2), nullable=False)
    tier_80_price = db.Column(db.Numeric(10, 2), nullable=False)
    tier_100_price = db.Column(db.Numeric(10, 2), nullable=False)
    delivery_price_per_km = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    max_delivery_km = db.Column(db.Numeric(5, 2), nullable=False, default=Decimal('20.00'))
    reservation_agreed = db.Column(db.Boolean, nullable=False, default=False)
    duration_minutes = db.Column(db.Integer, nullable=False, default=180)
    starts_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='active')  # 'active' | 'locked' | 'out_for_delivery' | 'completed' | 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    farmer = db.relationship('FarmerProfile')
    product = db.relationship('Product')
    targets = db.relationship('CampaignTargetCommunity', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')

    def current_tier_price(self):
        total = float(self.total_stock_kg or 1)
        alloc = float(self.allocated_kg or 0)
        pct = (alloc / total) * 100.0 if total > 0 else 0.0
        if pct >= 100.0:
            return float(self.tier_100_price), 100
        if pct >= 80.0:
            return float(self.tier_80_price), 80
        if pct >= 30.0:
            return float(self.tier_30_price), 30
        return float(self.base_price), 0

    def to_dict(self):
        curr_price, active_tier = self.current_tier_price()
        total = float(self.total_stock_kg or 0)
        alloc = float(self.allocated_kg or 0)
        progress_pct = round(min(100.0, (alloc / total) * 100.0), 1) if total > 0 else 0.0
        return {
            'id': self.id,
            'farmer_id': self.farmer_id,
            'farmer_name': self.farmer.user.full_name if self.farmer and self.farmer.user else 'Local Farmer',
            'farm_name': self.farmer.farm_name if self.farmer else 'Farm Fresh',
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else '',
            'product_image': self.product.image_url if self.product else None,
            'unit': self.product.unit if self.product else 'kg',
            'mode': self.mode,
            'total_stock_kg': total,
            'allocated_kg': alloc,
            'remaining_kg': round(max(0.0, total - alloc), 2),
            'progress_pct': progress_pct,
            'min_bulk_kg': float(self.min_bulk_kg),
            'base_price': float(self.base_price),
            'tier_30_price': float(self.tier_30_price),
            'tier_80_price': float(self.tier_80_price),
            'tier_100_price': float(self.tier_100_price),
            'current_price': curr_price,
            'active_tier': active_tier,
            'delivery_price_per_km': float(self.delivery_price_per_km),
            'max_delivery_km': float(self.max_delivery_km),
            'reservation_agreed': self.reservation_agreed,
            'duration_minutes': self.duration_minutes,
            'starts_at': self.starts_at.isoformat() if self.starts_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'target_community_ids': [t.community_id for t in self.targets.all()],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CampaignTargetCommunity(db.Model):
    """Communities selected by a farmer for a shared bulk campaign."""
    __tablename__ = 'campaign_target_communities'

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('bulk_campaigns.id', ondelete='CASCADE'), nullable=False, index=True)
    community_id = db.Column(db.Integer, db.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False, index=True)

    community = db.relationship('Community')

    __table_args__ = (
        db.UniqueConstraint('campaign_id', 'community_id', name='uq_campaign_community'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'community_id': self.community_id,
            'community_name': self.community.name if self.community else None,
        }


class CommunityOrder(db.Model):
    """Community group-buying feed item / demand pool for a product inside an apartment community."""
    __tablename__ = 'community_orders'

    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('bulk_campaigns.id', ondelete='SET NULL'), nullable=True, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    initiated_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title_note = db.Column(db.String(255), nullable=True)
    target_qty_kg = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('50.00'))
    current_qty_kg = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    status = db.Column(db.String(30), nullable=False, default='open_demand')  # 'open_demand' | 'campaign_active' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled'
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    campaign = db.relationship('BulkCampaign')
    product = db.relationship('Product')
    initiator = db.relationship('User')
    items = db.relationship('CommunityOrderItem', backref='community_order', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_delivery_contacts=False):
        prod = self.product
        camp = self.campaign
        target = float(camp.total_stock_kg) if camp else float(self.target_qty_kg or 50)
        current = float(camp.allocated_kg) if camp else float(self.current_qty_kg or 0)
        pct = round(min(100.0, (current / target) * 100.0), 1) if target > 0 else 0.0
        base_price = float(camp.base_price) if camp else float(prod.price) if prod else 0.0
        tier_30 = float(camp.tier_30_price) if camp else round(base_price * 0.9, 2)
        tier_80 = float(camp.tier_80_price) if camp else round(base_price * 0.8, 2)
        tier_100 = float(camp.tier_100_price) if camp else (float(prod.bulk_price) if prod and prod.bulk_price else round(base_price * 0.7, 2))

        if pct >= 100:
            effective_price, active_tier = tier_100, 100
        elif pct >= 80:
            effective_price, active_tier = tier_80, 80
        elif pct >= 30:
            effective_price, active_tier = tier_30, 30
        else:
            effective_price, active_tier = base_price, 0

        items_list = self.items.all()
        return {
            'id': self.id,
            'community_id': self.community_id,
            'community_name': self.community.name if self.community else None,
            'community_dropoff': self.community.dropoff_point if self.community else None,
            'campaign_id': self.campaign_id,
            'product_id': self.product_id,
            'product_name': prod.name if prod else '',
            'product_image': prod.image_url if prod else None,
            'unit': prod.unit if prod else 'kg',
            'farmer_id': prod.farmer_id if prod else None,
            'farm_name': prod.farmer.farm_name if prod and prod.farmer else 'Local Farm',
            'initiated_by_name': self.initiator.full_name if self.initiator else 'Neighbor',
            'title_note': self.title_note or '',
            'target_qty_kg': target,
            'current_qty_kg': current,
            'community_qty_kg': float(self.current_qty_kg or 0),
            'progress_pct': pct,
            'base_price': base_price,
            'tier_30_price': tier_30,
            'tier_80_price': tier_80,
            'tier_100_price': tier_100,
            'effective_price': effective_price,
            'active_tier': active_tier,
            'participants_count': len(items_list),
            'status': self.status,
            'expires_at': (camp.expires_at or self.expires_at).isoformat() if (camp and camp.expires_at) or self.expires_at else None,
            'items': [i.to_dict(include_contact=include_delivery_contacts) for i in items_list],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CommunityOrderItem(db.Model):
    """Individual member's contribution to a community group order."""
    __tablename__ = 'community_order_items'

    id = db.Column(db.Integer, primary_key=True)
    community_order_id = db.Column(db.Integer, db.ForeignKey('community_orders.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    quantity_kg = db.Column(db.Numeric(10, 2), nullable=False)
    unit_price_locked = db.Column(db.Numeric(10, 2), nullable=True)
    delivery_landmark = db.Column(db.String(200), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    payment_status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    def to_dict(self, include_contact=False):
        data = {
            'id': self.id,
            'community_order_id': self.community_order_id,
            'user_id': self.user_id,
            'member_name': self.user.full_name if self.user else 'Member',
            'quantity_kg': float(self.quantity_kg),
            'unit_price_locked': float(self.unit_price_locked) if self.unit_price_locked is not None else None,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_contact:
            data['delivery_landmark'] = self.delivery_landmark or ''
            data['contact_phone'] = self.contact_phone or (self.user.mobile_number if self.user else '')
        return data


class CommunityReview(db.Model):
    """Verified farmer review of a residential community after a completed delivery."""
    __tablename__ = 'community_reviews'

    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False, index=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    community_order_id = db.Column(db.Integer, db.ForeignKey('community_orders.id', ondelete='SET NULL'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    payment_score = db.Column(db.Integer, nullable=False, default=5)
    pickup_score = db.Column(db.Integer, nullable=False, default=5)
    communication_score = db.Column(db.Integer, nullable=False, default=5)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    farmer = db.relationship('FarmerProfile')

    def to_dict(self):
        return {
            'id': self.id,
            'community_id': self.community_id,
            'farmer_id': self.farmer_id,
            'farmer_name': self.farmer.user.full_name if self.farmer and self.farmer.user else 'Farmer',
            'farm_name': self.farmer.farm_name if self.farmer else 'Local Farm',
            'community_order_id': self.community_order_id,
            'rating': self.rating,
            'payment_score': self.payment_score,
            'pickup_score': self.pickup_score,
            'communication_score': self.communication_score,
            'comment': self.comment or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
