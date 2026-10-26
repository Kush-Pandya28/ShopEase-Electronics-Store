const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export const formatPrice = (value, exact = false) => (exact ? inrExact : inr).format(Number(value) || 0);

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-IN', opts) : '';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

export const discountPercent = (mrp, price) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const variantLabel = (v = {}) =>
  [v.color, v.ram && `${v.ram} RAM`, v.storage].filter(Boolean).join(' | ');

/** No-cost EMI starting price for the given tenure (months). */
export const emiPerMonth = (price, months = 6) => Math.ceil(price / months);

export const statusLabel = (status = '') => status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.data?.message || err?.error || err?.message || fallback;
