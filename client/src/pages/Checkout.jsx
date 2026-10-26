import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FiCheck, FiMapPin, FiPlus, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import AddressForm from '../components/common/AddressForm';
import CartItem from '../components/cart/CartItem';
import PriceSummary from '../components/cart/PriceSummary';
import useCart from '../hooks/useCart';
import { useGetMeQuery, useAddAddressMutation } from '../services/userApi';
import {
  useCreateOrderMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentConfigQuery,
} from '../services/orderApi';
import { setCouponCode } from '../features/cart/cartSlice';
import { loadRazorpay, openRazorpay } from '../utils/razorpay';
import { errorMessage } from '../utils/format';

const STEPS = ['Address', 'Summary', 'Payment'];

function Stepper({ step }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? 'bg-green-600 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'
            }`}
          >
            {i < step ? <FiCheck /> : i + 1}
          </span>
          <span className={`hidden font-medium sm:inline ${i === step ? '' : 'text-gray-500'}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />}
        </li>
      ))}
    </ol>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useCart();
  const { data: meData, isLoading: meLoading } = useGetMeQuery();
  const [addAddress, { isLoading: savingAddress }] = useAddAddressMutation();
  const [createOrder] = useCreateOrderMutation();
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  // Online payment needs Razorpay keys on the server; without them only Cash on Delivery is offered
  const { data: payConfig } = useGetPaymentConfigQuery();
  const onlineAvailable = payConfig ? payConfig.online : true;
  useEffect(() => {
    if (payConfig && !payConfig.online) setMethod('cod');
  }, [payConfig]);

  const addresses = useMemo(() => meData?.user?.addresses || [], [meData]);

  useEffect(() => {
    if (!addressId && addresses.length) setAddressId((addresses.find((a) => a.isDefault) || addresses[0])._id);
    if (!meLoading && !addresses.length) setShowForm(true);
  }, [addresses, addressId, meLoading]);

  if (cart.isLoading || meLoading) return <Loader full />;
  if (!cart.items.length && !placing) return <Navigate to="/cart" replace />;

  const selected = addresses.find((a) => a._id === addressId);
  const blocked = cart.items.some((i) => i.stock === 0 || i.quantity > i.stock);

  const saveAddress = async (values) => {
    try {
      const res = await addAddress(values).unwrap();
      setAddressId(res.address._id);
      setShowForm(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const finish = (order) => {
    dispatch(setCouponCode(''));
    navigate(`/order-success/${order._id}`, { replace: true });
  };

  const placeOrder = async () => {
    const couponCode = cart.coupon?.code || '';
    setPlacing(true);
    try {
      if (method === 'cod') {
        const res = await createOrder({ addressId, paymentMethod: 'cod', couponCode }).unwrap();
        finish(res.order);
        return;
      }

      const payment = await createPaymentOrder({ addressId, couponCode }).unwrap();
      if (payment.mock) {
        // Development mode without Razorpay keys (PAYMENT_MOCK=true on the server)
        toast('Test mode: simulating a successful payment', { icon: '🧪' });
        const res = await verifyPayment({ razorpay_order_id: payment.razorpayOrderId, mock: true, addressId, couponCode }).unwrap();
        finish(res.order);
        return;
      }

      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your internet connection.');
      const response = await openRazorpay(payment);
      const res = await verifyPayment({ ...response, addressId, couponCode }).unwrap();
      finish(res.order);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not place order'));
      setPlacing(false);
    }
  };

  return (
    <div className="container-x py-6">
      <Seo title="Checkout" noIndex />
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">Checkout</h1>
      <Stepper step={step} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Step 1: Address */}
          <section className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><FiMapPin /> Delivery address</h2>
              {step > 0 && <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setStep(0)}>Change</button>}
            </div>

            {step > 0 && selected && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <b className="text-gray-900 dark:text-gray-100">{selected.fullName}</b>, {selected.street}, {selected.city}, {selected.state} - {selected.pincode}. Ph: {selected.phone}
              </p>
            )}

            {step === 0 && (
              <div className="mt-4 space-y-3">
                {addresses.map((a) => (
                  <label key={a._id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${addressId === a._id ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-800'}`}>
                    <input type="radio" name="address" className="mt-1 text-brand-600" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
                    <span>
                      <b>{a.fullName}</b> {a.isDefault && <span className="badge ml-1 bg-gray-100 text-gray-600 dark:bg-gray-800">Default</span>}
                      <span className="block text-gray-600 dark:text-gray-400">
                        {a.street}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} - {a.pincode}
                      </span>
                      <span className="block text-gray-600 dark:text-gray-400">Phone: {a.phone}</span>
                    </span>
                  </label>
                ))}
                {showForm ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
                    <AddressForm onSubmit={saveAddress} onCancel={addresses.length ? () => setShowForm(false) : undefined} submitting={savingAddress} defaultValues={{ fullName: meData?.user?.name, phone: meData?.user?.phone || '' }} />
                  </div>
                ) : (
                  <button type="button" className="btn-outline btn-sm" onClick={() => setShowForm(true)}><FiPlus /> Add new address</button>
                )}
                <button type="button" className="btn-primary w-full sm:w-auto" disabled={!selected} onClick={() => setStep(1)}>
                  Deliver here
                </button>
              </div>
            )}
          </section>

          {/* Step 2: Summary */}
          <section className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Order summary ({cart.count} items)</h2>
              {step > 1 && <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setStep(1)}>Change</button>}
            </div>
            {step === 1 && (
              <>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cart.items.map((item) => (
                    <CartItem key={item.id} item={item} onQuantity={cart.updateQuantity} onRemove={cart.remove} />
                  ))}
                </div>
                {blocked && <p className="field-error">Some items are out of stock. Update your cart to continue.</p>}
                <button type="button" className="btn-primary mt-3" disabled={blocked} onClick={() => setStep(2)}>
                  Continue to payment
                </button>
              </>
            )}
          </section>

          {/* Step 3: Payment */}
          <section className="card p-4 sm:p-5">
            <h2 className="font-semibold">Payment method</h2>
            {step === 2 && (
              <div className="mt-4 space-y-3">
                <label className={`flex items-start gap-3 rounded-lg border p-3 ${!onlineAvailable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${method === 'razorpay' ? 'border-brand-500' : 'border-gray-200 dark:border-gray-800'}`}>
                  <input type="radio" name="method" className="mt-1 text-brand-600" checked={method === 'razorpay'} disabled={!onlineAvailable} onChange={() => setMethod('razorpay')} />
                  <span className="text-sm">
                    <b className="flex items-center gap-2"><FiCreditCard /> Pay online (Razorpay)</b>
                    <span className="text-gray-500">
                      {onlineAvailable ? 'UPI, cards, net banking, wallets and no-cost EMI' : 'Coming soon - please use Cash on Delivery for now'}
                    </span>
                  </span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${method === 'cod' ? 'border-brand-500' : 'border-gray-200 dark:border-gray-800'}`}>
                  <input type="radio" name="method" className="mt-1 text-brand-600" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                  <span className="text-sm">
                    <b className="flex items-center gap-2"><FiDollarSign /> Cash on Delivery</b>
                    <span className="text-gray-500">Pay when your order arrives</span>
                  </span>
                </label>
                <button type="button" className="btn-primary w-full py-3" disabled={placing || blocked} onClick={placeOrder}>
                  {placing ? 'Placing order...' : method === 'cod' ? 'Place order' : 'Pay now'}
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <PriceSummary pricing={cart.pricing} count={cart.count} coupon={cart.coupon} />
          <p className="mt-3 text-center text-xs text-gray-500">Safe and secure payments. 100% authentic products.</p>
        </div>
      </div>
    </div>
  );
}
