import { createSlice } from '@reduxjs/toolkit';

// The access token lives only in memory. On reload it is restored via the httpOnly refresh cookie.
// manualLogout: the user pressed Logout, so the next login must not jump back to their last page
const initialState = { user: null, accessToken: null, authChecked: false, manualLogout: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, { payload }) {
      if (payload.user) state.user = payload.user;
      if (payload.accessToken) state.accessToken = payload.accessToken;
      state.manualLogout = false;
    },
    setUser(state, { payload }) {
      state.user = payload;
    },
    setAuthChecked(state) {
      state.authChecked = true;
    },
    /** logout() = session expired (return to the page after login), logout({ manual: true }) = Logout button */
    logout(state, { payload }) {
      state.user = null;
      state.accessToken = null;
      state.manualLogout = Boolean(payload?.manual);
    },
  },
});

export const { setCredentials, setUser, setAuthChecked, logout } = authSlice.actions;
export const selectUser = (s) => s.auth.user;
export const selectIsAdmin = (s) => s.auth.user?.role === 'admin';
export default authSlice.reducer;
