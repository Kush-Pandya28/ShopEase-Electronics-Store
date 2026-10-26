import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Price from '../components/common/Price';
import Rating from '../components/common/Rating';
import useWishlist from '../hooks/useWishlist';
import useCart from '../hooks/useCart';
import { errorMessage } from '../utils/format';

export default function Wishlist() {
  const wishlist = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.isLoading) return <Loader full />;
  if (!wishlist.items.length) {
    return (
      <div className="container-x py-10">
        <Seo title="Wishlist" noIndex />
        <EmptyState icon={FiHeart} title="Your wishlist is empty" message="Save products you love and buy them later." actionLabel="Explore products" />
      </div>
    );
  }

  const moveToCart = async (p) => {
    const variant = p.variants?.find((v) => v.stock > 0);
    if (await addToCart(p, variant, 1, { silent: true })) {
      try {
        await wishlist.remove(p._id);
        toast.success('Moved to cart');
      } catch (err) {
        toast.error(errorMessage(err));
      }
    }
  };

  return (
    <div className="container-x py-6">
      <Seo title="Wishlist" noIndex />
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">My wishlist ({wishlist.items.length})</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlist.items.map((p) => (
          <div key={p._id} className="card flex gap-3 p-3">
            <Link to={`/product/${p.slug}`} className="shrink-0">
              <img src={p.images?.[0]?.url} alt={p.title} className="h-24 w-24 rounded-lg bg-white object-contain p-1" loading="lazy" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link to={`/product/${p.slug}`} className="line-clamp-2 text-sm font-medium hover:text-brand-600">{p.title}</Link>
              <Rating value={p.ratingAverage} count={p.ratingCount} />
              <Price price={p.price} mrp={p.mrp} size="sm" />
              {p.stock <= 0 && <p className="text-xs font-semibold text-red-600">Out of stock</p>}
              <div className="mt-auto flex gap-2 pt-2">
                <button type="button" className="btn-primary btn-sm flex-1" disabled={p.stock <= 0} onClick={() => moveToCart(p)}>
                  <FiShoppingCart /> Move to cart
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={() => wishlist.toggle(p._id)} aria-label="Remove from wishlist">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
