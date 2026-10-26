import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiKey, FiLock } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import AuthCard from '../components/common/AuthCard';
import AuthField, { PasswordStrength, Spinner } from '../components/common/AuthField';
import { useResetPasswordMutation } from '../services/authApi';
import { passwordRule } from './Register';
import { errorMessage } from '../utils/format';

const schema = z
  .object({ password: passwordRule, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [reset, { isLoading }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    try {
      const res = await reset({ token, password }).unwrap();
      toast.success(res.message);
      navigate('/login');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <AuthCard icon={FiKey} title="Set a new password" subtitle="Choose a strong password you have not used before">
      <Seo title="Reset password" noIndex />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthField id="password" label="New password" type="password" icon={FiLock} autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <PasswordStrength value={watch('password')} />
        <AuthField id="confirmPassword" label="Confirm password" type="password" icon={FiLock} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <button type="submit" className="btn-auth animate-gradient-x !mt-6" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner /> Updating...
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </AuthCard>
  );
}
