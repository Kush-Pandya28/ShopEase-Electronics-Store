import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import EmailLog from '../models/EmailLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import QRCode from 'qrcode';
import { emails, getEmailStatus, publicLink } from '../services/emailService.js';
import { toCsv } from '../utils/helpers.js';

const REVENUE_MATCH = { status: { $nin: ['cancelled', 'returned'] } };

const PERIODS = {
  daily: { days: 30, format: '%Y-%m-%d' },
  weekly: { days: 7 * 12, format: '%G-W%V' },
  monthly: { days: 365, format: '%Y-%m' },
};

// GET /api/admin/stats?period=daily|weekly|monthly
export const getStats = asyncHandler(async (req, res) => {
  const period = PERIODS[req.query.period] || PERIODS.daily;
  const since = new Date(Date.now() - period.days * 86400000);
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

  const [
    totals,
    totalOrders,
    totalUsers,
    totalProducts,
    pendingReturns,
    revenueChart,
    statusBreakdown,
    lowStock,
    topSelling,
    recentOrders,
    reviewCount,
  ] = await Promise.all([
    Order.aggregate([
      { $match: REVENUE_MATCH },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments({ 'returnRequest.status': 'requested' }),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: period.format, date: '$createdAt', timezone: 'Asia/Kolkata' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.find({ stock: { $lte: threshold } })
      .select('title slug stock images brandName')
      .sort({ stock: 1 })
      .limit(10)
      .lean(),
    Product.find()
      .select('title slug soldCount price images brandName')
      .sort({ soldCount: -1 })
      .limit(5)
      .lean(),
    Order.find()
      .populate('user', 'name email')
      .select('totalPrice status createdAt invoiceNumber isPaid paymentMethod')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Review.countDocuments(),
  ]);

  res.json({
    success: true,
    totals: {
      revenue: Math.round(totals[0]?.revenue || 0),
      orders: totalOrders,
      users: totalUsers,
      products: totalProducts,
      reviews: reviewCount,
      pendingReturns,
      averageOrderValue: totals[0]?.count ? Math.round(totals[0].revenue / totals[0].count) : 0,
    },
    revenueChart: revenueChart.map((r) => ({
      label: r._id,
      revenue: Math.round(r.revenue),
      orders: r.orders,
    })),
    statusBreakdown: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
    lowStock,
    topSelling,
    recentOrders,
  });
});

// GET /api/admin/sales-report?from=YYYY-MM-DD&to=YYYY-MM-DD&status=
export const getSalesReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
  }
  if (req.query.status) filter.status = String(req.query.status);

  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).lean();
  const rows = [
    [
      'Invoice',
      'Order ID',
      'Date',
      'Customer',
      'Email',
      'Items',
      'Items Price',
      'Discount',
      'GST',
      'Shipping',
      'Total',
      'Payment',
      'Paid',
      'Status',
      'City',
      'State',
    ],
    ...orders.map((o) => [
      o.invoiceNumber,
      o._id,
      new Date(o.createdAt).toISOString().slice(0, 10),
      o.user?.name || o.shippingAddress?.fullName,
      o.user?.email,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.itemsPrice,
      o.discount,
      o.taxPrice,
      o.shippingPrice,
      o.totalPrice,
      o.paymentMethod,
      o.isPaid ? 'Yes' : 'No',
      o.status,
      o.shippingAddress?.city,
      o.shippingAddress?.state,
    ]),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.csv"`);
  res.send(toCsv(rows));
});

// GET /api/admin/emails  - delivery mode + last 100 emails
export const getEmails = asyncHandler(async (req, res) => {
  const [status, logs] = await Promise.all([
    getEmailStatus(),
    EmailLog.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  res.json({ success: true, status, emails: logs });
});

// GET /api/admin/public-link - the internet link of this store (Cloudflare Tunnel) with a QR code
export const getPublicLink = asyncHandler(async (req, res) => {
  const url = publicLink();
  const lanUrl = process.env.PUBLIC_SITE_URL || '';
  const qr = url ? await QRCode.toDataURL(url, { width: 220, margin: 1 }) : null;
  res.json({ success: true, url: url || null, lanUrl: lanUrl || null, qr });
});

// POST /api/admin/emails/test  { to }
export const sendTestEmail = asyncHandler(async (req, res) => {
  const to = String(req.body.to || req.user.email).trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) throw new ApiError(400, 'Enter a valid email address');
  const result = await emails.test(to);
  if (result.status === 'failed') throw new ApiError(502, `Email could not be sent: ${result.error}`);
  res.json({ success: true, ...result, to });
});
