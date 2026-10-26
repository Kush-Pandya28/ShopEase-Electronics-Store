import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiMenu,
  FiX,
  FiMoon,
  FiSun,
  FiPackage,
  FiLogOut,
  FiGrid,
  FiColumns,
} from 'react-icons/fi';
import SearchBar from './SearchBar';
import useCart from '../../hooks/useCart';
import useLogout from '../../hooks/useLogout';
import { toggleTheme } from '../../features/ui/uiSlice';
import { useGetCategoriesQuery } from '../../services/productApi';

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Navbar() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.ui.theme);
  const compareCount = useSelector((s) => s.compare.items.length);
  const { count } = useCart();
  const doLogout = useLogout();
  const { data: catData } = useGetCategoriesQuery();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const close = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const iconBtn = 'relative rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="container-x flex h-16 items-center gap-3">
        <button type="button" className={`${iconBtn} lg:hidden`} onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <FiMenu size={22} />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold text-brand-600">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">S</span>
          <span className="hidden xs:inline">ShopEase</span>
        </Link>

        <SearchBar className="mx-2 hidden flex-1 md:block lg:mx-6" />

        <nav className="ml-auto flex items-center gap-1" aria-label="User">
          <button
            type="button"
            className={iconBtn}
            onClick={() => dispatch(toggleTheme())}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <Link to="/compare" className={`${iconBtn} hidden sm:block`} aria-label="Compare products">
            <FiColumns size={20} />
            <Badge count={compareCount} />
          </Link>
          <Link to="/wishlist" className={`${iconBtn} hidden sm:block`} aria-label="Wishlist">
            <FiHeart size={20} />
          </Link>
          <Link to="/cart" className={iconBtn} aria-label={`Cart with ${count} items`}>
            <FiShoppingCart size={20} />
            <Badge count={count} />
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  {user.name?.[0]?.toUpperCase()}
                </span>
                <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:block">{user.name.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div role="menu" className="card absolute right-0 mt-2 w-52 py-1 text-sm">
                  {user.role === 'admin' && (
                    <Link role="menuitem" to="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <FiGrid /> Admin dashboard
                    </Link>
                  )}
                  <Link role="menuitem" to="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <FiUser /> My profile
                  </Link>
                  <Link role="menuitem" to="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <FiPackage /> My orders
                  </Link>
                  <Link role="menuitem" to="/wishlist" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <FiHeart /> Wishlist
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={doLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" state={{ from: location }} className="btn-primary btn-sm ml-1">
              Login
            </Link>
          )}
        </nav>
      </div>

      <div className="container-x pb-3 md:hidden">
        <SearchBar />
      </div>

      {/* Category strip */}
      <div className="hidden border-t border-gray-100 dark:border-gray-900 lg:block">
        <div className="container-x no-scrollbar flex gap-5 overflow-x-auto py-2 text-sm">
          <NavLink to="/products" className="shrink-0 font-medium hover:text-brand-600">
            All Products
          </NavLink>
          {catData?.items?.map((c) => (
            <NavLink
              key={c._id}
              to={`/category/${c.slug}`}
              className={({ isActive }) => `shrink-0 hover:text-brand-600 ${isActive ? 'font-semibold text-brand-600' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {c.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)}>
            <motion.aside
              className="h-full w-72 overflow-y-auto bg-white p-4 dark:bg-gray-900"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-extrabold text-brand-600">ShopEase</span>
                <button type="button" className={iconBtn} onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <FiX size={22} />
                </button>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Shop by category</p>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/products" className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                    All Products
                  </Link>
                </li>
                {catData?.items?.map((c) => (
                  <li key={c._id}>
                    <Link to={`/category/${c.slug}`} className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <hr className="my-4 border-gray-200 dark:border-gray-800" />
              <ul className="space-y-1 text-sm">
                <li><Link to="/compare" className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Compare ({compareCount})</Link></li>
                <li><Link to="/wishlist" className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Wishlist</Link></li>
                <li><Link to="/orders" className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">My orders</Link></li>
              </ul>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
