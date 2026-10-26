import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLogoutMutation } from '../services/authApi';
import { logout } from '../features/auth/authSlice';
import { setCouponCode } from '../features/cart/cartSlice';
import { api } from '../services/api';

export default function useLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutRequest] = useLogoutMutation();

  return useCallback(async () => {
    try {
      await logoutRequest().unwrap();
    } catch {
      // clear local session anyway
    }
    dispatch(logout({ manual: true }));
    dispatch(setCouponCode(''));
    dispatch(api.util.resetApiState());
    toast.success('Logged out');
    // Fresh login page with no "return to" page, so the next person starts on their own home page
    navigate('/login', { replace: true, state: null });
  }, [dispatch, logoutRequest, navigate]);
}
