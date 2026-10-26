import fs from 'fs';
import { connect, clear, disconnect, api, createUserAndLogin, createProduct } from './helpers.js';

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

// 1x1 transparent PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

describe('image upload without Cloudinary (local storage)', () => {
  test('admin uploads a product image and it is served back', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await api().post('/api/upload?folder=products').set('Authorization', `Bearer ${token}`).attach('images', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    const { url, publicId } = res.body.images[0];
    expect(publicId).toMatch(/^local:products\//);
    const path = new URL(url).pathname;
    const served = await api().get(path);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');
    fs.rmSync(new URL(`../uploads/${publicId.slice(6)}`, import.meta.url), { force: true });
  });

  test('a fake image (HTML renamed .png) is rejected', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await api()
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  test('customers can upload review photos but not product images', async () => {
    const { token } = await createUserAndLogin();
    const auth = { Authorization: `Bearer ${token}` };
    const review = await api().post('/api/upload/review').set(auth).attach('images', PNG, { filename: 'r.png', contentType: 'image/png' });
    expect(review.status).toBe(201);
    fs.rmSync(new URL(`../uploads/${review.body.images[0].publicId.slice(6)}`, import.meta.url), { force: true });
    const product = await api().post('/api/upload').set(auth).attach('images', PNG, { filename: 'p.png', contentType: 'image/png' });
    expect(product.status).toBe(403);
  });

  test('search matches category names', async () => {
    const p = await createProduct({ title: 'Zeta Model 9' });
    const cat = await (await import('../models/Category.js')).default.findById(p.category);
    const res = await api().get(`/api/products?q=${encodeURIComponent(cat.name.split(' ')[0])}`);
    expect(res.body.products.map((x) => x.title)).toContain('Zeta Model 9');
  });
});
