import { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * Input with a leading icon for the login / register / password pages.
 * Works with react-hook-form's register() (ref is forwarded). type="password" gets a show / hide button.
 */
const AuthField = forwardRef(function AuthField({ id, label, icon: Icon, error, hint, labelAside, type = 'text', ...props }, ref) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-500' : 'text-gray-400'}`}
            size={17}
          />
        )}
        <input
          id={id}
          ref={ref}
          type={isPassword && show ? 'text' : type}
          className={`auth-input ${isPassword ? 'pr-11' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <FiEyeOff size={17} /> : <FiEye size={17} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error mt-1.5">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export default AuthField;

const RULES = [
  { test: (p) => p.length >= 8, label: '8+ characters' },
  { test: (p) => /[A-Za-z]/.test(p), label: 'a letter' },
  { test: (p) => /\d/.test(p), label: 'a number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p) || p.length >= 12, label: 'a symbol (stronger)' },
];
const LEVELS = [
  { text: 'Too weak', bar: 'bg-red-500', color: 'text-red-600' },
  { text: 'Weak', bar: 'bg-orange-500', color: 'text-orange-600' },
  { text: 'Good', bar: 'bg-amber-500', color: 'text-amber-600' },
  { text: 'Strong', bar: 'bg-emerald-500', color: 'text-emerald-600' },
];

/** 4-step strength meter + checklist shown while choosing a password. */
export function PasswordStrength({ value = '' }) {
  if (!value) return null;
  const passed = RULES.map((r) => r.test(value));
  const score = passed.filter(Boolean).length; // 0..4
  const level = LEVELS[Math.max(0, score - 1)];
  return (
    <div className="-mt-1" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition ${i < score ? level.bar : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        <span className={`font-semibold ${level.color}`}>{level.text}</span>
        {RULES.map((r, i) => (
          <span key={r.label} className={passed[i] ? 'text-emerald-600 dark:text-emerald-400' : ''}>
            {passed[i] ? '✓' : '○'} {r.label}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Spinner for buttons. */
export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />;
}
