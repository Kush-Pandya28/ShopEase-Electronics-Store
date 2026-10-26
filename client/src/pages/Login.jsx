import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiArrowRight, FiLock, FiMail, FiUser } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import AuthCard from '../components/common/AuthCard';
import AuthField, { Spinner } from '../components/common/AuthField';
import { useLoginMutation } from '../services/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { errorMessage } from '../utils/format';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  // Browsers do not autofill read-only fields, so a saved login is not filled in when the page
  // opens. The fields become editable on the first click / tap / focus, and the browser then
  // offers the saved login as a suggestion.
  const [editable, setEditable] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const unlock = () => setEditable(true);
  const unlockProps = { readOnly: !editable, onMouseDown: unlock, onTouchStart: unlock, onFocus: unlock };
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // GuestRoute redirects to the previous page as soon as the user is set
  const onSubmit = async (values) => {
    try {
      const data = await login(values).unwrap();
      dispatch(setCredentials(data));
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
    } catch (err) {
      const fieldError = (err?.data?.errors || []).find((e) => e.field === 'email' || e.field === 'password');
      if (fieldError) setError(fieldError.field, { message: fieldError.message });
      setNoAccount(fieldError?.field === 'email' && err?.status === 401);
      toast.error(errorMessage(err, 'Login failed'));
    }
  };

  // Only the demo customer is offered here - admin credentials are never shown in the UI
  const fillDemo = () => {
    unlock();
    setValue('email', 'customer@shopease.com', { shouldValidate: true });
    setValue('password', 'Customer@123', { shouldValidate: true });
  };

  return (
    <AuthCard tabs title="Welcome back 👋" subtitle="Login to shop mobiles, laptops, audio and more">
      <Seo title="Login" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <AuthField
            id="email"
            label="Email"
            type="email"
            icon={FiMail}
            placeholder="you@example.com"
            autoComplete="username"
            error={errors.email?.message}
            {...unlockProps}
            {...register('email')}
          />
          {noAccount && (
            <Link to="/register" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Create an account with this email <FiArrowRight />
            </Link>
          )}
        </div>
        <AuthField
          id="password"
          label="Password"
          type="password"
          icon={FiLock}
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...unlockProps}
          {...register('password')}
        />
        {/* After the password field so Tab goes email -> password -> link */}
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn-auth animate-gradient-x" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner /> Logging in...
            </>
          ) : (
            <>
              Login <FiArrowRight />
            </>
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" /> New to ShopEase?
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      </div>
      {/* No "from" state: a newly registered customer always starts on the home page */}
      <Link
        to="/register"
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition hover:border-brand-400 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-brand-500"
      >
        Create a new account
      </Link>
      <button
        type="button"
        onClick={fillDemo}
        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/70 p-3 text-left text-xs text-gray-600 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20 dark:text-gray-300 dark:hover:bg-brand-900/30"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <FiUser size={15} />
        </span>
        <span>
          Just looking? Try the store with the <b className="text-brand-700 dark:text-brand-300">demo customer account</b>
        </span>
      </button>
    </AuthCard>
  );
}
