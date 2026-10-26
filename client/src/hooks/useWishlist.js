import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from '../services/userApi';
import { errorMessage } from '../utils/format';

export default function useWishlist() {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading } = useGetWishlistQuery(undefined, { skip: !user });
  const [add] = useAddToWishlistMutation();
  const [remove] = useRemoveFromWishlistMutation();

  const ids = useMemo(() => new Set((data?.ids || []).map(String)), [data]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) {
        toast('Login to save items to your wishlist', { icon: '💙' });
        navigate('/login', { state: { from: location } });
        return;
      }
      try {
        if (ids.has(String(productId))) {
          await remove(productId).unwrap();
          toast.success('Removed from wishlist');
        } else {
          await add(productId).unwrap();
          toast.success('Saved to wishlist');
        }
      } catch (err) {
        toast.error(errorMessage(err));
      }
    },
    [user, ids, add, remove, navigate, location]
  );

  return {
    items: data?.wishlist || [],
    isLoading,
    has: (id) => ids.has(String(id)),
    toggle,
    remove: (id) => remove(id).unwrap(),
  };
}
