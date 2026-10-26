import { connect, clear, disconnect, api, createUserAndLogin, createProduct } from './helpers.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('products', () => {
  test('public listing supports filters and pagination', async () => {
    await createProduct({ title: 'Alpha Phone' });
    await createProduct({ title: 'Beta Phone', variants: [{ sku: 'B-1', price: 50000, mrp: 60000, stock: 2, ram: '12 GB' }] });

    const all = await api().get('/api/products?limit=1');
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(2);
    expect(all.body.pages).toBe(2);

    const pricey = await api().get('/api/products?minPrice=20000');
    expect(pricey.body.products.map((p) => p.title)).toEqual(['Beta Phone']);

    const byRam = await api().get('/api/products?ram=12%20GB');
    expect(byRam.body.total).toBe(1);

    const search = await api().get('/api/products?q=alpha');
    expect(search.body.products[0].title).toBe('Alpha Phone');
  });

  test('admin can create, update and delete a product; price derives from variants', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const auth = { Authorization: `Bearer ${token}` };
    const category = await Category.create({ name: 'Laptops', slug: 'laptops' });
    const brand = await Brand.create({ name: 'Dell', slug: 'dell' });

    const created = await api()
      .post('/api/products')
      .set(auth)
      .send({
        title: 'Dell XPS 13',
        brand: brand._id,
        category: category._id,
        images: [{ url: 'https://example.com/x.png' }],
        variants: [
          { sku: 'XPS-1', price: 90000, mrp: 100000, stock: 3 },
          { sku: 'XPS-2', price: 80000, mrp: 100000, stock: 4 },
        ],
      });
    expect(created.status).toBe(201);
    expect(created.body.product.slug).toBe('dell-xps-13');
    expect(created.body.product.price).toBe(80000);
    expect(created.body.product.stock).toBe(7);
    expect(created.body.product.discountPercent).toBe(20);

    const id = created.body.product._id;
    const updated = await api().put(`/api/products/${id}`).set(auth).send({ isFeatured: true });
    expect(updated.body.product.isFeatured).toBe(true);

    const bySlug = await api().get('/api/products/dell-xps-13');
    expect(bySlug.body.product.brand.name).toBe('Dell');

    expect((await api().delete(`/api/products/${id}`).set(auth)).status).toBe(200);
  });

  test('compare rejects products from different categories', async () => {
    const a = await createProduct();
    const b = await createProduct();
    const res = await api().post('/api/products/compare').send({ ids: [a._id, b._id] });
    expect(res.status).toBe(400);
  });
});
