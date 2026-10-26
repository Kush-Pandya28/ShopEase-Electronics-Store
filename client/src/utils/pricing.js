// Mirror of server/utils/pricing.js used for the guest cart preview.
// The server always recalculates the final amount at checkout.

export const GST_RATE = 0.18;
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_CHARGE = 49;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function calcPricing(items, discount = 0) {
  const itemsPrice = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  const mrpTotal = round2(items.reduce((s, i) => s + (i.mrp || i.price) * i.quantity, 0));
  const appliedDiscount = round2(Math.min(Math.max(discount, 0), itemsPrice));
  const afterDiscount = round2(itemsPrice - appliedDiscount);
  const shippingPrice = items.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
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
