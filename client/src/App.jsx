import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import GuestRoute from './routes/GuestRoute';
import Loader from './components/common/Loader';
import useAuthBootstrap from './hooks/useAuthBootstrap';
import Home from './pages/Home';

const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Compare = lazy(() => import('./pages/Compare'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    // Links like /product/x#reviews: the section appears after data loads, so wait for it
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el || ++tries > 40) {
        clearInterval(timer);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  useAuthBootstrap();
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader full />}>
        <Routes>
          {/* Auth pages: the only pages a logged-out visitor can open */}
          <Route element={<AuthLayout />}>
            <Route element={<GuestRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="verify-email/:token" element={<VerifyEmail />} />
          </Route>

          {/* The whole store needs login: opening the site logged out lands on /login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="category/:slug" element={<Products />} />
              <Route path="product/:slug" element={<ProductDetail />} />
              <Route path="compare" element={<Compare />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order-success/:id" element={<OrderSuccess />} />
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="catalog" element={<AdminCatalog />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="emails" element={<AdminEmails />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
