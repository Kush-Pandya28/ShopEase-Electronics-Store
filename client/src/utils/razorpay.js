let loader;

/** Loads the Razorpay checkout script once. */
export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (!loader) {
    loader = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        loader = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return loader;
};

/**
 * Opens Razorpay checkout and resolves with the payment response, or rejects if closed / failed.
 */
export const openRazorpay = ({ keyId, amount, currency, razorpayOrderId, user }) =>
  new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: 'ShopEase',
      description: 'Electronics order',
      prefill: { name: user?.name, email: user?.email, contact: user?.contact || user?.phone },
      theme: { color: '#4f46e5' },
      handler: resolve,
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.on('payment.failed', (res) => reject(new Error(res.error?.description || 'Payment failed')));
    rzp.open();
  });
