import { configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import compareReducer from '../features/compare/compareSlice';
import recentReducer from '../features/recent/recentSlice';
import uiReducer from '../features/ui/uiSlice';
import { saveState } from '../utils/storage';

export const createStore = (preloadedState) =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
      cart: cartReducer,
      compare: compareReducer,
      recent: recentReducer,
      ui: uiReducer,
    },
    preloadedState,
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

export const store = createStore();

// Persist the guest cart, compare list, recently viewed and theme
let saveTimer;
store.subscribe(() => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { cart, compare, recent, ui } = store.getState();
    saveState('cart', cart);
    saveState('compare', compare);
    saveState('recent', recent);
    saveState('ui', ui);
  }, 200);
});
