import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/** Login / register pages: bounce already logged-in users back where they came from. */
export default function GuestRoute() {
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();
  if (user) {
    const prev = location.state?.from;
    const home = user.role === 'admin' ? '/admin' : '/';
    // Return to the page the user actually wanted (keeping ?filters and #hash).
    // Just opening the site ("/") is not a destination: admins go to the dashboard, customers to home.
    const wanted = prev?.pathname && prev.pathname !== '/';
    const to = wanted ? `${prev.pathname}${prev.search || ''}${prev.hash || ''}` : home;
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}
