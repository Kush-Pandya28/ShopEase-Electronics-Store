import { connect, clear, disconnect, api, createUserAndLogin, createProduct } from './helpers.js';
import { stripHtml } from '../middleware/xss.js';
import Coupon from '../models/Coupon.js';

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const loginCookie = async (email) => {
  const res = await api().post('/api/auth/login').send({ email, password: 'Password1' });
  return res.headers['set-cookie'];
};

describe('regressions', () => {
  test('text sanitizer removes HTML but keeps < > & in normal text', () => {
    expect(stripHtml('Battery > 1 day & <3')).toBe('Battery > 1 day & <3');
    expect(stripHtml('ok<script>alert(1)</script>!')).toBe('ok!');
    expect(stripHtml('<img src=x onerror=alert(1)>hi')).toBe('hi');
    expect(stripHtml('<b>bold</b> text')).toBe('bold text');
  });

  test('logging in on a second device keeps the first device logged in', async () => {
    const { user } = await createUserAndLogin();
    const deviceA = await loginCookie(user.email);
    await loginCookie(user.email);
    const res = await api().post('/api/auth/refresh-token').set('Cookie', deviceA);
    expect(res.status).toBe(200);
  });

  test('two tabs refreshing with the same cookie at once both stay logged in', async () => {
    const { user } = await createUserAndLogin();
    const cookie = await loginCookie(user.email);
    const [a, b] = await Promise.all([
      api().post('/api/auth/refresh-token').set('Cookie', cookie),
      api().post('/api/auth/refresh-token').set('Cookie', cookie),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  test('logout ends only that device session', async () => {
    const { user } = await createUserAndLogin();
    const deviceA = await loginCookie(user.email);
    const deviceB = await loginCookie(user.email);
    await api().post('/api/auth/logout').set('Cookie', deviceA);
    expect((await api().post('/api/auth/refresh-token').set('Cookie', deviceA)).status).toBe(401);
    expect((await api().post('/api/auth/refresh-token').set('Cookie', deviceB)).status).toBe(200);
  });

  test('cancelling an order gives the coupon use back', async () => {
    const { user, token } = await createUserAndLogin();
    const product = await createProduct();
    const auth = { Authorization: `Bearer ${token}` };
    await Coupon.create({ code: 'ONCE', type: 'flat', value: 100, usageLimit: 1, expiresAt: new Date(Date.now() + 86400000) });

    await api().post('/api/cart/items').set(auth).send({ productId: product._id, variantSku: product.variants[0].sku, quantity: 1 });
    const order = await api().post('/api/orders').set(auth).send({ addressId: user.addresses[0]._id, couponCode: 'ONCE' });
    expect(order.status).toBe(201);
    expect((await Coupon.findOne({ code: 'ONCE' })).usedCount).toBe(1);

    await api().put(`/api/orders/${order.body.order._id}/cancel`).set(auth).send({});
    expect((await Coupon.findOne({ code: 'ONCE' })).usedCount).toBe(0);
  });

  test('reviews keep special characters', async () => {
    const { token } = await createUserAndLogin();
    const res = await api()
      .put('/api/users/me')
      .set({ Authorization: `Bearer ${token}` })
      .send({ name: 'Tom & Jerry <3' });
    expect(res.body.user.name).toBe('Tom & Jerry <3');
  });
});
