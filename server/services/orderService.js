import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { generateInvoiceNumber } from '../utils/helpers.js';
import { buildCartSummary } from './cartService.js';
import { emails } from './emailService.js';

const lowStockThreshold = () => Number(process.env.LOW_STOCK_THRESHOLD) || 5;

/** Adds stock back for the given lines ({ product|productId, variantSku, quantity }). */
export const restoreStock = async (lines) => {
  await Promise.all(
    lines.map((l) =>
      Product.updateOne(
        { _id: l.productId || l.product, 'variants.sku': l.variantSku },
        { $inc: { 'variants.$.stock': l.quantity, stock: l.quantity, soldCount: -l.quantity } }
      )
    )
  );
};

/** Gives back one coupon use when an order that used it is cancelled. */
export const releaseCoupon = async (order) => {
  if (!order.coupon) return;
  await Coupon.updateOne({ code: order.coupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
};

/** Atomically decrements stock for each line; rolls back already reserved lines on failure. */
const reserveStock = async (lines) => {
  const reserved = [];
  try {
    for (const l of lines) {
       
      const result = await Product.updateOne(
        { _id: l.productId, variants: { $elemMatch: { sku: l.variantSku, stock: { $gte: l.quantity } } } },
        { $inc: { 'variants.$.stock': -l.quantity, stock: -l.quantity, soldCount: l.quantity } }
      );
      if (result.modifiedCount === 0) {
        throw new ApiError(409, `${l.title} just went out of stock. Please update your cart.`);
      }
      reserved.push(l);
    }
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
};

const notifyLowStock = async (productIds) => {
  const low = await Product.find({ _id: { $in: productIds }, stock: { $lte: lowStockThreshold() } })
    .select('title stock')
    .lean();
  if (low.length) emails.lowStock(low);
};

/**
 * Validates the cart server-side (prices, stock, coupon) and turns it into an order.
 * Used by both COD checkout and verified online payments.
 */
export const createOrderFromCart = async ({ user, addressId, paymentMethod, couponCode, paymentResult }) => {
  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(400, 'Please select a valid delivery address');

  const summary = await buildCartSummary(user._id, couponCode, { strict: true });
  if (!summary.items.length) throw new ApiError(400, 'Your cart is empty');

  const short = summary.items.find((l) => l.quantity > l.stock);
  if (short) {
    throw new ApiError(
      400,
      short.stock === 0 ? `${short.title} is out of stock` : `Only ${short.stock} unit(s) of ${short.title} available`
    );
  }

  await reserveStock(summary.items);

  let order;
  try {
    const { pricing } = summary;
    const now = new Date();
    order = await Order.create({
      user: user._id,
      items: summary.items.map((l) => ({
        product: l.productId,
        title: l.title,
        slug: l.slug,
        brandName: l.brandName,
        image: l.image,
        variantSku: l.variantSku,
        variantLabel: l.variantLabel,
        quantity: l.quantity,
        price: l.price,
        mrp: l.mrp,
      })),
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      paymentMethod,
      paymentResult,
      itemsPrice: pricing.itemsPrice,
      discount: pricing.discount,
      taxPrice: pricing.taxPrice,
      shippingPrice: pricing.shippingPrice,
      totalPrice: pricing.totalPrice,
      coupon: summary.coupon?.code || null,
      isPaid: Boolean(paymentResult?.paidAt),
      paidAt: paymentResult?.paidAt,
      status: 'placed',
      statusHistory: [{ status: 'placed', date: now, note: 'Order placed successfully' }],
      invoiceNumber: generateInvoiceNumber(),
    });
  } catch (err) {
    await restoreStock(summary.items);
    throw err;
  }

  if (summary.couponId) await Coupon.updateOne({ _id: summary.couponId }, { $inc: { usedCount: 1 } });
  await Cart.updateOne({ user: user._id }, { $set: { items: [] } });

  emails.orderConfirmation(user, order);
  notifyLowStock(summary.items.map((l) => l.productId)).catch((e) => logger.error(e.message));

  return order;
};
