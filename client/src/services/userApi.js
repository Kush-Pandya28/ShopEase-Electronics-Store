import { api } from './api';
import { setUser } from '../features/auth/authSlice';

const syncUser = async (_arg, { dispatch, queryFulfilled }) => {
  try {
    const { data } = await queryFulfilled;
    if (data.user) dispatch(setUser(data.user));
  } catch {
    // handled by the caller
  }
};

export const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query({ query: () => '/users/me', providesTags: ['Me'], onQueryStarted: syncUser }),
    updateMe: build.mutation({
      query: (body) => ({ url: '/users/me', method: 'PUT', body }),
      invalidatesTags: ['Me'],
      onQueryStarted: syncUser,
    }),
    changePassword: build.mutation({ query: (body) => ({ url: '/users/me/password', method: 'PUT', body }) }),
    addAddress: build.mutation({
      query: (body) => ({ url: '/users/me/addresses', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    updateAddress: build.mutation({
      query: ({ id, ...body }) => ({ url: `/users/me/addresses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Me'],
    }),
    deleteAddress: build.mutation({
      query: (id) => ({ url: `/users/me/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Me'],
    }),
    getWishlist: build.query({ query: () => '/users/me/wishlist', providesTags: ['Wishlist'] }),
    addToWishlist: build.mutation({
      query: (productId) => ({ url: '/users/me/wishlist', method: 'POST', body: { productId } }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: build.mutation({
      query: (productId) => ({ url: `/users/me/wishlist/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = userApi;
