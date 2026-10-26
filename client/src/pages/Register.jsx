import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiArrowRight, FiCheckCircle, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import AuthCard from '../components/common/AuthCard';
import AuthField, { PasswordStrength, Spinner } from '../components/common/AuthField';
import { useRegisterMutation } from '../services/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { errorMessage } from '../utils/format';

export const passwordRule = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/\d/, 'Must contain a number');

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(60),
    email: z.string().trim().email('Enter a valid email'),
    // "+91 98765 43210" / "098765-43210" -> "9876543210" (same rule as the server)
    phone: z.preprocess(
      (v) => {
        let d = String(v ?? '').replace(/\D/g, '');
        if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
        if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
        return d;
      },
      z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number')
    ),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const BENEFITS = ['Track every order live', 'Save a wishlist', 'Faster checkout'];

export default function Register() {
  const dispatch = useDispatch();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [emailTaken, setEmailTaken] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
  const password = watch('password');
  const confirm = watch('confirmPassword');

  const onSubmit = async ({ confirmPassword: _confirm, ...values }) => {
    setEmailTaken(false);
    try {
      const data = await registerUser(values).unwrap();
      dispatch(setCredentials(data));
      toast.success('Account created! Check your email to verify it.');
    } catch (err) {
      // Show "email / mobile already registered" under the field it belongs to
      const fieldErrors = (err?.data?.errors || []).filter((e) => ['email', 'phone', 'name', 'password'].includes(e.field));
      fieldErrors.forEach((e) => setError(e.field, { message: e.message }));
      if (err?.status === 409 && fieldErrors.some((e) => e.field === 'email')) setEmailTaken(true);
      toast.error(errorMessage(err, 'Registration failed'));
    }
  };

  return (
    <AuthCard
      tabs
      title="Create account"
      subtitle="Join ShopEase in 30 seconds - it's free"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            Login
          </Link>
        </>
      }
    >
      <Seo title="Register" />
      <ul className="-mt-2 mb-6 flex flex-wrap gap-2">
        {BENEFITS.map((b) => (
          <li key={b} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <FiCheckCircle size={12} /> {b}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthField id="name" label="Full name" icon={FiUser} placeholder="e.g. Riya Patel" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <div>
          <AuthField id="email" label="Email" type="email" icon={FiMail} placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
          {emailTaken && (
            <Link to="/login" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Login with this email instead <FiArrowRight />
            </Link>
          )}
        </div>
        <AuthField
          id="phone"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          icon={FiPhone}
          placeholder="10 digit mobile number"
          autoComplete="tel"
          error={errors.phone?.message}
          hint="One account per mobile number"
          {...register('phone')}
        />
        <AuthField id="password" label="Password" type="password" icon={FiLock} placeholder="Create a password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <PasswordStrength value={password} />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          icon={FiLock}
          placeholder="Type it again"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          hint={confirm && confirm === password ? '✓ Passwords match' : undefined}
          {...register('confirmPassword')}
        />
        <button type="submit" className="btn-auth animate-gradient-x !mt-6" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner /> Creating account...
            </>
          ) : (
            <>
              Create account <FiArrowRight />
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-gray-400">
          By creating an account you agree to ShopEase&apos;s terms of use and privacy policy.
        </p>
      </form>
    </AuthCard>
  );
}
