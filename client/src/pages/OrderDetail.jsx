import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from 'react-redux';
import toast from 'react-hot-toast';
import { FiDownload, FiRepeat, FiXCircle, FiRotateCcw, FiTruck } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import OrderTimeline from '../components/common/OrderTimeline';
import { useGetOrderQuery, useCancelOrderMutation, useRequestReturnMutation } from '../services/orderApi';
import useCart from '../hooks/useCart';
import { downloadFile } from '../utils/download';
import { formatPrice, formatDate, statusLabel, errorMessage } from '../utils/format';
import { STATUS_STYLES } from '../utils/constants';

export default function OrderDetail() {
  const { id } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetOrderQuery(id);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [requestReturn, { isLoading: returning }] = useRequestReturnMutation();
  const { addToCart } = useCart();
  const [modal, setModal] = useState(null); // 'cancel' | 'return'
  const [reason, setReason] = useState('');
  const [returnType, setReturnType] = useState('replace');

  if (isLoading) return <Loader full />;
  if (error || !data?.order) {
    return <div className="container-x py-10"><EmptyState title="Order not found" message={errorMessage(error)} actionLabel="My orders" actionTo="/orders" /></div>;
  }
  const { order, canCancel, canReturn, returnDeadline } = data;
  const a = order.shippingAddress;

  const onCancel = async () => {
    try {
      await cancelOrder({ id, reason: reason || 'Changed my mind' }).unwrap();
      toast.success('Order cancelled');
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onReturn = async () => {
    try {
      await requestReturn({ id, type: returnType, reason }).unwrap();
      toast.success('Request submitted. We will get back within 24 hours.');
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onInvoice = async () => {
    try {
      await downloadFile(store, `/orders/${id}/invoice`, `invoice-${order.invoiceNumber}.pdf`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onReorder = async () => {
    let added = 0;
    for (const item of order.items) {
      // Reorder uses current price and stock; unavailable items are skipped
       
      const ok = await addToCart(
        { _id: item.product, slug: item.slug, title: item.title, images: [{ url: item.image }], brandName: item.brandName },
        { sku: item.variantSku, price: item.price, mrp: item.mrp, stock: 10, images: [item.image] },
        item.quantity,
        { silent: true }
      );
      if (ok) added += 1;
    }
    if (added) {
      toast.success(`${added} item(s) added to cart`);
      navigate('/cart');
    }
  };

  return (
    <div className="container-x max-w-5xl py-6">
      <Seo title="Order details" noIndex />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-bold">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)} · Invoice {order.invoiceNumber}</p>
        </div>
        <span className={`badge ${STATUS_STYLES[order.status]}`}>{statusLabel(order.status)}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {order.status !== 'cancelled' && <button type="button" className="btn-outline btn-sm" onClick={onInvoice}><FiDownload /> GST invoice</button>}
        <button type="button" className="btn-outline btn-sm" onClick={onReorder}><FiRepeat /> Reorder</button>
        {canCancel && <button type="button" className="btn-outline btn-sm text-red-600" onClick={() => { setReason(''); setModal('cancel'); }}><FiXCircle /> Cancel order</button>}
        {canReturn && <button type="button" className="btn-outline btn-sm" onClick={() => { setReason(''); setModal('return'); }}><FiRotateCcw /> Return / Replace</button>}
      </div>

      {order.returnRequest?.status && (
        <div className="card mb-4 border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
          <b className="capitalize">{order.returnRequest.type} request: {order.returnRequest.status}</b>
          <p className="text-gray-600 dark:text-gray-400">Reason: {order.returnRequest.reason}</p>
          {order.returnRequest.adminNote && <p className="text-gray-600 dark:text-gray-400">Note from ShopEase: {order.returnRequest.adminNote}</p>}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card divide-y divide-gray-100 p-4 dark:divide-gray-800">
            {order.items.map((i) => (
              <div key={i._id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <img src={i.image} alt={i.title} className="h-20 w-20 rounded-lg bg-white object-contain p-1" loading="lazy" />
                <div className="min-w-0 flex-1 text-sm">
                  <Link to={`/product/${i.slug}`} className="line-clamp-2 font-medium hover:text-brand-600">{i.title}</Link>
                  {i.variantLabel && <p className="text-xs text-gray-500">{i.variantLabel}</p>}
                  <p className="text-xs text-gray-500">Qty: {i.quantity}</p>
                  {i.serialNumber && <p className="text-xs text-gray-500">Serial / IMEI: {i.serialNumber}</p>}
                  {order.status === 'delivered' && (
                    <Link to={`/product/${i.slug}#reviews`} className="text-xs font-semibold text-brand-600">Rate & review</Link>
                  )}
                </div>
                <p className="font-semibold">{formatPrice(i.price * i.quantity)}</p>
              </div>
            ))}
          </section>

          <section className="card p-4">
            <h2 className="mb-4 font-semibold">Order status</h2>
            {order.trackingId && (
              <p className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
                <FiTruck /> {order.courier || 'Courier'} · Tracking ID: <b>{order.trackingId}</b>
              </p>
            )}
            <OrderTimeline order={order} />
            {canReturn && returnDeadline && <p className="mt-4 text-xs text-gray-500">Return / replacement window open till {formatDate(returnDeadline)}</p>}
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Delivery address</h2>
            <p className="font-medium">{a.fullName}</p>
            <p className="text-gray-600 dark:text-gray-400">{a.street}{a.landmark ? `, ${a.landmark}` : ''}</p>
            <p className="text-gray-600 dark:text-gray-400">{a.city}, {a.state} - {a.pincode}</p>
            <p className="text-gray-600 dark:text-gray-400">Phone: {a.phone}</p>
          </section>
          <section className="card space-y-2 p-4 text-sm">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <div className="flex justify-between"><span className="text-gray-500">Items</span><span>{formatPrice(order.itemsPrice, true)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Coupon ({order.coupon})</span><span className="text-green-600">- {formatPrice(order.discount, true)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingPrice ? formatPrice(order.shippingPrice) : 'FREE'}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">GST included</span><span>{formatPrice(order.taxPrice, true)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-bold dark:border-gray-800"><span>Total</span><span>{formatPrice(order.totalPrice, true)}</span></div>
            <p className="pt-1 text-xs text-gray-500">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online (Razorpay)'} ·{' '}
              {order.isPaid ? <span className="text-green-600">Paid</span> : <span className="text-amber-600">Payment pending</span>}
              {order.paymentResult?.status === 'refund_initiated' && <span className="block text-blue-600">Refund initiated</span>}
            </p>
          </section>
        </div>
      </div>

      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Cancel order">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Are you sure? {order.isPaid && 'Your refund will be initiated to the original payment method.'}</p>
        <select className="input" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Cancellation reason">
          <option value="">Select a reason</option>
          <option>Ordered by mistake</option>
          <option>Found a better price elsewhere</option>
          <option>Delivery is taking too long</option>
          <option>Changed my mind</option>
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={() => setModal(null)}>Keep order</button>
          <button type="button" className="btn-danger" disabled={cancelling} onClick={onCancel}>{cancelling ? 'Cancelling...' : 'Cancel order'}</button>
        </div>
      </Modal>

      <Modal open={modal === 'return'} onClose={() => setModal(null)} title="Return or replace">
        <div className="mb-3 flex gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" checked={returnType === 'replace'} onChange={() => setReturnType('replace')} /> Replacement</label>
          <label className="flex items-center gap-2"><input type="radio" checked={returnType === 'return'} onChange={() => setReturnType('return')} /> Return & refund</label>
        </div>
        <textarea className="input min-h-[100px]" placeholder="Describe the issue (damaged, defective, wrong item...)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
        <p className="mt-1 text-xs text-gray-500">Minimum 10 characters. Keep the box, accessories and invoice ready for pickup.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={() => setModal(null)}>Close</button>
          <button type="button" className="btn-primary" disabled={returning || reason.trim().length < 10} onClick={onReturn}>Submit request</button>
        </div>
      </Modal>
    </div>
  );
}
