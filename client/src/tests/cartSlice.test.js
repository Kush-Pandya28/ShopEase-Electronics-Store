import reducer, { addGuestItem, updateGuestQty, removeGuestItem, setCouponCode } from '../features/cart/cartSlice';

const item = { productId: 'p1', variantSku: 'SKU1', title: 'Phone', price: 1000, mrp: 1200, stock: 3 };
const empty = { items: [], couponCode: '' };

describe('guest cart slice', () => {
  test('adds an item and merges duplicates', () => {
    let state = reducer(empty, addGuestItem({ ...item, quantity: 1 }));
    state = reducer(state, addGuestItem({ ...item, quantity: 1 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.items[0].key).toBe('p1:SKU1');
  });

  test('never exceeds available stock', () => {
    let state = reducer(empty, addGuestItem({ ...item, quantity: 2 }));
    state = reducer(state, addGuestItem({ ...item, quantity: 5 }));
    expect(state.items[0].quantity).toBe(3);
    state = reducer(state, updateGuestQty({ key: 'p1:SKU1', quantity: 10 }));
    expect(state.items[0].quantity).toBe(3);
    state = reducer(state, updateGuestQty({ key: 'p1:SKU1', quantity: 0 }));
    expect(state.items[0].quantity).toBe(1);
  });

  test('removes items and stores coupon code', () => {
    let state = reducer(empty, addGuestItem(item));
    state = reducer(state, removeGuestItem('p1:SKU1'));
    expect(state.items).toHaveLength(0);
    state = reducer(state, setCouponCode('WELCOME10'));
    expect(state.couponCode).toBe('WELCOME10');
  });
});
