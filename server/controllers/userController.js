import User from '../models/User.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex, paginate } from '../utils/helpers.js';
import { clearRefreshCookie } from '../utils/generateToken.js';
import { PHONE_TAKEN } from './authController.js';

const WISHLIST_FIELDS = 'title slug images price mrp discountPercent ratingAverage ratingCount brandName stock variants isActive';

// GET /api/users/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone) {
    if (await User.exists({ phone, _id: { $ne: req.user._id } })) {
      throw new ApiError(409, PHONE_TAKEN, [{ field: 'phone', message: PHONE_TAKEN }]);
    }
    req.user.phone = phone;
  }
  if (avatar !== undefined) req.user.avatar = avatar;
  await req.user.save();
  res.json({ success: true, user: req.user });
});

// PUT /api/users/me/password
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

// ---------- Addresses ----------
const ADDRESS_FIELDS = ['fullName', 'phone', 'street', 'landmark', 'city', 'state', 'pincode', 'isDefault'];
const pickAddress = (body) =>
  Object.fromEntries(ADDRESS_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const ensureSingleDefault = (user, defaultId) => {
  user.addresses.forEach((a) => {
    a.isDefault = defaultId ? String(a._id) === String(defaultId) : a.isDefault;
  });
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
};

// POST /api/users/me/addresses
export const addAddress = asyncHandler(async (req, res) => {
  if (req.user.addresses.length >= 10) throw new ApiError(400, 'You can save up to 10 addresses');
  req.user.addresses.push(pickAddress(req.body));
  const added = req.user.addresses[req.user.addresses.length - 1];
  ensureSingleDefault(req.user, added.isDefault || req.user.addresses.length === 1 ? added._id : null);
  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses, address: added });
});

// PUT /api/users/me/addresses/:addressId
export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');
  address.set(pickAddress(req.body));
  ensureSingleDefault(req.user, req.body.isDefault ? address._id : null);
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// DELETE /api/users/me/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');
  address.deleteOne();
  ensureSingleDefault(req.user);
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// ---------- Wishlist ----------
// GET /api/users/me/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const products = await Product.find({ _id: { $in: req.user.wishlist }, isActive: true })
    .select(WISHLIST_FIELDS)
    .lean();
  res.json({ success: true, wishlist: products, ids: req.user.wishlist });
});

// POST /api/users/me/wishlist  { productId }
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!(await Product.exists({ _id: productId, isActive: true }))) throw new ApiError(404, 'Product not found');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });
  const user = await User.findById(req.user._id).select('wishlist');
  res.json({ success: true, ids: user.wishlist });
});

// DELETE /api/users/me/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
  const user = await User.findById(req.user._id).select('wishlist');
  res.json({ success: true, ids: user.wishlist });
});

// ---------- Admin ----------
// GET /api/users?q=&role=&page=
export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (req.query.role) filter.role = String(req.query.role);
  if (req.query.blocked) filter.isBlocked = req.query.blocked === 'true';

  const [users, total] = await Promise.all([
    User.find(filter).select('-addresses -wishlist').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, page, pages: Math.ceil(total / limit), total });
});

// PUT /api/users/:id  { isBlocked, role }
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) throw new ApiError(400, 'You cannot modify your own account here');

  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isBlocked !== undefined) {
    user.isBlocked = Boolean(req.body.isBlocked);
    if (user.isBlocked) {
      // force logout on every device
      user.refreshTokens = [];
      user.graceTokens = [];
    }
  }
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, user });
});

// Used when the current user deletes their session from all devices (optional helper)
export const logoutAll = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $set: { refreshTokens: [], graceTokens: [] } });
  clearRefreshCookie(res);
  res.json({ success: true });
});
