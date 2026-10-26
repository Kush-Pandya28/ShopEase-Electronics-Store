// Business rules shared by cart, checkout, orders and invoices.
// Product prices are GST-inclusive (standard for Indian retail), GST is shown as a breakup.

export const GST_RATE = 0.18;
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_CHARGE = 49;
export const RETURN_WINDOW_DAYS = 7;

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const discountPercent = (mrp, price) =>
  mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const variantLabel = (variant) =>
  [variant.color, variant.ram && `${variant.ram} RAM`, variant.storage].filter(Boolean).join(' | ');

/**
 * Checks a coupon against a cart subtotal.
 * @returns {{ valid: boolean, message?: string, discount?: number }}
 */
export function checkCoupon(coupon, subtotal, now = new Date()) {
  if (!coupon || !coupon.isActive) return { valid: false, message: 'Invalid coupon code' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { valid: false, message: 'This coupon has expired' };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit' };
  }
  if (subtotal < (coupon.minOrderValue || 0)) {
    return {
      valid: false,
      message: `Add items worth Rs. ${round2(coupon.minOrderValue - subtotal)} more to use this coupon`,
    };
  }
  let discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = round2(Math.min(discount, subtotal));
  return { valid: true, discount };
}

/**
 * @param {{ price: number, quantity: number }[]} items
 * @param {number} discount coupon discount already validated
 */
export function calcPricing(items, discount = 0) {
  const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const mrpTotal = round2(items.reduce((sum, i) => sum + (i.mrp || i.price) * i.quantity, 0));
  const appliedDiscount = round2(Math.min(Math.max(discount, 0), itemsPrice));
  const afterDiscount = round2(itemsPrice - appliedDiscount);
  const shippingPrice =
    items.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const taxPrice = round2((afterDiscount * GST_RATE) / (1 + GST_RATE));
  return {
    mrpTotal,
    itemsPrice,
    discount: appliedDiscount,
    taxableValue: round2(afterDiscount - taxPrice),
    taxPrice,
    shippingPrice,
    totalPrice: round2(afterDiscount + shippingPrice),
    savings: round2(mrpTotal - itemsPrice + appliedDiscount),
  };
}
