import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateGuestQty, removeGuestItem, setCouponCode } from '../features/cart/cartSlice';
import {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useApplyCouponMutation,
} from '../services/cartApi';
import { calcPricing } from '../utils/pricing';
import { errorMessage } from '../utils/format';

/**
 * Single cart API for the whole app. Adding items needs a logged-in user (server cart);
 * old guest items saved in localStorage are still shown and merged after login.
 * Items are normalised to { id, productId, slug, title, image, variantSku, variantLabel, price, mrp, stock, quantity }.
 */
export default function useCart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const guest = useSelector((s) => s.cart);
  const couponCode = user ? guest.couponCode : '';

  const { data, isFetching, isLoading } = useGetCartQuery(couponCode, { skip: !user });
  const [addItem, { isLoading: adding }] = useAddCartItemMutation();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [applyCouponMutation, { isLoading: applyingCoupon }] = useApplyCouponMutation();

  const items = useMemo(() => {
    if (user) return (data?.items || []).map((i) => ({ ...i, id: i._id }));
    return guest.items.map((i) => ({ ...i, id: i.key }));
  }, [user, data, guest.items]);

  const pricing = useMemo(() => (user ? data?.pricing : calcPricing(items)) || calcPricing([]), [user, data, items]);

  // Adding to cart requires login: guests are sent to the login page and brought back afterwards
  const addToCart = useCallback(
    async (product, variant, quantity = 1, { silent = false } = {}) => {
      if (!user) {
        toast.error('Please login to add products to your cart');
        navigate('/login', { state: { from: location } });
        return false;
      }
      if (!variant || variant.stock === 0) {
        toast.error('This item is out of stock');
        return false;
      }
      try {
        await addItem({ productId: product._id, variantSku: variant.sku, quantity, coupon: couponCode }).unwrap();
        if (!silent) toast.success('Added to cart');
        return true;
      } catch (err) {
        toast.error(errorMessage(err, 'Could not add to cart'));
        return false;
      }
    },
    [user, addItem, couponCode, navigate, location]
  );

  const updateQuantity = useCallback(
    async (item, quantity) => {
      if (quantity < 1) return;
      if (quantity > item.stock) {
        toast.error(`Only ${item.stock} unit(s) available`);
        return;
      }
      if (!user) {
        dispatch(updateGuestQty({ key: item.id, quantity }));
        return;
      }
      try {
        await updateItem({ itemId: item.id, quantity, coupon: couponCode }).unwrap();
      } catch (err) {
        toast.error(errorMessage(err));
      }
    },
    [user, dispatch, updateItem, couponCode]
  );

  const remove = useCallback(
    async (item) => {
      if (!user) {
        dispatch(removeGuestItem(item.id));
        return;
      }
      try {
        await removeItem({ itemId: item.id, coupon: couponCode }).unwrap();
      } catch (err) {
        toast.error(errorMessage(err));
      }
    },
    [user, dispatch, removeItem, couponCode]
  );

  const applyCoupon = useCallback(
    async (code) => {
      if (!user) {
        toast.error('Please login to apply a coupon');
        return false;
      }
      try {
        const res = await applyCouponMutation(code).unwrap();
        dispatch(setCouponCode(res.coupon.code));
        toast.success(res.message);
        return true;
      } catch (err) {
        toast.error(errorMessage(err, 'Invalid coupon'));
        return false;
      }
    },
    [user, applyCouponMutation, dispatch]
  );

  const removeCoupon = useCallback(() => dispatch(setCouponCode('')), [dispatch]);

  return {
    items,
    pricing,
    count: items.reduce((s, i) => s + i.quantity, 0),
    coupon: user ? data?.coupon : null,
    couponCode,
    couponError: user ? data?.couponError : null,
    isLoading: user ? isLoading : false,
    isFetching,
    adding,
    applyingCoupon,
    addToCart,
    updateQuantity,
    remove,
    applyCoupon,
    removeCoupon,
  };
}
