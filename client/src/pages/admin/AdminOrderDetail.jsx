import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from 'react-redux';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import OrderTimeline from '../../components/common/OrderTimeline';
import { useGetOrderQuery } from '../../services/orderApi';
import { useUpdateOrderStatusMutation, useResolveReturnMutation } from '../../services/adminApi';
import { downloadFile } from '../../utils/download';
import { ORDER_FLOW, STATUS_STYLES } from '../../utils/constants';
import { formatPrice, formatDateTime, statusLabel, errorMessage } from '../../utils/format';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const store = useStore();
  const { data, isLoading } = useGetOrderQuery(id);
  const [updateStatus, { isLoading: saving }] = useUpdateOrderStatusMutation();
  const [resolveReturn, { isLoading: resolving }] = useResolveReturnMutation();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState({ trackingId: '', courier: '' });
  const [serials, setSerials] = useState({});
  const [returnNote, setReturnNote] = useState('');

  const order = data?.order;
  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setTracking({ trackingId: order.trackingId || '', courier: order.courier || '' });
    setSerials(Object.fromEntries(order.items.map((i) => [i._id, i.serialNumber || ''])));
  }, [order]);

  if (isLoading || !order) return <Loader full />;
  const closed = ['cancelled', 'returned'].includes(order.status);
  const currentIdx = ORDER_FLOW.indexOf(order.status);
  const options = closed ? [order.status] : [...ORDER_FLOW.slice(Math.max(currentIdx, 0)), ...(currentIdx < 3 ? ['cancelled'] : [])];
  const a = order.shippingAddress;

  const save = async (e) => {
    e.preventDefault();
    try {
      await updateStatus({
        id,
        ...(status !== order.status ? { status, note } : {}),
        ...tracking,
        serialNumbers: Object.entries(serials).map(([itemId, serialNumber]) => ({ itemId, serialNumber })),
      }).unwrap();
      toast.success('Order updated');
      setNote('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onReturn = async (action) => {
    try {
      await resolveReturn({ id, action, note: returnNote }).unwrap();
      toast.success(`Return ${action === 'approve' ? 'approved' : 'rejected'}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Seo title={`Order ${order.invoiceNumber}`} noIndex />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to="/admin/orders" className="btn-ghost p-2" aria-label="Back"><FiArrowLeft /></Link>
        <div className="mr-auto">
          <h1 className="text-xl font-bold">{order.invoiceNumber}</h1>
          <p className="text-xs text-gray-500">Order {order._id} · {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`badge ${STATUS_STYLES[order.status]}`}>{statusLabel(order.status)}</span>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => downloadFile(store, `/orders/${id}/invoice`, `invoice-${order.invoiceNumber}.pdf`).catch((err) => toast.error(err.message))}
        >
          <FiDownload /> Invoice
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <form onSubmit={save} className="card space-y-4 p-4">
            <h2 className="font-semibold">Items & serial numbers</h2>
            {order.items.map((i) => (
              <div key={i._id} className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3 text-sm last:border-0 dark:border-gray-800">
                <img src={i.image} alt="" className="h-14 w-14 rounded object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.title}</p>
                  <p className="text-xs text-gray-500">{i.variantLabel} · SKU {i.variantSku} · Qty {i.quantity} · {formatPrice(i.price)}</p>
                </div>
                <input
                  className="input w-full px-2 py-1.5 sm:w-52"
                  placeholder="Serial no. / IMEI"
                  value={serials[i._id] || ''}
                  onChange={(e) => setSerials((s) => ({ ...s, [i._id]: e.target.value }))}
                  aria-label={`Serial number for ${i.title}`}
                />
              </div>
            ))}

            <h2 className="pt-2 font-semibold">Fulfilment</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value)} disabled={closed}>
                  {options.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="note">Note (shown in timeline)</label>
                <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="label" htmlFor="courier">Courier</label>
                <input id="courier" className="input" value={tracking.courier} onChange={(e) => setTracking((t) => ({ ...t, courier: e.target.value }))} placeholder="Delhivery, Blue Dart..." />
              </div>
              <div>
                <label className="label" htmlFor="tracking">Tracking ID</label>
                <input id="tracking" className="input" value={tracking.trackingId} onChange={(e) => setTracking((t) => ({ ...t, trackingId: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </form>

          {order.returnRequest?.status && (
            <section className="card space-y-3 p-4 text-sm">
              <h2 className="font-semibold capitalize">{order.returnRequest.type} request · {order.returnRequest.status}</h2>
              <p><span className="text-gray-500">Reason:</span> {order.returnRequest.reason}</p>
              <p className="text-xs text-gray-500">Requested {formatDateTime(order.returnRequest.requestedAt)}</p>
              {order.returnRequest.status === 'requested' && (
                <>
                  <input className="input" placeholder="Note to customer (optional)" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
                  <div className="flex gap-2">
                    <button type="button" className="btn-primary btn-sm" disabled={resolving} onClick={() => onReturn('approve')}>Approve</button>
                    <button type="button" className="btn-danger btn-sm" disabled={resolving} onClick={() => onReturn('reject')}>Reject</button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Customer</h2>
            <p className="font-medium">{order.user?.name}</p>
            <p className="text-gray-500">{order.user?.email}</p>
            <h3 className="mb-1 mt-3 font-semibold">Ship to</h3>
            <p>{a.fullName} · {a.phone}</p>
            <p className="text-gray-600 dark:text-gray-400">{a.street}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
          </section>
          <section className="card space-y-1.5 p-4 text-sm">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <p className="flex justify-between"><span className="text-gray-500">Items</span>{formatPrice(order.itemsPrice, true)}</p>
            {order.discount > 0 && <p className="flex justify-between"><span className="text-gray-500">Coupon {order.coupon}</span>- {formatPrice(order.discount, true)}</p>}
            <p className="flex justify-between"><span className="text-gray-500">Shipping</span>{formatPrice(order.shippingPrice)}</p>
            <p className="flex justify-between"><span className="text-gray-500">GST incl.</span>{formatPrice(order.taxPrice, true)}</p>
            <p className="flex justify-between border-t border-gray-100 pt-2 font-bold dark:border-gray-800"><span>Total</span>{formatPrice(order.totalPrice, true)}</p>
            <p className="pt-2 text-xs text-gray-500">
              {order.paymentMethod.toUpperCase()} · {order.isPaid ? `Paid ${formatDateTime(order.paidAt)}` : 'Not paid'}
              {order.paymentResult?.id && <span className="block">Payment ID: {order.paymentResult.id}</span>}
              {order.paymentResult?.status === 'refund_initiated' && <span className="block text-blue-600">Refund to be processed</span>}
            </p>
          </section>
          <section className="card p-4">
            <h2 className="mb-4 font-semibold">Timeline</h2>
            <OrderTimeline order={order} />
          </section>
        </div>
      </div>
    </div>
  );
}
