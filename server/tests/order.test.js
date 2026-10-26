import { connect, clear, disconnect, api, createUserAndLogin, createProduct } from './helpers.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('cart, coupon and order flow', () => {
  test('cart validates stock and prices come from the server', async () => {
    const { token } = await createUserAndLogin();
    const product = await createProduct();
    const sku = product.variants[0].sku;
    const auth = { Authorization: `Bearer ${token}` };

    const tooMany = await api().post('/api/cart/items').set(auth).send({ productId: product._id, variantSku: sku, quantity: 6 });
    expect(tooMany.status).toBe(400);

    const added = await api().post('/api/cart/items').set(auth).send({ productId: product._id, variantSku: sku, quantity: 2, price: 1 });
    expect(added.status).toBe(201);
    expect(added.body.items[0].price).toBe(10000);
    expect(added.body.pricing.totalPrice).toBe(20000);
  });

  test('COD order reduces stock, applies coupon and cancel restores stock', async () => {
    const { user, token } = await createUserAndLogin();
    const product = await createProduct();
    const sku = product.variants[0].sku;
    const auth = { Authorization: `Bearer ${token}` };
    await Coupon.create({ code: 'SAVE10', type: 'percent', value: 10, maxDiscount: 1500, minOrderValue: 999, expiresAt: new Date(Date.now() + 86400000) });

    await api().post('/api/cart/items').set(auth).send({ productId: product._id, variantSku: sku, quantity: 2 });
    const coupon = await api().post('/api/cart/coupon').set(auth).send({ code: 'save10' });
    expect(coupon.status).toBe(200);
    expect(coupon.body.pricing.discount).toBe(1500);

    const orderRes = await api()
      .post('/api/orders')
      .set(auth)
      .send({ addressId: user.addresses[0]._id, paymentMethod: 'cod', couponCode: 'SAVE10' });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order.totalPrice).toBe(18500);

    let fresh = await Product.findById(product._id);
    expect(fresh.variants[0].stock).toBe(3);
    expect(fresh.stock).toBe(3);

    const cart = await api().get('/api/cart').set(auth);
    expect(cart.body.items).toHaveLength(0);

    const cancel = await api().put(`/api/orders/${orderRes.body.order._id}/cancel`).set(auth).send({});
    expect(cancel.status).toBe(200);
    fresh = await Product.findById(product._id);
    expect(fresh.variants[0].stock).toBe(5);
  });

  test('review is only allowed for delivered orders', async () => {
    const { token } = await createUserAndLogin();
    const product = await createProduct();
    const res = await api()
      .post(`/api/reviews/product/${product._id}`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ rating: 5, comment: 'Great' });
    expect(res.status).toBe(403);
  });
});
