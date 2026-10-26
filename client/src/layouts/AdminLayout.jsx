import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiGrid,
  FiBox,
  FiShoppingBag,
  FiUsers,
  FiTag,
  FiStar,
  FiLayers,
  FiMenu,
  FiX,
  FiHome,
  FiMoon,
  FiSun,
  FiLogOut,
  FiMail,
} from 'react-icons/fi';
import { toggleTheme } from '../features/ui/uiSlice';
import useLogout from '../hooks/useLogout';

const links = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/catalog', label: 'Categories & Brands', icon: FiLayers },
  { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
  { to: '/admin/emails', label: 'Emails', icon: FiMail },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const user = useSelector((s) => s.auth.user);
  const doLogout = useLogout();

  const nav = (
    <nav className="space-y-1" aria-label="Admin">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`
          }
        >
          <Icon /> {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:block">
        <Link to="/admin" className="mb-6 block text-xl font-extrabold text-brand-600">
          ShopEase <span className="text-xs font-semibold text-gray-400">Admin</span>
        </Link>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-64 bg-white p-4 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xl font-extrabold text-brand-600">ShopEase Admin</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <FiX size={22} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <FiMenu size={22} />
          </button>
          <p className="text-sm text-gray-500">
            Welcome, <b className="text-gray-800 dark:text-gray-100">{user?.name}</b>
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/" className="btn-ghost btn-sm" title="View store">
              <FiHome /> <span className="hidden sm:inline">Store</span>
            </Link>
            <button type="button" className="btn-ghost btn-sm" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <button type="button" className="btn-ghost btn-sm text-red-600" onClick={doLogout}>
              <FiLogOut /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
