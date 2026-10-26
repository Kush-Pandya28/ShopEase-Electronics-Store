import Order, { CANCELLABLE_STATUSES, ORDER_STATUSES } from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex, paginate } from '../utils/helpers.js';
import { RETURN_WINDOW_DAYS } from '../utils/pricing.js';
import { createOrderFromCart, restoreStock, releaseCoupon } from '../services/orderService.js';
import { generateInvoice } from '../services/invoiceService.js';
import { emails } from '../services/emailService.js';

const FLOW = ORDER_STATUSES.slice(0, 6); // placed -> delivered

const loadOrder = async (req) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');
  const isOwner = String(order.user?._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not allowed to view this order');
  return order;
};

// POST /api/orders  (Cash on Delivery - online payments go through /api/payments)
export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, couponCode, paymentMethod = 'cod' } = req.body;
  if (paymentMethod !== 'cod') throw new ApiError(400, 'Use /api/payments for online payment');
  const order = await createOrderFromCart({ user: req.user, addressId, couponCode, paymentMethod: 'cod' });
  res.status(201).json({ success: true, order });
});

// GET /api/orders/my
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 10 });
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, page, pages: Math.ceil(total / limit) || 1, total });
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  const returnDeadline = order.deliveredAt
    ? new Date(order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 86400000)
    : null;
  res.json({
    success: true,
    order,
    canCancel: CANCELLABLE_STATUSES.includes(order.status),
    canReturn: order.status === 'delivered' && !order.returnRequest?.status && returnDeadline > new Date(),
    returnDeadline,
  });
});

// PUT /api/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  if (String(order.user._id) !== String(req.user._id)) throw new ApiError(403, 'Not your order');
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new ApiError(400, 'Order can no longer be cancelled as it has been shipped');
  }
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });
  if (order.isPaid) order.paymentResult.status = 'refund_initiated';
  await order.save();
  await restoreStock(order.items);
  await releaseCoupon(order);
  res.json({ success: true, order });
});

// POST /api/orders/:id/return  { type: 'return'|'replace', reason }
export const requestReturn = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  if (String(order.user._id) !== String(req.user._id)) throw new ApiError(403, 'Not your order');
  if (order.status !== 'delivered') throw new ApiError(400, 'Only delivered orders can be returned');
  if (order.returnRequest?.status) throw new ApiError(400, 'A return request already exists for this order');
  const deadline = order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 86400000;
  if (Date.now() > deadline) throw new ApiError(400, `Return window of ${RETURN_WINDOW_DAYS} days has closed`);

  order.returnRequest = {
    type: req.body.type === 'replace' ? 'replace' : 'return',
    reason: req.body.reason,
    status: 'requested',
    requestedAt: new Date(),
  };
  await order.save();
  res.json({ success: true, order });
});

// GET /api/orders/:id/invoice
export const getInvoice = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  if (order.status === 'cancelled') throw new ApiError(400, 'Invoice is not available for cancelled orders');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.invoiceNumber}.pdf"`);
  generateInvoice(order, res);
});

// ---------- Admin ----------
// GET /api/orders?status=&q=&page=
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.returns === 'true') filter['returnRequest.status'] = 'requested';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ invoiceNumber: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .select('-statusHistory')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, page, pages: Math.ceil(total / limit) || 1, total });
});

// PUT /api/orders/:id/status  { status, note, trackingId, courier, serialNumbers: [{ itemId, serialNumber }] }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  const { status, note, trackingId, courier, serialNumbers } = req.body;

  if (trackingId !== undefined) order.trackingId = trackingId;
  if (courier !== undefined) order.courier = courier;
  if (Array.isArray(serialNumbers)) {
    serialNumbers.forEach(({ itemId, serialNumber }) => {
      const item = order.items.id(itemId);
      if (item) item.serialNumber = serialNumber;
    });
  }

  let statusChanged = false;
  if (status && status !== order.status) {
    if (['cancelled', 'returned'].includes(order.status)) throw new ApiError(400, `Order is already ${order.status}`);
    if (status === 'cancelled') {
      if (!CANCELLABLE_STATUSES.includes(order.status)) throw new ApiError(400, 'Shipped orders cannot be cancelled');
      await restoreStock(order.items);
      await releaseCoupon(order);
      order.cancelledAt = new Date();
      if (order.isPaid) order.paymentResult.status = 'refund_initiated';
    } else {
      const from = FLOW.indexOf(order.status);
      const to = FLOW.indexOf(status);
      if (to === -1) throw new ApiError(400, 'Invalid status');
      if (to < from) throw new ApiError(400, 'Order status cannot move backwards');
    }
    order.status = status;
    order.statusHistory.push({ status, note: note || `Order ${status.replace(/_/g, ' ')}` });
    statusChanged = true;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cod' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }
  }

  await order.save();
  if (statusChanged && ['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.status)) {
    emails.orderStatus(order.user, order);
  }
  res.json({ success: true, order });
});

// PUT /api/orders/:id/return  { action: 'approve'|'reject', note }
export const resolveReturn = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  if (order.returnRequest?.status !== 'requested') throw new ApiError(400, 'No pending return request');

  const approve = req.body.action === 'approve';
  order.returnRequest.status = approve ? 'approved' : 'rejected';
  order.returnRequest.resolvedAt = new Date();
  order.returnRequest.adminNote = req.body.note;

  if (approve && order.returnRequest.type === 'return') {
    order.status = 'returned';
    order.statusHistory.push({ status: 'returned', note: req.body.note || 'Return approved, refund initiated' });
    if (order.isPaid) order.paymentResult.status = 'refund_initiated';
    await restoreStock(order.items);
  } else if (approve) {
    order.statusHistory.push({ status: order.status, note: req.body.note || 'Replacement approved' });
  }
  await order.save();
  res.json({ success: true, order });
});
