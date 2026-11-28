import re
import time
import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import User, FarmerProfile, BuyerProfile, Address, Notification

auth_bp = Blueprint('auth', __name__)

# Temporary in-memory OTP cache: { email: { 'otp': '123456', 'expires_at': timestamp } }
OTP_STORE = {}

def generate_otp(email):
    otp = str(random.randint(100000, 999999))
    OTP_STORE[email.lower()] = {
        'otp': otp,
        'expires_at': time.time() + 600  # 10 minutes validity
    }
    return otp

@auth_bp.route('/send-verification-otp', methods=['POST'])
def send_verification_otp():
    data = request.get_json() or {}
    email = (data.get('email') or data.get('identifier') or '').strip().lower()
    if not email or '@' not in email:
        return jsonify({'error': 'A valid email address is required'}), 400
    
    otp = generate_otp(email)
    return jsonify({
        'message': f'Verification code sent successfully to {email}',
        'email': email,
        'dev_otp': otp,
        'expires_in': 600
    }), 200

@auth_bp.route('/verify-email-otp', methods=['POST'])
def verify_email_otp():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and 6-digit OTP code are required'}), 400

    # Verify code (accept generated OTP or universal testing code 123456)
    stored = OTP_STORE.get(email)
    valid_code = False
    if otp == '123456':
        valid_code = True
    elif stored and stored['otp'] == otp:
        if time.time() <= stored['expires_at']:
            valid_code = True
        else:
            return jsonify({'error': 'Verification code has expired. Please request a new one.'}), 400

    if not valid_code:
        return jsonify({'error': 'Invalid verification code. Please check and try again.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': f'No account found with email {email}'}), 404

    user.is_verified = True
    db.session.commit()

    # Clear OTP
    OTP_STORE.pop(email, None)

    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role, 'name': user.full_name})
    return jsonify({
        'message': 'Email verified successfully!',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    identifier = data.get('identifier') or data.get('email') or data.get('mobile_number') or ''
    identifier = identifier.strip()
    if not identifier:
        return jsonify({'error': 'Valid email or 10-digit mobile number is required'}), 400
    
    # In development mode, we provide a reliable test OTP '123456'
    dev_otp = '123456'
    return jsonify({
        'message': f'Verification OTP sent successfully to {identifier}',
        'dev_otp': dev_otp,
        'mode': 'development'
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    role = data.get('role', '').lower().strip()
    full_name = data.get('full_name', '').strip()
    mobile_number = data.get('mobile_number', '').strip() or None
    email = data.get('email', '').strip().lower() or None
    password = data.get('password', '')
    language = data.get('language', 'en')

    if not role or role not in ['farmer', 'buyer']:
        return jsonify({'error': 'Role must be either farmer or buyer'}), 400
    if not full_name:
        return jsonify({'error': 'Full name is required'}), 400
    if re.search(r'\d', full_name):
        return jsonify({'error': 'Full name must contain letters only (no numbers)'}), 400
    if not email:
        return jsonify({'error': 'Email address is mandatory for registration'}), 400
    if not mobile_number or not mobile_number.isdigit() or len(mobile_number) != 10:
        return jsonify({'error': '10-digit mobile number is mandatory for registration'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Check duplicate email
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': f'Email {email} is already registered. Please login.'}), 409

    # Check duplicate mobile
    if mobile_number and User.query.filter_by(mobile_number=mobile_number).first():
        return jsonify({'error': f'Mobile number {mobile_number} is already registered. Please login.'}), 409

    try:
        user = User(
            full_name=full_name,
            mobile_number=mobile_number,
            email=email,
            role=role,
            language=language,
            is_verified=False,
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        lat = data.get('latitude')
        lng = data.get('longitude')
        landmark = (data.get('landmark') or '').strip()

        if role == 'farmer':
            village = data.get('village', '').strip() or 'Local Village'
            district = data.get('district', '').strip() or 'Local District'
            state = data.get('state', '').strip() or 'Telangana'
            pincode = data.get('pincode', '').strip() or '500001'
            farm_name = data.get('farm_name', '').strip() or f"{full_name}'s Farm"
            for field_label, field_val in [('Farm name', farm_name), ('Village', village), ('District', district), ('State', state)]:
                if re.search(r'\d', field_val):
                    return jsonify({'error': f'{field_label} must contain letters only (no numbers)'}), 400
            if not pincode.isdigit() or len(pincode) != 6:
                return jsonify({'error': 'Pincode must be a 6-digit number'}), 400

            farmer_profile = FarmerProfile(
                user_id=user.id,
                farm_name=farm_name,
                village=village,
                district=district,
                state=state,
                pincode=pincode,
                landmark=landmark,
                latitude=lat,
                longitude=lng
            )
            db.session.add(farmer_profile)

        elif role == 'buyer':
            buyer_profile = BuyerProfile(user_id=user.id)
            db.session.add(buyer_profile)

            # Create initial address from exact map pin and landmark
            door = data.get('door_number', '').strip() or landmark or 'Residence'
            street = data.get('street', '').strip() or data.get('location_title', '').strip() or 'Main Road'
            pincode = data.get('pincode', '').strip() or data.get('delivery_pincode', '').strip() or '500001'
            village = data.get('village', '').strip() or data.get('location_title', '').strip() or 'Local Area'
            district = data.get('district', '').strip() or 'Local District'
            state = data.get('state', '').strip() or 'Telangana'

            address = Address(
                user_id=user.id,
                door_number=door,
                street=street,
                village=village,
                district=district,
                state=state,
                pincode=pincode,
                landmark=landmark,
                latitude=lat,
                longitude=lng,
                is_default=True
            )
            db.session.add(address)

        # Welcome notification
        welcome_note = Notification(
            user_id=user.id,
            title='Welcome to KisanDirect!',
            message=f'Hello {full_name}, welcome to KisanDirect. Please verify your email to get started.'
        )
        db.session.add(welcome_note)

        db.session.commit()

        # Generate OTP for email verification
        otp_code = generate_otp(email)
        token = create_access_token(identity=str(user.id), additional_claims={'role': user.role, 'name': user.full_name})
        return jsonify({
            'message': 'Registration successful. Please verify your email.',
            'token': token,
            'user': user.to_dict(),
            'needs_verification': True,
            'email': email,
            'role': user.role,
            'dev_otp': otp_code
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('identifier') or data.get('email_or_phone') or data.get('mobile_number') or data.get('email') or ''
    identifier = identifier.strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Email / Mobile number and password are required'}), 400

    # Lookup user by either email or mobile number
    ident_lower = identifier.lower()
    user = User.query.filter(
        (User.mobile_number == identifier) | 
        (User.email == ident_lower)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email/mobile number or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Contact support.'}), 403

    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role, 'name': user.full_name})

    if not user.is_verified:
        otp_code = generate_otp(user.email or identifier)
        return jsonify({
            'error': 'Please verify your email address before accessing your dashboard.',
            'needs_verification': True,
            'email': user.email,
            'role': user.role,
            'token': token,
            'user': user.to_dict(),
            'dev_otp': otp_code
        }), 403

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/language', methods=['PUT'])
@jwt_required()
def update_language():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    lang = data.get('language')
    if lang in ['en', 'te', 'hi']:
        user.language = lang
        db.session.commit()
        return jsonify({'message': 'Language updated successfully', 'language': lang}), 200
    return jsonify({'error': 'Unsupported language code'}), 400

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower() if 'email' in data else None
    mobile_number = data.get('mobile_number', '').strip() if 'mobile_number' in data else None

    if full_name:
        if re.search(r'\d', full_name):
            return jsonify({'error': 'Full name must contain letters only (no numbers)'}), 400
        user.full_name = full_name

    if email and email != (user.email or ''):
        existing = User.query.filter(User.email == email, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Email address is already in use by another account'}), 409
        user.email = email

    if mobile_number and mobile_number != (user.mobile_number or ''):
        if not mobile_number.isdigit() or len(mobile_number) != 10:
            return jsonify({'error': 'Mobile number must be a valid 10-digit number'}), 400
        existing = User.query.filter(User.mobile_number == mobile_number, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Mobile number is already registered to another account'}), 409
        user.mobile_number = mobile_number

    # If farmer, update farm location details
    if user.role == 'farmer' and user.farmer_profile:
        fp = user.farmer_profile
        for field_key, label in [('farm_name', 'Farm name'), ('village', 'Village'), ('district', 'District'), ('state', 'State')]:
            if field_key in data and data[field_key]:
                val = data[field_key].strip()
                if re.search(r'\d', val):
                    return jsonify({'error': f'{label} must contain letters only (no numbers)'}), 400
                setattr(fp, field_key, val)
        if 'pincode' in data and data['pincode']:
            pin_val = data['pincode'].strip()
            if not pin_val.isdigit() or len(pin_val) != 6:
                return jsonify({'error': 'Pincode must be a 6-digit number'}), 400
            fp.pincode = pin_val

    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400

    if not user.check_password(current_password):
        return jsonify({'error': 'Incorrect current password'}), 401

    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('email') or data.get('mobile_number') or '').strip()
    if not identifier:
        return jsonify({'error': 'Registered email or mobile number is required'}), 400

    ident_lower = identifier.lower()
    user = User.query.filter(
        (User.email == ident_lower) | (User.mobile_number == identifier)
    ).first()
    if not user:
        return jsonify({'error': 'No account found with that email or mobile number'}), 404

    otp = str(random.randint(100000, 999999))
    OTP_STORE[f"reset:{user.id}"] = {
        'otp': otp,
        'expires_at': time.time() + 600,
    }

    return jsonify({
        'message': f'Password reset OTP generated for {user.email or user.mobile_number}',
        'identifier': identifier,
        'dev_otp': otp,
        'expires_in': 600,
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('email') or data.get('mobile_number') or '').strip()
    otp = (data.get('otp') or '').strip()
    new_password = data.get('new_password') or ''
    confirm_password = data.get('confirm_password') or ''

    if not identifier or not otp or not new_password:
        return jsonify({'error': 'Identifier, OTP, and new password are required'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    if confirm_password and new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    ident_lower = identifier.lower()
    user = User.query.filter(
        (User.email == ident_lower) | (User.mobile_number == identifier)
    ).first()
    if not user:
        return jsonify({'error': 'No account found with that email or mobile number'}), 404

    stored = OTP_STORE.get(f"reset:{user.id}")
    if not stored or stored['otp'] != otp:
        return jsonify({'error': 'Invalid OTP code. Please request a new one.'}), 400
    if time.time() > stored['expires_at']:
        OTP_STORE.pop(f"reset:{user.id}", None)
        return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

    user.set_password(new_password)
    db.session.commit()
    OTP_STORE.pop(f"reset:{user.id}", None)
    return jsonify({'message': 'Password reset successful. You can now log in with your new password.'}), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
