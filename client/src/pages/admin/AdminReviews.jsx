import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { Stars } from '../../components/common/Rating';
import { useGetAllReviewsQuery, useAdminDeleteReviewMutation } from '../../services/adminApi';
import { formatDate, errorMessage } from '../../utils/format';

export default function AdminReviews() {
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAllReviewsQuery({ rating, page });
  const [remove] = useAdminDeleteReviewMutation();

  const onDelete = async (r) => {
    if (!window.confirm('Delete this review? The product rating will be recalculated.')) return;
    try {
      await remove(r._id).unwrap();
      toast.success('Review removed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <Seo title="Reviews" noIndex />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Review moderation</h1>
        <select className="input w-auto" value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} aria-label="Filter by rating">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star</option>)}
        </select>
      </div>
      {isLoading ? <Loader /> : (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r._id} className="card flex gap-4 p-4 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  {r.title && <b>{r.title}</b>}
                </div>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{r.comment}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {r.user?.name} ({r.user?.email}) on{' '}
                  <Link to={`/product/${r.product?.slug}`} className="text-brand-600">{r.product?.title}</Link> · {formatDate(r.createdAt)}
                </p>
              </div>
              <button type="button" className="btn-ghost h-fit p-2 text-red-600" onClick={() => onDelete(r)} aria-label="Delete review"><FiTrash2 /></button>
            </div>
          ))}
          {!data.reviews.length && <p className="card p-6 text-center text-gray-500">No reviews found.</p>}
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </div>
  );
}
