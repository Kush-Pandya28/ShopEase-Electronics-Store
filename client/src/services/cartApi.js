import { api } from './api';

const withCoupon = (url, coupon) => (coupon ? `${url}?coupon=${encodeURIComponent(coupon)}` : url);

/**
 * Every cart mutation returns the full cart summary, so we write it straight into
 * the cached getCart query instead of refetching.
 */
const updateCache = (coupon) => async (_arg, { dispatch, queryFulfilled }) => {
  try {
    const { data } = await queryFulfilled;
    dispatch(cartApi.util.upsertQueryData('getCart', coupon, data));
  } catch {
    // error surfaced to the caller
  }
};

export const cartApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCart: build.query({
      query: (coupon = '') => withCoupon('/cart', coupon),
      providesTags: ['Cart'],
    }),
    addCartItem: build.mutation({
      query: ({ coupon, ...body }) => ({ url: withCoupon('/cart/items', coupon), method: 'POST', body }),
      onQueryStarted: (arg, ctx) => updateCache(arg.coupon || '')(arg, ctx),
    }),
    updateCartItem: build.mutation({
      query: ({ itemId, quantity, coupon }) => ({
        url: withCoupon(`/cart/items/${itemId}`, coupon),
        method: 'PUT',
        body: { quantity },
      }),
      onQueryStarted: (arg, ctx) => updateCache(arg.coupon || '')(arg, ctx),
    }),
    removeCartItem: build.mutation({
      query: ({ itemId, coupon }) => ({ url: withCoupon(`/cart/items/${itemId}`, coupon), method: 'DELETE' }),
      onQueryStarted: (arg, ctx) => updateCache(arg.coupon || '')(arg, ctx),
    }),
    mergeCart: build.mutation({
      query: (items) => ({ url: '/cart/merge', method: 'POST', body: { items } }),
      invalidatesTags: ['Cart'],
    }),
    applyCoupon: build.mutation({
      query: (code) => ({ url: '/cart/coupon', method: 'POST', body: { code } }),
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useMergeCartMutation,
  useApplyCouponMutation,
} = cartApi;
