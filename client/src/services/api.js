import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from '../features/auth/authSlice';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshing = null;

/** On 401, refresh the access token once (shared across parallel requests) and retry. */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 401 && api.getState().auth.accessToken && !url.startsWith('/auth/')) {
    if (!refreshing) {
      refreshing = rawBaseQuery({ url: '/auth/refresh-token', method: 'POST' }, api, extraOptions).finally(() => {
        refreshing = null;
      });
    }
    const refresh = await refreshing;
    if (refresh.data?.accessToken) {
      api.dispatch(setCredentials(refresh.data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Me',
    'Cart',
    'Wishlist',
    'Product',
    'Products',
    'Category',
    'Brand',
    'Banner',
    'Order',
    'Orders',
    'Review',
    'Coupon',
    'User',
    'Stats',
    'Emails',
  ],
  endpoints: () => ({}),
});
