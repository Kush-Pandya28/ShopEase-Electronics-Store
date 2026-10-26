import { api } from './api';

export const orderApi = api.injectEndpoints({
  endpoints: (build) => ({
    createOrder: build.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Cart', 'Orders', 'Products'],
    }),
    getPaymentConfig: build.query({ query: () => '/payments/config' }),
    createPaymentOrder: build.mutation({
      query: (body) => ({ url: '/payments/create-order', method: 'POST', body }),
    }),
    verifyPayment: build.mutation({
      query: (body) => ({ url: '/payments/verify', method: 'POST', body }),
      invalidatesTags: ['Cart', 'Orders', 'Products'],
    }),
    getMyOrders: build.query({
      query: ({ page = 1, status = '' } = {}) => `/orders/my?page=${page}${status ? `&status=${status}` : ''}`,
      providesTags: ['Orders'],
    }),
    getOrder: build.query({
      query: (id) => `/orders/${id}`,
      providesTags: (r, e, id) => [{ type: 'Order', id }],
    }),
    cancelOrder: build.mutation({
      query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: 'PUT', body: { reason } }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Order', id }, 'Orders'],
    }),
    requestReturn: build.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/return`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Order', id }, 'Orders'],
    }),

    // Reviews
    getProductReviews: build.query({
      query: ({ productId, page = 1, sort = 'newest' }) => `/reviews/product/${productId}?page=${page}&sort=${sort}`,
      providesTags: (r, e, { productId }) => [{ type: 'Review', id: productId }],
    }),
    getReviewEligibility: build.query({
      query: (productId) => `/reviews/product/${productId}/eligibility`,
      providesTags: (r, e, productId) => [{ type: 'Review', id: `elig-${productId}` }],
    }),
    createReview: build.mutation({
      query: ({ productId, ...body }) => ({ url: `/reviews/product/${productId}`, method: 'POST', body }),
      invalidatesTags: (r, e, { productId }) => [
        { type: 'Review', id: productId },
        { type: 'Review', id: `elig-${productId}` },
        { type: 'Product', id: productId },
        'Review',
      ],
    }),
    updateReview: build.mutation({
      query: ({ id, productId: _productId, ...body }) => ({ url: `/reviews/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { productId }) => [{ type: 'Review', id: productId }, { type: 'Product', id: productId }, 'Review'],
    }),
    deleteMyReview: build.mutation({
      query: ({ id }) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, { productId }) => [
        { type: 'Review', id: productId },
        { type: 'Review', id: `elig-${productId}` },
        { type: 'Product', id: productId },
        'Review',
      ],
    }),
    toggleHelpful: build.mutation({
      query: ({ id }) => ({ url: `/reviews/${id}/helpful`, method: 'POST' }),
      invalidatesTags: (r, e, { productId }) => [{ type: 'Review', id: productId }],
    }),
    getMyReviews: build.query({ query: () => '/reviews/me', providesTags: ['Review'] }),
    uploadReviewImages: build.mutation({
      query: (files) => {
        const form = new FormData();
        files.forEach((f) => form.append('images', f));
        return { url: '/upload/review', method: 'POST', body: form };
      },
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetPaymentConfigQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetMyOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  useRequestReturnMutation,
  useGetProductReviewsQuery,
  useGetReviewEligibilityQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteMyReviewMutation,
  useToggleHelpfulMutation,
  useGetMyReviewsQuery,
  useUploadReviewImagesMutation,
} = orderApi;
