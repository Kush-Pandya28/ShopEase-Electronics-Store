import { createSlice } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';

export const MAX_COMPARE = 4;

const initialState = loadState('compare', { items: [] });

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    /** payload: { _id, title, slug, image, categoryId, categoryName } */
    addToCompare(state, { payload }) {
      if (state.items.some((i) => i._id === payload._id)) return;
      // Only same-category products can be compared: start a fresh list otherwise
      if (state.items.length && state.items[0].categoryId !== payload.categoryId) {
        state.items = [payload];
        return;
      }
      if (state.items.length >= MAX_COMPARE) state.items.shift();
      state.items.push(payload);
    },
    removeFromCompare(state, { payload: id }) {
      state.items = state.items.filter((i) => i._id !== id);
    },
    clearCompare(state) {
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
