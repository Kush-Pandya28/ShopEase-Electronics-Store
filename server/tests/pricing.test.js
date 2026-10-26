import { calcPricing, checkCoupon, discountPercent } from '../utils/pricing.js';

describe('pricing rules', () => {
  test('free shipping above Rs. 999, otherwise Rs. 49', () => {
    expect(calcPricing([{ price: 999, quantity: 1 }]).shippingPrice).toBe(0);
    expect(calcPricing([{ price: 500, quantity: 1 }]).shippingPrice).toBe(49);
    expect(calcPricing([]).shippingPrice).toBe(0);
  });

  test('GST (18%) is included in the price and shown as a breakup', () => {
    const p = calcPricing([{ price: 1180, quantity: 1 }]);
    expect(p.taxPrice).toBe(180);
    expect(p.taxableValue).toBe(1000);
    expect(p.totalPrice).toBe(1180);
  });

  test('discount reduces total and can never exceed items price', () => {
    const p = calcPricing([{ price: 2000, quantity: 2 }], 500);
    expect(p.itemsPrice).toBe(4000);
    expect(p.totalPrice).toBe(3500);
    expect(calcPricing([{ price: 100, quantity: 1 }], 500).discount).toBe(100);
  });

  test('discount percent', () => {
    expect(discountPercent(1000, 750)).toBe(25);
    expect(discountPercent(1000, 1000)).toBe(0);
  });
});

describe('coupon validation', () => {
  const base = { isActive: true, type: 'percent', value: 10, maxDiscount: 300, minOrderValue: 1000, usageLimit: 5, usedCount: 0, expiresAt: new Date(Date.now() + 86400000) };

  test('percent coupon respects max discount', () => {
    expect(checkCoupon(base, 2000)).toEqual({ valid: true, discount: 200 });
    expect(checkCoupon(base, 10000)).toEqual({ valid: true, discount: 300 });
  });

  test('flat coupon', () => {
    expect(checkCoupon({ ...base, type: 'flat', value: 250 }, 1500).discount).toBe(250);
  });

  test('rejects expired, exhausted, inactive and below minimum', () => {
    expect(checkCoupon({ ...base, expiresAt: new Date(Date.now() - 1000) }, 2000).valid).toBe(false);
    expect(checkCoupon({ ...base, usedCount: 5 }, 2000).valid).toBe(false);
    expect(checkCoupon({ ...base, isActive: false }, 2000).valid).toBe(false);
    expect(checkCoupon(base, 500).valid).toBe(false);
    expect(checkCoupon(null, 500).valid).toBe(false);
  });
});
