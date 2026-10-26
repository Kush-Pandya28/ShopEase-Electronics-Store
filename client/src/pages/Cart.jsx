import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiShoppingCart, FiLock } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import CartItem from '../components/cart/CartItem';
import PriceSummary from '../components/cart/PriceSummary';
import CouponBox from '../components/cart/CouponBox';
import useCart from '../hooks/useCart';
import useWishlist from '../hooks/useWishlist';

export default function Cart() {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();

  if (cart.isLoading) return <Loader full />;
  if (!cart.items.length) {
    return (
      <div className="container-x py-10">
        <Seo title="Cart" />
        <EmptyState icon={FiShoppingCart} title="Your cart is empty" message="Looks like you have not added anything yet." actionLabel="Start shopping" />
      </div>
    );
  }

  const blocked = cart.items.some((i) => i.stock === 0 || i.quantity > i.stock);

  const moveToWishlist = async (item) => {
    if (!user) {
      wishlist.toggle(item.productId);
      return;
    }
    if (!wishlist.has(item.productId)) await wishlist.toggle(item.productId);
    await cart.remove(item);
  };

  return (
    <div className="container-x py-6">
      <Seo title="Cart" />
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">Shopping cart ({cart.count})</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card divide-y divide-gray-100 px-4 dark:divide-gray-800 lg:col-span-2">
          {cart.items.map((item) => (
            <CartItem key={item.id} item={item} onQuantity={cart.updateQuantity} onRemove={cart.remove} onMoveToWishlist={moveToWishlist} />
          ))}
        </div>
        <div className="space-y-4">
          <CouponBox
            coupon={cart.coupon}
            couponError={cart.couponError}
            onApply={cart.applyCoupon}
            onRemove={cart.removeCoupon}
            applying={cart.applyingCoupon}
          />
          <PriceSummary pricing={cart.pricing} count={cart.count} coupon={cart.coupon}>
            <button
              type="button"
              className="btn-primary w-full py-3"
              disabled={blocked}
              onClick={() => navigate(user ? '/checkout' : '/login', { state: { from: { pathname: '/checkout' } } })}
            >
              <FiLock /> {user ? 'Proceed to checkout' : 'Login to checkout'}
            </button>
            {blocked && <p className="field-error text-center">Fix stock issues in your cart to continue</p>}
          </PriceSummary>
          <Link to="/products" className="block text-center text-sm font-semibold text-brand-600 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
