import { api } from './api';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    register: build.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    logout: build.mutation({ query: () => ({ url: '/auth/logout', method: 'POST' }) }),
    forgotPassword: build.mutation({ query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }) }),
    resetPassword: build.mutation({
      query: ({ token, password }) => ({ url: `/auth/reset-password/${token}`, method: 'PUT', body: { password } }),
    }),
    verifyEmail: build.query({ query: (token) => `/auth/verify-email/${token}` }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery,
} = authApi;
