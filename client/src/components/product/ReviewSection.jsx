import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiThumbsUp, FiCheckCircle, FiCamera, FiX } from 'react-icons/fi';
import { Stars, StarInput } from '../common/Rating';
import Pagination from '../common/Pagination';
import {
  useGetProductReviewsQuery,
  useGetReviewEligibilityQuery,
  useCreateReviewMutation,
  useToggleHelpfulMutation,
  useUploadReviewImagesMutation,
} from '../../services/orderApi';
import { errorMessage, formatDate } from '../../utils/format';

function ReviewForm({ productId, onDone }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [uploadPhotos, { isLoading: uploading }] = useUploadReviewImagesMutation();

  const onPhotos = async (e) => {
    const files = [...e.target.files].slice(0, 4 - images.length);
    e.target.value = '';
    if (!files.length) return;
    try {
      const res = await uploadPhotos(files).unwrap();
      setImages((prev) => [...prev, ...res.images.map((i) => i.url)].slice(0, 4));
    } catch (err) {
      toast.error(errorMessage(err, 'Photo upload failed'));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a star rating');
      return;
    }
    try {
      await createReview({ productId, rating, title, comment, images }).unwrap();
      toast.success('Thanks for your review!');
      onDone?.();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <p className="font-semibold">Rate this product</p>
      <StarInput value={rating} onChange={setRating} />
      <input
        className="input"
        placeholder="Review title (e.g. Great battery life)"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Review title"
      />
      <textarea
        className="input min-h-[100px]"
        placeholder="Share your experience..."
        value={comment}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
        aria-label="Review comment"
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {images.map((src) => (
            <div key={src} className="relative">
              <img src={src} alt="Your upload" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((x) => x !== src))}
                className="absolute -right-2 -top-2 rounded-full bg-red-600 p-0.5 text-white"
                aria-label="Remove photo"
              >
                <FiX size={12} />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <label className="btn-outline btn-sm cursor-pointer">
              <FiCamera /> {uploading ? 'Uploading...' : 'Add photos'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={onPhotos}
                disabled={uploading}
                aria-label="Add review photos"
              />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional: up to 4 photos (JPG, PNG or WEBP, max 2 MB each)
        </p>
      </div>
      <button type="submit" className="btn-primary" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}

export default function ReviewSection({ product }) {
  const user = useSelector((s) => s.auth.user);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const { data, isFetching } = useGetProductReviewsQuery({ productId: product._id, page, sort });
  const { data: elig } = useGetReviewEligibilityQuery(product._id, { skip: !user });
  const [toggleHelpful] = useToggleHelpfulMutation();
  const total = data?.total || 0;

  const vote = async (id) => {
    if (!user) {
      toast.error('Login to vote');
      return;
    }
    try {
      await toggleHelpful({ id, productId: product._id }).unwrap();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section id="reviews" className="mt-10 scroll-mt-36">
      <h2 className="section-title mb-4">Ratings & Reviews</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-4xl font-extrabold">{product.ratingAverage?.toFixed(1) || '0.0'}</p>
          <Stars value={product.ratingAverage} size={18} />
          <p className="mt-1 text-sm text-gray-500">{product.ratingCount} ratings</p>
          <div className="mt-4 space-y-1.5">
            {data?.breakdown?.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-xs">
                <span className="w-6">{b.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: total ? `${(b.count / total) * 100}%` : 0 }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">{b.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            {!user && (
              <Link to="/login" className="btn-outline w-full">
                Login to write a review
              </Link>
            )}
            {user && elig?.canReview && !showForm && (
              <button type="button" className="btn-primary w-full" onClick={() => setShowForm(true)}>
                Write a review
              </button>
            )}
            {user && elig && !elig.canReview && (
              <p className="text-xs text-gray-500">
                {elig.review
                  ? 'You have already reviewed this product.'
                  : 'Only verified buyers who received this product can review it.'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          {showForm && <ReviewForm productId={product._id} onDone={() => setShowForm(false)} />}
          {total > 0 && (
            <div className="flex justify-end">
              <select
                className="input w-auto"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                aria-label="Sort reviews"
              >
                <option value="newest">Newest</option>
                <option value="helpful">Most helpful</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
              </select>
            </div>
          )}
          {!isFetching && total === 0 && (
            <p className="card p-6 text-sm text-gray-500">
              No reviews yet. Be the first verified buyer to review!
            </p>
          )}
          {data?.reviews?.map((r) => (
            <article key={r._id} className="card p-4">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                {r.title && <h3 className="font-semibold">{r.title}</h3>}
              </div>
              {r.comment && (
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                  {r.comment}
                </p>
              )}
              {r.images?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {r.images.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt="Customer upload"
                      className="h-16 w-16 rounded object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {r.user?.name || 'Customer'}
                </span>
                {r.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <FiCheckCircle /> Verified purchase
                  </span>
                )}
                <span>{formatDate(r.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => vote(r._id)}
                  className={`ml-auto inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    user && r.helpfulIds?.includes(user._id) ? 'text-brand-600' : ''
                  }`}
                >
                  <FiThumbsUp /> Helpful ({r.helpfulCount || 0})
                </button>
              </div>
            </article>
          ))}
          <Pagination page={page} pages={data?.pages} onChange={setPage} />
        </div>
      </div>
    </section>
  );
}
