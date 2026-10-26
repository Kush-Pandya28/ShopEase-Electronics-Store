import { api } from './api';

const toQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) {
      qs.set(k, Array.isArray(v) ? v.join(',') : v);
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

export const productApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query({
      query: (params) => `/products${toQuery(params)}`,
      providesTags: ['Products'],
    }),
    getFilterOptions: build.query({ query: (category) => `/products/filters${toQuery({ category })}` }),
    getSuggestions: build.query({ query: (q) => `/products/suggest${toQuery({ q })}` }),
    getFeatured: build.query({ query: () => '/products/featured', providesTags: ['Products'] }),
    getNewArrivals: build.query({ query: () => '/products/new', providesTags: ['Products'] }),
    getDeals: build.query({ query: () => '/products/deals', providesTags: ['Products'] }),
    getProduct: build.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (r) => [{ type: 'Product', id: r?.product?._id }],
    }),
    getRelated: build.query({ query: (id) => `/products/${id}/related` }),
    compareProducts: build.query({ query: (ids) => ({ url: '/products/compare', method: 'POST', body: { ids } }) }),

    getCategories: build.query({ query: (all) => `/categories${all ? '?all=true' : ''}`, providesTags: ['Category'] }),
    getCategory: build.query({ query: (slug) => `/categories/${slug}` }),
    getBrands: build.query({ query: (all) => `/brands${all ? '?all=true' : ''}`, providesTags: ['Brand'] }),
    getBanners: build.query({ query: (all) => `/banners${all ? '?all=true' : ''}`, providesTags: ['Banner'] }),
    getAvailableCoupons: build.query({ query: () => '/coupons/available', providesTags: ['Coupon'] }),
  }),
});

export { toQuery };
export const {
  useGetProductsQuery,
  useGetFilterOptionsQuery,
  useGetSuggestionsQuery,
  useGetFeaturedQuery,
  useGetNewArrivalsQuery,
  useGetDealsQuery,
  useGetProductQuery,
  useGetRelatedQuery,
  useCompareProductsQuery,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useGetBrandsQuery,
  useGetBannersQuery,
  useGetAvailableCouponsQuery,
} = productApi;
