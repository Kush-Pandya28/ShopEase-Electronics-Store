import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiColumns, FiShoppingCart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import Rating from '../common/Rating';
import Price from '../common/Price';
import { FALLBACK_IMAGE } from '../../utils/constants';

const isPhoto = (url = '') => !url.startsWith('data:image/svg');

/**
 * Pure presentational card. Actions are injected so the card stays easy to test.
 */
function ProductCard({ product, onAddToCart, onToggleWishlist, onToggleCompare, inWishlist = false, inCompare = false }) {
  const image = product.images?.[0]?.url || FALLBACK_IMAGE;
  // Second photo shown on hover (desktop)
  const hoverImage = isPhoto(image) ? product.images?.[1]?.url : undefined;
  const outOfStock = product.stock <= 0;
  const firstInStock = product.variants?.find((v) => v.stock > 0);

  return (
    <article className="card group relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10 dark:hover:border-brand-800">
      {product.discountPercent > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md">
          {product.discountPercent}% OFF
        </span>
      )}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={() => onToggleWishlist(product._id)}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-md backdrop-blur transition hover:scale-110 hover:text-red-500 dark:bg-gray-800/90 dark:text-gray-300"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={inWishlist}
        >
          {inWishlist ? <FaHeart className="text-red-500" /> : <FiHeart />}
        </button>
      )}

      <Link
        to={`/product/${product.slug}`}
        className="relative m-2 block overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
      >
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className={`aspect-square w-full transition duration-500 group-hover:scale-105 ${isPhoto(image) ? 'object-cover' : 'object-contain'} ${hoverImage ? 'group-hover:opacity-0' : ''}`}
        />
        {hoverImage && (
          <img
            src={hoverImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 aspect-square w-full scale-105 object-cover opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100"
          />
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/75 py-1.5 text-center text-xs font-bold uppercase tracking-wider text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
          {product.brandName}
        </p>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-brand-600">
          {product.title}
        </Link>
        <Rating value={product.ratingAverage} count={product.ratingCount} />
        <Price price={product.price} mrp={product.mrp} size="sm" />
        {product.emiAvailable && product.price >= 3000 && (
          <p className="text-xs text-gray-500">No-cost EMI available</p>
        )}
        {!outOfStock && product.stock <= 5 && (
          <p className="text-xs font-semibold text-orange-600">Only {product.stock} left</p>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          {onAddToCart && (
            <button
              type="button"
              className="btn-primary btn-sm flex-1 bg-gradient-to-r from-brand-600 to-violet-600 shadow-sm shadow-brand-600/30 hover:from-brand-700 hover:to-violet-700"
              disabled={outOfStock}
              onClick={() => onAddToCart(product, firstInStock)}
            >
              <FiShoppingCart /> {outOfStock ? 'Sold out' : 'Add'}
            </button>
          )}
          {onToggleCompare && (
            <button
              type="button"
              className={`btn-outline btn-sm ${inCompare ? 'border-brand-500 text-brand-600' : ''}`}
              onClick={() => onToggleCompare(product)}
              aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
              aria-pressed={inCompare}
              title="Compare"
            >
              <FiColumns />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
