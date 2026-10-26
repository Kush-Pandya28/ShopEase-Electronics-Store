import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildCartSummary } from '../services/cartService.js';

const FIELDS = ['code', 'description', 'type', 'value', 'minOrderValue', 'maxDiscount', 'expiresAt', 'usageLimit', 'isActive'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// POST /api/coupons/validate  { code }  - checked against the logged-in user's cart
export const validateCoupon = asyncHandler(async (req, res) => {
  const summary = await buildCartSummary(req.user._id, req.body.code, { strict: true });
  res.json({ success: true, coupon: summary.coupon, pricing: summary.pricing });
});

// GET /api/coupons/available  - public list of active coupons to show at checkout
export const getAvailableCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } })
    .select('code description type value minOrderValue maxDiscount expiresAt usageLimit usedCount')
    .sort({ minOrderValue: 1 })
    .lean();
  res.json({ success: true, coupons: coupons.filter((c) => !c.usageLimit || c.usedCount < c.usageLimit) });
});

// ---------- Admin ----------
export const getCoupons = asyncHandler(async (req, res) => {
  res.json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
});

export const createCoupon = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, coupon: await Coupon.create(pick(req.body)) });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  coupon.set(pick(req.body));
  await coupon.save();
  res.json({ success: true, coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, message: 'Coupon deleted' });
});
