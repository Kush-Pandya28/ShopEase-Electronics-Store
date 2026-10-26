import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { API_URL } from '../services/api';
import { setCredentials, setAuthChecked } from '../features/auth/authSlice';
import { clearGuestCart } from '../features/cart/cartSlice';
import { useMergeCartMutation } from '../services/cartApi';

/**
 * 1. Restores the session on page load using the httpOnly refresh cookie.
 * 2. Merges the guest cart into the server cart whenever a user logs in.
 */
export default function useAuthBootstrap() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const guestItems = useSelector((s) => s.cart.items);
  const [mergeCart] = useMergeCartMutation();
  const started = useRef(false);
  const merging = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, { method: 'POST', credentials: 'include' });
        if (res.ok) dispatch(setCredentials(await res.json()));
      } catch {
        // offline or API down - continue as guest
      } finally {
        dispatch(setAuthChecked());
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!user || !guestItems.length || merging.current) return;
    merging.current = true;
    mergeCart(guestItems.map(({ productId, variantSku, quantity }) => ({ productId, variantSku, quantity })))
      .unwrap()
      .then(() => dispatch(clearGuestCart()))
      .catch(() => {})
      .finally(() => {
        merging.current = false;
      });
  }, [user, guestItems, mergeCart, dispatch]);
}
