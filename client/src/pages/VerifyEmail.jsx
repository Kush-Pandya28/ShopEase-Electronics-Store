import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import AuthCard from '../components/common/AuthCard';
import { useVerifyEmailQuery } from '../services/authApi';
import { errorMessage } from '../utils/format';

export default function VerifyEmail() {
  const { token } = useParams();
  const { data, error, isLoading } = useVerifyEmailQuery(token);
  if (isLoading) return <Loader full label="Verifying your email..." />;
  return (
    <AuthCard title="Email verification">
      <Seo title="Verify email" noIndex />
      <div className="text-center">
        <span
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            data ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-500 dark:bg-red-900/30'
          }`}
        >
          {data ? <FiCheckCircle size={40} /> : <FiXCircle size={40} />}
        </span>
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{data?.message || errorMessage(error)}</p>
        <Link to="/" className="btn-auth animate-gradient-x mt-6">
          Go to home
        </Link>
      </div>
    </AuthCard>
  );
}
