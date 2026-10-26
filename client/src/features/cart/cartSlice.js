import { createSlice } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';

export const MAX_QTY = 10;

// Guest cart (localStorage). Logged-in users use the server cart via RTK Query.
const initialState = loadState('cart', { items: [], couponCode: '' });

const keyOf = (productId, variantSku) => `${productId}:${variantSku}`;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addGuestItem(state, { payload }) {
      const { productId, variantSku, quantity = 1 } = payload;
      const key = keyOf(productId, variantSku);
      const existing = state.items.find((i) => i.key === key);
      const limit = Math.min(payload.stock ?? MAX_QTY, MAX_QTY);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, limit);
        existing.price = payload.price;
        existing.stock = payload.stock;
      } else {
        state.items.push({ ...payload, key, quantity: Math.min(quantity, limit) });
      }
    },
    updateGuestQty(state, { payload: { key, quantity } }) {
      const item = state.items.find((i) => i.key === key);
      if (item) item.quantity = Math.max(1, Math.min(quantity, item.stock ?? MAX_QTY, MAX_QTY));
    },
    removeGuestItem(state, { payload: key }) {
      state.items = state.items.filter((i) => i.key !== key);
    },
    clearGuestCart(state) {
      state.items = [];
    },
    setCouponCode(state, { payload }) {
      state.couponCode = payload || '';
    },
  },
});

export const { addGuestItem, updateGuestQty, removeGuestItem, clearGuestCart, setCouponCode } = cartSlice.actions;
export default cartSlice.reducer;
