import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import { useGetOrderQuery } from '../services/orderApi';
import { formatPrice, formatDate } from '../utils/format';

export default function OrderSuccess() {
  const { id } = useParams();
  const { data, isLoading } = useGetOrderQuery(id);
  if (isLoading) return <Loader full />;
  const order = data?.order;

  return (
    <div className="container-x max-w-2xl py-10">
      <Seo title="Order placed" noIndex />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 text-center sm:p-10">
        <FiCheckCircle className="mx-auto text-green-600" size={64} />
        <h1 className="mt-4 text-2xl font-bold">Order placed successfully!</h1>
        <p className="mt-1 text-gray-500">Thank you for shopping with ShopEase. A confirmation email is on its way.</p>
        {order && (
          <div className="mx-auto mt-6 max-w-sm space-y-1 rounded-lg bg-gray-50 p-4 text-left text-sm dark:bg-gray-800/50">
            <p><span className="text-gray-500">Order ID:</span> <b>{order._id}</b></p>
            <p><span className="text-gray-500">Invoice:</span> {order.invoiceNumber}</p>
            <p><span className="text-gray-500">Amount:</span> <b>{formatPrice(order.totalPrice, true)}</b> ({order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'})</p>
            <p><span className="text-gray-500">Expected delivery:</span> {formatDate(new Date(new Date(order.createdAt).getTime() + 4 * 86400000))}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/orders/${id}`} className="btn-primary">Track order</Link>
          <Link to="/products" className="btn-outline">Continue shopping</Link>
        </div>
      </motion.div>
    </div>
  );
}
