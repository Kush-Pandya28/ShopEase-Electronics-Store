import { NavLink } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

/** Login / Create account switcher shown on top of both forms */
function AuthTabs() {
  const tab = ({ isActive }) =>
    `flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${
      isActive
        ? 'bg-white text-gray-900 shadow-md dark:bg-gray-800 dark:text-white'
        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
    }`;
  return (
    <nav aria-label="Login or create account" className="mb-7 flex gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800/60">
      <NavLink to="/login" className={tab}>
        Login
      </NavLink>
      <NavLink to="/register" className={tab}>
        Sign up
      </NavLink>
    </nav>
  );
}

export default function AuthCard({ title, subtitle, children, footer, tabs = false, icon: Icon }) {
  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-md animate-fade-up">
        {/* soft glow behind the card */}
        <div className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-brand-500/30 via-fuchsia-500/20 to-sky-500/30 opacity-70 blur-2xl dark:opacity-40" />
        <div className="relative rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-2xl shadow-brand-900/10 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/85 sm:p-8">
          {tabs && <AuthTabs />}
          {Icon && (
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg shadow-brand-600/30">
              <Icon size={22} />
            </span>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-[1.7rem]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <FiLock size={11} /> Your password is encrypted and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}
