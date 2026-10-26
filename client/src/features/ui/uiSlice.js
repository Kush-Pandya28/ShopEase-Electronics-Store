import { createSlice } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';

const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const initialState = loadState('ui', { theme: prefersDark ? 'dark' : 'light' });

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
