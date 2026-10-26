import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../components/common/Loader';

export default function ProtectedRoute() {
  const { user, authChecked, manualLogout } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!authChecked) return <Loader full />;
  // After pressing Logout don't remember the page: the next login (maybe another person) starts fresh
  if (!user) return <Navigate to="/login" replace state={manualLogout ? null : { from: location }} />;
  return <Outlet />;
}
