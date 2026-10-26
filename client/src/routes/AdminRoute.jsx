import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../components/common/Loader';

export default function AdminRoute() {
  const { user, authChecked, manualLogout } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!authChecked) return <Loader full />;
  if (!user) return <Navigate to="/login" replace state={manualLogout ? null : { from: location }} />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
