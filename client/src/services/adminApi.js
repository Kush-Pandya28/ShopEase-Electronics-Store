import { api } from './api';
import { toQuery } from './productApi';

const crud = (build, { path, tag, name }) => ({
  [`create${name}`]: build.mutation({
    query: (body) => ({ url: path, method: 'POST', body }),
    invalidatesTags: [tag],
  }),
  [`update${name}`]: build.mutation({
    query: ({ id, ...body }) => ({ url: `${path}/${id}`, method: 'PUT', body }),
    invalidatesTags: [tag],
  }),
  [`delete${name}`]: build.mutation({
    query: (id) => ({ url: `${path}/${id}`, method: 'DELETE' }),
    invalidatesTags: [tag],
  }),
});

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getStats: build.query({ query: (period = 'daily') => `/admin/stats?period=${period}`, providesTags: ['Stats'] }),
    getEmails: build.query({ query: () => '/admin/emails', providesTags: ['Emails'] }),
    // refreshed every minute: the public link changes when the computer restarts
    getPublicLink: build.query({ query: () => '/admin/public-link' }),
    sendTestEmail: build.mutation({
      query: (to) => ({ url: '/admin/emails/test', method: 'POST', body: { to } }),
      invalidatesTags: ['Emails'],
    }),

    // Products
    getAdminProducts: build.query({
      query: (params) => `/products/admin/all${toQuery(params)}`,
      providesTags: ['Products'],
    }),
    getAdminProduct: build.query({
      query: (id) => `/products/admin/${id}`,
      providesTags: (r, e, id) => [{ type: 'Product', id }],
    }),
    createProduct: build.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Products', 'Stats'],
    }),
    updateProduct: build.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => ['Products', 'Stats', { type: 'Product', id }],
    }),
    deleteProduct: build.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Products', 'Stats'],
    }),
    uploadImages: build.mutation({
      query: ({ files, folder = 'products' }) => {
        const form = new FormData();
        files.forEach((f) => form.append('images', f));
        return { url: `/upload?folder=${folder}`, method: 'POST', body: form };
      },
    }),

    // Orders
    getAllOrders: build.query({ query: (params) => `/orders${toQuery(params)}`, providesTags: ['Orders'] }),
    updateOrderStatus: build.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/status`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => ['Orders', 'Stats', { type: 'Order', id }],
    }),
    resolveReturn: build.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/return`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => ['Orders', 'Stats', { type: 'Order', id }],
    }),

    // Users
    getUsers: build.query({ query: (params) => `/users${toQuery(params)}`, providesTags: ['User'] }),
    updateUser: build.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),

    // Reviews
    getAllReviews: build.query({ query: (params) => `/reviews/admin/all${toQuery(params)}`, providesTags: ['Review'] }),
    adminDeleteReview: build.mutation({
      query: (id) => ({ url: `/reviews/admin/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Review', 'Products'],
    }),

    // Coupons
    getCoupons: build.query({ query: () => '/coupons', providesTags: ['Coupon'] }),
    ...crud(build, { path: '/coupons', tag: 'Coupon', name: 'Coupon' }),
    ...crud(build, { path: '/categories', tag: 'Category', name: 'Category' }),
    ...crud(build, { path: '/brands', tag: 'Brand', name: 'Brand' }),
    ...crud(build, { path: '/banners', tag: 'Banner', name: 'Banner' }),
  }),
});

export const {
  useGetStatsQuery,
  useGetEmailsQuery,
  useGetPublicLinkQuery,
  useSendTestEmailMutation,
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadImagesMutation,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useResolveReturnMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  useGetAllReviewsQuery,
  useAdminDeleteReviewMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = adminApi;
