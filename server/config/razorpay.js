import Razorpay from 'razorpay';

let instance = null;

export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const isPaymentMock = () =>
  process.env.PAYMENT_MOCK === 'true' && process.env.NODE_ENV !== 'production';

export const getRazorpay = () => {
  if (!isRazorpayConfigured()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};
