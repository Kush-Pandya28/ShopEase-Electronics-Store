import { createSlice } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';

const MAX_RECENT = 12;
const initialState = loadState('recent', { items: [] });

const recentSlice = createSlice({
  name: 'recent',
  initialState,
  reducers: {
    addRecent(state, { payload }) {
      state.items = [payload, ...state.items.filter((p) => p._id !== payload._id)].slice(0, MAX_RECENT);
    },
    clearRecent(state) {
      state.items = [];
    },
  },
});

export const { addRecent, clearRecent } = recentSlice.actions;
export default recentSlice.reducer;
