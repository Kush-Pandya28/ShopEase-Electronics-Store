import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMail, FiSend } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import AuthCard from '../components/common/AuthCard';
import AuthField, { Spinner } from '../components/common/AuthField';
import { useForgotPasswordMutation } from '../services/authApi';
import { errorMessage } from '../utils/format';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [forgot, { isLoading }] = useForgotPasswordMutation();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await forgot({ email }).unwrap();
      setSent(true);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <AuthCard
      icon={FiMail}
      title="Forgot password?"
      subtitle="No worries - we will email you a link to reset it"
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600">
          <FiArrowLeft /> Back to login
        </Link>
      }
    >
      <Seo title="Forgot password" />
      {sent ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
          If <b>{email}</b> is registered, a reset link has been sent. The link is valid for 15 minutes.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <AuthField id="email" label="Email" type="email" icon={FiMail} placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn-auth animate-gradient-x" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner /> Sending...
              </>
            ) : (
              <>
                <FiSend /> Send reset link
              </>
            )}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
