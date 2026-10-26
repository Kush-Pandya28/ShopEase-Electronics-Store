import crypto from 'crypto';
import { isValidPaymentSignature, isValidWebhookSignature, toPaise } from '../services/paymentService.js';

describe('Razorpay signature checks', () => {
  beforeAll(() => {
    process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  });
  afterAll(() => {
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  test('accepts a correct checkout signature and rejects a forged one', () => {
    const signature = crypto.createHmac('sha256', 'test_key_secret').update('order_1|pay_1').digest('hex');
    expect(isValidPaymentSignature({ orderId: 'order_1', paymentId: 'pay_1', signature })).toBe(true);
    expect(isValidPaymentSignature({ orderId: 'order_1', paymentId: 'pay_2', signature })).toBe(false);
    expect(isValidPaymentSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'abc' })).toBe(false);
  });

  test('webhook signature uses the raw body', () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(body).digest('hex');
    expect(isValidWebhookSignature(body, sig)).toBe(true);
    expect(isValidWebhookSignature(Buffer.from('{"event":"x"}'), sig)).toBe(false);
  });

  test('amount is converted to paise without float errors', () => {
    expect(toPaise(1234.56)).toBe(123456);
    expect(toPaise(0.1 + 0.2)).toBe(30);
  });
});

describe('payment config for checkout', () => {
  test('online payment is offered only when it can work', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../app.js');
    const dev = await request(app).get('/api/payments/config');
    expect(dev.body).toMatchObject({ online: true, testMode: true }); // PAYMENT_MOCK in development

    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production'; // mock payments are never allowed online
    const prod = await request(app).get('/api/payments/config');
    process.env.NODE_ENV = prev;
    expect(prod.body.online).toBe(false);
  });
});
