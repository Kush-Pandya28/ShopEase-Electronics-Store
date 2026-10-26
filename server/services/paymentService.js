import crypto from 'crypto';

/** Razorpay works in paise: Rs. 999.50 -> 99950 */
export const toPaise = (rupees) => Math.round(rupees * 100);

/** Constant-time string compare so signatures can't be guessed byte by byte. */
export const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export const isValidPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature || !process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
};

/** Webhook signature: HMAC_SHA256(raw request body, webhook_secret) */
export const isValidWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
};
