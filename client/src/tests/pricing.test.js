import { calcPricing } from '../utils/pricing';

describe('client pricing preview', () => {
  test('adds Rs. 49 shipping below Rs. 999', () => {
    expect(calcPricing([{ price: 499, quantity: 1 }]).totalPrice).toBe(548);
  });

  test('free shipping and GST breakup above Rs. 999', () => {
    const p = calcPricing([{ price: 1180, mrp: 1500, quantity: 2 }]);
    expect(p.shippingPrice).toBe(0);
    expect(p.taxPrice).toBe(360);
    expect(p.savings).toBe(640);
  });
});
