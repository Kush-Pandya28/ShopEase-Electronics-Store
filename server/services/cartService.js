import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';
import { calcPricing, checkCoupon, variantLabel } from '../utils/pricing.js';

const PRODUCT_FIELDS = 'title slug images variants isActive brandName category';

/**
 * Loads the user's cart with live product data. Prices always come from the database,
 * never from the client. Items whose product or variant no longer exists are dropped.
 *
 * @param {string} userId
 * @param {string} [couponCode]
 * @param {{ strict?: boolean }} [opts] strict=true throws when the coupon is invalid
 */
export const buildCartSummary = async (userId, couponCode, { strict = false } = {}) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product', PRODUCT_FIELDS);
  const items = [];

  if (cart) {
    const valid = [];
    cart.items.forEach((item) => {
      const p = item.product;
      const v = p?.isActive ? p.variants.find((x) => x.sku === item.variantSku) : null;
      if (!v) return;
      valid.push(item);
      items.push({
        _id: item._id,
        productId: p._id,
        slug: p.slug,
        title: p.title,
        brandName: p.brandName,
        category: p.category,
        image: v.images?.[0] || p.images?.[0]?.url || '',
        variantSku: v.sku,
        variantLabel: variantLabel(v),
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        quantity: item.quantity,
      });
    });
    if (valid.length !== cart.items.length) {
      await Cart.updateOne({ _id: cart._id }, { $pull: { items: { _id: { $nin: valid.map((i) => i._id) } } } });
    }
  }

  let coupon = null;
  let couponId = null;
  let couponError = null;
  let discount = 0;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (couponCode) {
    const doc = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
    const result = checkCoupon(doc, subtotal);
    if (result.valid) {
      discount = result.discount;
      couponId = doc._id;
      coupon = { code: doc.code, description: doc.description, discount };
    } else if (strict) {
      throw new ApiError(400, result.message);
    } else {
      couponError = result.message;
    }
  }

  return { items, pricing: calcPricing(items, discount), coupon, couponError, couponId };
};

export const cartResponse = ({ couponId: _couponId, ...summary }) => summary;
