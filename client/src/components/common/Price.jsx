import { formatPrice, discountPercent } from '../../utils/format';

export default function Price({ price, mrp, size = 'md' }) {
  const off = discountPercent(mrp, price);
  const sizes = {
    sm: ['text-base', 'text-xs'],
    md: ['text-lg', 'text-sm'],
    lg: ['text-3xl', 'text-base'],
  }[size];
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-bold ${sizes[0]}`}>{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className={`text-gray-400 line-through ${sizes[1]}`}>{formatPrice(mrp)}</span>
          <span className={`font-semibold text-green-600 ${sizes[1]}`}>{off}% off</span>
        </>
      )}
    </div>
  );
}
