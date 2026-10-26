import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import Price from '../common/Price';
import { FALLBACK_IMAGE } from '../../utils/constants';
import { MAX_QTY } from '../../features/cart/cartSlice';

export default function CartItem({ item, onQuantity, onRemove, onMoveToWishlist, readOnly = false }) {
  const maxQty = Math.min(item.stock ?? MAX_QTY, MAX_QTY);
  const overStock = item.quantity > item.stock;
  return (
    <div className="flex gap-3 py-4 sm:gap-4">
      <Link to={`/product/${item.slug}`} className="shrink-0">
        <img
          src={item.image || FALLBACK_IMAGE}
          alt={item.title}
          className="h-20 w-20 rounded-lg border border-gray-100 bg-white object-contain p-1 sm:h-24 sm:w-24 dark:border-gray-800"
          loading="lazy"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-brand-600">
          {item.title}
        </Link>
        {item.variantLabel && <p className="mt-0.5 text-xs text-gray-500">{item.variantLabel}</p>}
        <div className="mt-1">
          <Price price={item.price} mrp={item.mrp} size="sm" />
        </div>
        {item.stock === 0 ? (
          <p className="mt-1 text-xs font-semibold text-red-600">Out of stock - remove to continue</p>
        ) : overStock ? (
          <p className="mt-1 text-xs font-semibold text-red-600">Only {item.stock} available - reduce quantity</p>
        ) : item.stock <= 5 ? (
          <p className="mt-1 text-xs text-orange-600">Only {item.stock} left in stock</p>
        ) : null}

        {!readOnly && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
              <button
                type="button"
                className="p-2 disabled:opacity-40"
                disabled={item.quantity <= 1}
                onClick={() => onQuantity(item, item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                <FiMinus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                {item.quantity}
              </span>
              <button
                type="button"
                className="p-2 disabled:opacity-40"
                disabled={item.quantity >= maxQty}
                onClick={() => onQuantity(item, item.quantity + 1)}
                aria-label="Increase quantity"
              >
                <FiPlus size={14} />
              </button>
            </div>
            {onMoveToWishlist && (
              <button type="button" className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => onMoveToWishlist(item)}>
                Save for later
              </button>
            )}
            <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline" onClick={() => onRemove(item)}>
              <FiTrash2 /> Remove
            </button>
          </div>
        )}
        {readOnly && <p className="mt-1 text-xs text-gray-500">Qty: {item.quantity}</p>}
      </div>
    </div>
  );
}
