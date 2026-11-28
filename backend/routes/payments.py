import uuid
import razorpay
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import Order, Payment, CartItem, Product

payments_bp = Blueprint('payments', __name__)


def _get_razorpay_client():
    """Return (client_or_None, key_id, is_live_keys)."""
    key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
    is_live = bool(
        key_id and key_secret
        and key_id != 'rzp_test_kisandirect2026'
        and key_secret != 'sandbox_secret_key_mock'
    )
    if is_live:
        return razorpay.Client(auth=(key_id, key_secret)), key_id, True
    return None, key_id or 'rzp_test_kisandirect2026', False


@payments_bp.route('/create', methods=['POST'])
@jwt_required()
def create_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    order_id = data.get('order_id')
    method = data.get('payment_method', 'RAZORPAY')

    if not order_id:
        return jsonify({'error': 'order_id is required'}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order.buyer_id != user_id:
        return jsonify({'error': 'Unauthorized access to order'}), 403

    amount_paise = int(round(float(order.total_amount) * 100))
    client, key_id, is_live = _get_razorpay_client()

    if is_live and client:
        try:
            rp_order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': order.order_number,
                'payment_capture': 1,
            })
            razorpay_order_id = rp_order['id']
            mode = 'live_razorpay'
        except Exception as exc:
            return jsonify({'error': f'Razorpay order creation failed: {str(exc)}'}), 502
    else:
        razorpay_order_id = f"order_rp_{uuid.uuid4().hex[:12]}"
        mode = 'sandbox'

    return jsonify({
        'order_id': order.id,
        'order_number': order.order_number,
        'amount': float(order.total_amount),
        'amount_paise': amount_paise,
        'currency': 'INR',
        'razorpay_order_id': razorpay_order_id,
        'key_id': key_id,
        'method': method,
        'mode': mode,
    }), 200


@payments_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    order_id = data.get('order_id')
    razorpay_order_id = data.get('razorpay_order_id', '')
    payment_id = data.get('razorpay_payment_id') or data.get('payment_id') or f"pay_{uuid.uuid4().hex[:10]}"
    signature = data.get('razorpay_signature') or data.get('signature') or 'valid_sandbox_signature'

    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order.buyer_id != user_id:
        return jsonify({'error': 'Unauthorized access to order'}), 403

    client, key_id, is_live = _get_razorpay_client()
    is_test_sandbox = (signature == 'valid_sandbox_signature' and key_id.startswith('rzp_test_'))
    if is_live and client and not is_test_sandbox:
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature,
            })
        except Exception:
            return jsonify({'error': 'Invalid Razorpay payment signature'}), 400

    # Update payment status
    payment = Payment.query.filter_by(order_id=order.id).first()
    if payment:
        payment.payment_provider = 'RAZORPAY'
        payment.status = 'Successful'
        payment.transaction_id = payment_id
        payment.payment_reference = signature

    order.payment_status = 'Successful'
    # Clear buyer cart only after Razorpay payment succeeds
    CartItem.query.filter_by(buyer_id=user_id).delete()
    db.session.commit()

    return jsonify({
        'message': 'Payment verified successfully',
        'payment_status': 'Successful',
        'order': order.to_dict()
    }), 200


def _restore_order_stock(order):
    """Restore product stock if a pending Razorpay order is cancelled or failed."""
    if order.order_status == 'Cancelled':
        return
    for item in order.items:
        prod = db.session.get(Product, item.product_id)
        if prod:
            prod.available_quantity = (prod.available_quantity or 0) + item.quantity
            prod.sync_stock_flags()
    order.order_status = 'Cancelled'


@payments_bp.route('/fail', methods=['POST'])
@jwt_required()
def fail_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    order_id = data.get('order_id')
    reason = data.get('reason') or 'Payment failed or cancelled by user'

    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order.buyer_id != user_id:
        return jsonify({'error': 'Unauthorized access to order'}), 403

    payment = Payment.query.filter_by(order_id=order.id).first()
    if payment:
        payment.payment_provider = 'RAZORPAY'
        payment.status = 'Failed'
        payment.payment_reference = reason[:120]

    order.payment_status = 'Failed'
    _restore_order_stock(order)
    db.session.commit()

    return jsonify({
        'message': reason,
        'payment_status': 'Failed',
        'order': order.to_dict()
    }), 200


@payments_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    order_id = data.get('order_id')

    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order.buyer_id != user_id:
        return jsonify({'error': 'Unauthorized access to order'}), 403

    payment = Payment.query.filter_by(order_id=order.id).first()
    if payment:
        payment.payment_provider = 'RAZORPAY'
        payment.status = 'Cancelled'
        payment.payment_reference = 'Cancelled by buyer before payment'

    order.payment_status = 'Cancelled'
    _restore_order_stock(order)
    db.session.commit()

    return jsonify({
        'message': 'Payment cancelled. Items remain in your cart.',
        'payment_status': 'Cancelled',
        'order': order.to_dict()
    }), 200
