import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildCartSummary, cartResponse } from '../services/cartService.js';

const MAX_QTY_PER_ITEM = 10;

const findVariant = async (productId, sku) => {
  if (!mongoose.isValidObjectId(productId)) throw new ApiError(400, 'Invalid product');
  const product = await Product.findOne({ _id: productId, isActive: true }).select('title variants');
  const variant = product?.variants.find((v) => v.sku === sku);
  if (!variant) throw new ApiError(404, 'Product variant not found');
  return { product, variant };
};

const getOrCreateCart = async (userId) =>
  (await Cart.findOne({ user: userId })) || new Cart({ user: userId, items: [] });

const sendSummary = async (req, res, status = 200) => {
  const summary = await buildCartSummary(req.user._id, req.query.coupon || req.body?.coupon);
  res.status(status).json({ success: true, ...cartResponse(summary) });
};

const assertQty = (qty, variant) => {
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, 'Quantity must be at least 1');
  if (variant.stock === 0) throw new ApiError(400, 'This item is out of stock');
  if (qty > variant.stock) throw new ApiError(400, `Only ${variant.stock} unit(s) left in stock`);
  if (qty > MAX_QTY_PER_ITEM) throw new ApiError(400, `You can buy up to ${MAX_QTY_PER_ITEM} units per item`);
};

// GET /api/cart?coupon=CODE
export const getCart = asyncHandler(async (req, res) => sendSummary(req, res));

// POST /api/cart/items  { productId, variantSku, quantity }
export const addItem = asyncHandler(async (req, res) => {
  const { productId, variantSku } = req.body;
  const quantity = Number(req.body.quantity) || 1;
  const { variant } = await findVariant(productId, variantSku);
  const cart = await getOrCreateCart(req.user._id);

  const existing = cart.items.find((i) => String(i.product) === String(productId) && i.variantSku === variantSku);
  const nextQty = (existing?.quantity || 0) + quantity;
  assertQty(nextQty, variant);

  if (existing) {
    existing.quantity = nextQty;
    existing.price = variant.price;
  } else {
    cart.items.push({ product: productId, variantSku, quantity, price: variant.price });
  }
  await cart.save();
  await sendSummary(req, res, 201);
});

// PUT /api/cart/items/:itemId  { quantity }
export const updateItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  const { variant } = await findVariant(item.product, item.variantSku);
  const quantity = Number(req.body.quantity);
  assertQty(quantity, variant);
  item.quantity = quantity;
  item.price = variant.price;
  await cart.save();
  await sendSummary(req, res);
});

// DELETE /api/cart/items/:itemId
export const removeItem = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $pull: { items: { _id: req.params.itemId } } });
  await sendSummary(req, res);
});

// DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  await sendSummary(req, res);
});

// POST /api/cart/merge  { items: [{ productId, variantSku, quantity }] }  - guest cart merge after login
export const mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
  const cart = await getOrCreateCart(req.user._id);

  for (const line of incoming) {
    try {
       
      const { variant } = await findVariant(line.productId, line.variantSku);
      if (variant.stock === 0) continue;
      const existing = cart.items.find(
        (i) => String(i.product) === String(line.productId) && i.variantSku === line.variantSku
      );
      const wanted = (existing?.quantity || 0) + (Number(line.quantity) || 1);
      const quantity = Math.min(wanted, variant.stock, MAX_QTY_PER_ITEM);
      if (existing) existing.quantity = quantity;
      else cart.items.push({ product: line.productId, variantSku: line.variantSku, quantity, price: variant.price });
    } catch {
      // Skip products that no longer exist
    }
  }
  await cart.save();
  await sendSummary(req, res);
});

// POST /api/cart/coupon  { code }  - validates a coupon against the current cart
export const applyCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim();
  if (!code) throw new ApiError(400, 'Enter a coupon code');
  const summary = await buildCartSummary(req.user._id, code, { strict: true });
  res.json({ success: true, message: `Coupon ${summary.coupon.code} applied`, ...cartResponse(summary) });
});
