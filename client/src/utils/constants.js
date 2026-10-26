export const ORDER_FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export const STATUS_STYLES = {
  placed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  confirmed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  packed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  shipped: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  out_for_delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  returned: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer rating' },
  { value: 'discount', label: 'Discount' },
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Inline SVG so the fallback works offline
export const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#e5e7eb"/><text x="300" y="315" fill="#9ca3af" font-family="Arial" font-size="40" text-anchor="middle">ShopEase</text></svg>'
)}`;
