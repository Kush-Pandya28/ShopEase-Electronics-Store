import { formatPrice } from '../../utils/format';
import { FREE_SHIPPING_THRESHOLD } from '../../utils/pricing';

function Row({ label, value, className = '' }) {
  return (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function PriceSummary({ pricing, count, coupon, children }) {
  if (!pricing) return null;
  const mrpDiscount = pricing.mrpTotal - pricing.itemsPrice;
  const toFree = FREE_SHIPPING_THRESHOLD - (pricing.itemsPrice - pricing.discount);
  return (
    <div className="card p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Price details</h2>
      <div className="space-y-2.5">
        <Row label={`Price (${count} item${count === 1 ? '' : 's'})`} value={formatPrice(pricing.mrpTotal)} />
        {mrpDiscount > 0 && <Row label="Discount on MRP" value={<span className="text-green-600">- {formatPrice(mrpDiscount)}</span>} />}
        {pricing.discount > 0 && (
          <Row label={`Coupon${coupon?.code ? ` (${coupon.code})` : ''}`} value={<span className="text-green-600">- {formatPrice(pricing.discount, true)}</span>} />
        )}
        <Row
          label="Delivery charges"
          value={pricing.shippingPrice ? formatPrice(pricing.shippingPrice) : <span className="text-green-600">FREE</span>}
        />
        <Row label="GST (18%, included)" value={formatPrice(pricing.taxPrice, true)} className="text-xs" />
      </div>
      <div className="my-3 border-t border-dashed border-gray-300 dark:border-gray-700" />
      <div className="flex justify-between text-base font-bold">
        <span>Total amount</span>
        <span>{formatPrice(pricing.totalPrice, true)}</span>
      </div>
      {pricing.savings > 0 && (
        <p className="mt-2 text-sm font-semibold text-green-600">You save {formatPrice(pricing.savings)} on this order</p>
      )}
      {pricing.shippingPrice > 0 && toFree > 0 && (
        <p className="mt-2 text-xs text-gray-500">Add {formatPrice(toFree)} more for FREE delivery</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
