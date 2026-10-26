import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { useGetMyOrdersQuery } from '../services/orderApi';
import { formatPrice, formatDate, statusLabel } from '../utils/format';
import { STATUS_STYLES } from '../utils/constants';

const FILTERS = ['', 'placed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function Orders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading, isFetching } = useGetMyOrdersQuery({ page, status });

  return (
    <div className="container-x max-w-4xl py-6">
      <Seo title="My orders" noIndex />
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">My orders</h1>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f || 'all'}
            type="button"
            onClick={() => { setStatus(f); setPage(1); }}
            className={`btn-sm btn shrink-0 ${status === f ? 'bg-brand-600 text-white' : 'btn-outline'}`}
          >
            {f ? statusLabel(f) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : !data?.orders?.length ? (
        <EmptyState icon={FiPackage} title="No orders found" message="When you place an order it will show up here." actionLabel="Start shopping" />
      ) : (
        <div className={`space-y-4 ${isFetching ? 'opacity-60' : ''}`}>
          {data.orders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`} className="card block p-4 transition hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold">Order #{o._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">Placed on {formatDate(o.createdAt)}</p>
                </div>
                <span className={`badge ${STATUS_STYLES[o.status]}`}>{statusLabel(o.status)}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i) => (
                    <img key={i._id} src={i.image} alt="" className="h-14 w-14 rounded-lg border-2 border-white bg-white object-contain dark:border-gray-900" loading="lazy" />
                  ))}
                </div>
                <p className="line-clamp-2 flex-1 text-sm">
                  {o.items[0]?.title}
                  {o.items.length > 1 && <span className="text-gray-500"> + {o.items.length - 1} more</span>}
                </p>
                <p className="font-bold">{formatPrice(o.totalPrice)}</p>
              </div>
            </Link>
          ))}
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
