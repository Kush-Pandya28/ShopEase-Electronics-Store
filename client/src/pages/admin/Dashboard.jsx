import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from 'react-redux';
import toast from 'react-hot-toast';
import { FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiAlertTriangle, FiDownload, FiRotateCcw } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import StatCard from '../../components/admin/StatCard';
import RevenueChart from '../../components/admin/RevenueChart';
import ShareStoreCard from '../../components/admin/ShareStoreCard';
import { useGetStatsQuery } from '../../services/adminApi';
import { downloadFile } from '../../utils/download';
import { formatPrice, formatDate, statusLabel } from '../../utils/format';
import { STATUS_STYLES } from '../../utils/constants';

const PERIODS = [
  { id: 'daily', label: '30 days' },
  { id: 'weekly', label: '12 weeks' },
  { id: 'monthly', label: '12 months' },
];

export default function Dashboard() {
  const store = useStore();
  const [period, setPeriod] = useState('daily');
  const [range, setRange] = useState({ from: '', to: '' });
  const { data, isLoading, isFetching } = useGetStatsQuery(period);

  if (isLoading) return <Loader full />;
  const { totals, revenueChart, statusBreakdown, lowStock, topSelling, recentOrders } = data;

  const exportCsv = async () => {
    const qs = new URLSearchParams(Object.entries(range).filter(([, v]) => v)).toString();
    try {
      await downloadFile(store, `/admin/sales-report${qs ? `?${qs}` : ''}`, `sales-report-${Date.now()}.csv`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Seo title="Admin dashboard" noIndex />
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <ShareStoreCard />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiDollarSign} label="Total revenue" value={formatPrice(totals.revenue)} hint={`Avg order ${formatPrice(totals.averageOrderValue)}`} />
        <StatCard icon={FiShoppingBag} label="Orders" value={totals.orders.toLocaleString('en-IN')} hint={totals.pendingReturns ? `${totals.pendingReturns} return request(s)` : undefined} />
        <StatCard icon={FiUsers} label="Customers" value={totals.users.toLocaleString('en-IN')} />
        <StatCard icon={FiBox} label="Products" value={totals.products} hint={`${lowStock.length} low on stock`} />
      </div>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto font-semibold">Revenue</h2>
          <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700" role="group" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                aria-pressed={period === p.id}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${period === p.id ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className={isFetching ? 'opacity-60' : ''}>
          <RevenueChart data={revenueChart} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-600">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/admin/orders/${o._id}`} className="font-medium text-brand-600">{o.invoiceNumber}</Link></td>
                    <td>{o.user?.name}</td>
                    <td className="whitespace-nowrap">{formatDate(o.createdAt)}</td>
                    <td className="whitespace-nowrap">{formatPrice(o.totalPrice)}</td>
                    <td><span className={`badge ${STATUS_STYLES[o.status]}`}>{statusLabel(o.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Orders by status</h2>
          <ul className="space-y-2 text-sm">
            {statusBreakdown.map((s) => (
              <li key={s.status} className="flex items-center justify-between">
                <span className={`badge ${STATUS_STYLES[s.status]}`}>{statusLabel(s.status)}</span>
                <span className="font-semibold">{s.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
            <h3 className="mb-2 text-sm font-semibold">Sales report (CSV)</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input px-2 py-1.5" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} aria-label="From date" />
              <input type="date" className="input px-2 py-1.5" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} aria-label="To date" />
            </div>
            <button type="button" className="btn-outline btn-sm mt-2 w-full" onClick={exportCsv}><FiDownload /> Export CSV</button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Top selling products</h2>
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {topSelling.map((p, i) => (
              <li key={p._id} className="flex items-center gap-3 py-2">
                <span className="w-5 text-gray-400">{i + 1}</span>
                <img src={p.images?.[0]?.url} alt="" className="h-10 w-10 rounded object-contain" />
                <span className="line-clamp-1 flex-1">{p.title}</span>
                <span className="font-semibold">{p.soldCount} sold</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><FiAlertTriangle className="text-amber-500" /> Low stock alerts</h2>
          {!lowStock.length ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
              {lowStock.map((p) => (
                <li key={p._id} className="flex items-center gap-3 py-2">
                  <img src={p.images?.[0]?.url} alt="" className="h-10 w-10 rounded object-contain" />
                  <span className="line-clamp-1 flex-1">{p.title}</span>
                  <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                  <Link to={`/admin/products/${p._id}/edit`} className="text-xs font-semibold text-brand-600">Restock</Link>
                </li>
              ))}
            </ul>
          )}
          {totals.pendingReturns > 0 && (
            <Link to="/admin/orders?returns=true" className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-600">
              <FiRotateCcw /> {totals.pendingReturns} pending return request(s)
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
