import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';
import { useGetAllOrdersQuery } from '../../services/adminApi';
import { formatPrice, formatDate, statusLabel } from '../../utils/format';
import { STATUS_STYLES } from '../../utils/constants';

const STATUSES = ['', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

export default function AdminOrders() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('');
  const [returns, setReturns] = useState(params.get('returns') === 'true');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(q, 350);
  const { data, isLoading, isFetching } = useGetAllOrdersQuery({ status, q: search, page, returns: returns ? 'true' : '' });

  return (
    <div>
      <Seo title="Orders" noIndex />
      <h1 className="mb-4 text-2xl font-bold">Orders {data && <span className="text-base font-normal text-gray-500">({data.total})</span>}</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Invoice, customer name or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search orders" />
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? statusLabel(s) : 'All statuses'}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded text-brand-600" checked={returns} onChange={(e) => { setReturns(e.target.checked); setPage(1); }} /> Pending returns
        </label>
      </div>

      {isLoading ? <Loader /> : (
        <div className={`card overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
          <table className="table-base">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td><Link to={`/admin/orders/${o._id}`} className="font-medium text-brand-600 hover:underline">{o.invoiceNumber}</Link></td>
                  <td>
                    <p className="font-medium">{o.user?.name || o.shippingAddress?.fullName}</p>
                    <p className="text-xs text-gray-500">{o.shippingAddress?.city}</p>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(o.createdAt)}</td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="whitespace-nowrap font-semibold">{formatPrice(o.totalPrice)}</td>
                  <td className="whitespace-nowrap text-xs">
                    {o.paymentMethod.toUpperCase()} · {o.isPaid ? <span className="text-green-600">Paid</span> : <span className="text-amber-600">Pending</span>}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_STYLES[o.status]}`}>{statusLabel(o.status)}</span>
                    {o.returnRequest?.status === 'requested' && <span className="badge ml-1 bg-amber-100 text-amber-700">Return req.</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.orders.length && <p className="p-6 text-center text-sm text-gray-500">No orders found.</p>}
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </div>
  );
}
