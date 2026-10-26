import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../config/logger.js';
import { getRazorpay, isPaymentMock, isRazorpayConfigured } from '../config/razorpay.js';

// GET /api/payments/config - lets checkout hide "Pay online" when it cannot work
export const getPaymentConfig = (req, res) => {
  const razorpay = isRazorpayConfigured();
  res.json({ success: true, online: razorpay || isPaymentMock(), testMode: !razorpay && isPaymentMock() });
};
import { buildCartSummary } from '../services/cartService.js';
import { createOrderFromCart } from '../services/orderService.js';
import { toPaise, isValidPaymentSignature, isValidWebhookSignature } from '../services/paymentService.js';

// POST /api/payments/create-order  { couponCode, addressId }
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const summary = await buildCartSummary(req.user._id, req.body.couponCode, { strict: true });
  if (!summary.items.length) throw new ApiError(400, 'Your cart is empty');
  if (!req.user.addresses.id(req.body.addressId))
    throw new ApiError(400, 'Please select a valid delivery address');
  const short = summary.items.find((l) => l.quantity > l.stock);
  if (short) throw new ApiError(400, `Only ${short.stock} unit(s) of ${short.title} available`);

  const amount = toPaise(summary.pricing.totalPrice);
  const razorpay = getRazorpay();

  if (!razorpay) {
    if (!isPaymentMock())
      throw new ApiError(503, 'Online payment is not configured. Please choose Cash on Delivery.');
    return res.json({
      success: true,
      mock: true,
      razorpayOrderId: `mock_order_${Date.now()}`,
      amount,
      currency: 'INR',
    });
  }

  const rpOrder = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `rcpt_${String(req.user._id).slice(-6)}_${Date.now()}`,
    notes: { userId: String(req.user._id) },
  });

  return res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: rpOrder.id,
    amount: rpOrder.amount,
    currency: rpOrder.currency,
    user: { name: req.user.name, email: req.user.email, contact: req.user.phone },
  });
});

// POST /api/payments/verify
// { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId, couponCode, mock }
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;
  const { addressId, couponCode } = req.body;
  if (!orderId) throw new ApiError(400, 'Missing payment details');

  const existing = await Order.findOne({ 'paymentResult.razorpayOrderId': orderId });
  if (existing) return res.json({ success: true, order: existing });

  const razorpay = getRazorpay();
  let paymentResult;

  if (!razorpay && req.body.mock && isPaymentMock()) {
    paymentResult = {
      id: `mock_pay_${Date.now()}`,
      razorpayOrderId: orderId,
      status: 'paid',
      paidAt: new Date(),
    };
  } else {
    if (!razorpay) throw new ApiError(503, 'Online payment is not configured');
    if (!isValidPaymentSignature({ orderId, paymentId, signature }))
      throw new ApiError(400, 'Payment verification failed');

    // Make sure the cart total still matches what was actually paid
    const [rpOrder, summary] = await Promise.all([
      razorpay.orders.fetch(orderId),
      buildCartSummary(req.user._id, couponCode, { strict: true }),
    ]);
    if (rpOrder.notes?.userId !== String(req.user._id))
      throw new ApiError(400, 'Payment does not belong to this user');
    if (rpOrder.amount !== toPaise(summary.pricing.totalPrice)) {
      logger.error(
        `Amount mismatch for ${orderId}: paid ${rpOrder.amount}, cart ${summary.pricing.totalPrice}`
      );
      throw new ApiError(409, 'Cart changed after payment. Our team will refund you shortly.');
    }
    paymentResult = { id: paymentId, razorpayOrderId: orderId, status: 'paid', paidAt: new Date() };
  }

  try {
    const order = await createOrderFromCart({
      user: req.user,
      addressId,
      couponCode,
      paymentMethod: 'razorpay',
      paymentResult,
    });
    return res.status(201).json({ success: true, order });
  } catch (err) {
    logger.error(
      `Paid order creation failed (payment ${paymentResult.id}): ${err.message} - refund required`
    );
    throw err;
  }
});

// POST /api/payments/webhook  (raw body, Razorpay server-to-server)
export const razorpayWebhook = asyncHandler(async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(200).json({ ignored: true });
  if (!isValidWebhookSignature(req.body, req.headers['x-razorpay-signature'])) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const event = JSON.parse(req.body.toString('utf8'));
  const payment = event.payload?.payment?.entity;

  if (event.event === 'payment.captured' && payment?.order_id) {
    const order = await Order.findOne({ 'paymentResult.razorpayOrderId': payment.order_id });
    if (order && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult.status = 'paid';
      await order.save();
    }
  } else if (event.event === 'payment.failed') {
    logger.info(`Razorpay payment failed for order ${payment?.order_id}`);
  }
  return res.json({ received: true });
});
