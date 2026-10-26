import mongoose from 'mongoose';
import { connect, disconnect } from './helpers.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { seed, syncSeedProducts } from '../seeds/seed.js';
import { products } from '../seeds/data.js';

beforeAll(connect);
afterAll(disconnect);

describe('sample catalogue', () => {
  test('fresh seed loads every sample product', async () => {
    await seed();
    expect(await Product.countDocuments()).toBe(products.length);
    expect(products.length).toBeGreaterThanOrEqual(100);
  });

  test('an older database receives only the new products, keeping existing data', async () => {
    const orders = await Order.countDocuments();
    // Simulate a database created before the latest products were added
    const removed = await Product.find().sort({ _id: -1 }).limit(3);
    await Product.deleteMany({ _id: { $in: removed.map((p) => p._id) } });
    await mongoose.connection.db.collection('seed_meta').updateOne({ _id: 'seed' }, { $set: { version: 1 } });

    expect(await syncSeedProducts()).toBe(3);
    expect(await Product.countDocuments()).toBe(products.length);
    expect(await Order.countDocuments()).toBe(orders);

    // Runs once per version: a second start adds nothing
    expect(await syncSeedProducts()).toBe(0);
  });

  test('generated placeholders are upgraded to product photos but uploaded photos are kept', async () => {
    const [oldOne, uploaded] = await Product.find().limit(2);
    const oldUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg><text>old</text></svg>')}`;
    await Product.updateOne({ _id: oldOne._id }, { images: [{ url: oldUrl }] });
    await Product.updateOne({ _id: uploaded._id }, { images: [{ url: 'https://res.cloudinary.com/demo/real.jpg', publicId: 'x' }] });
    await mongoose.connection.db.collection('seed_meta').updateOne({ _id: 'seed' }, { $set: { version: 1 } });

    await syncSeedProducts();
    const [a, b] = await Promise.all([Product.findById(oldOne._id), Product.findById(uploaded._id)]);
    expect(a.images.length).toBeGreaterThan(0);
    expect(a.images[0].url).toBe(`/api/media/products/${oldOne.slug}-1.jpg`);
    expect(b.images[0].url).toBe('https://res.cloudinary.com/demo/real.jpg');
  });

  test('an older bundled photo set is refreshed to the current one', async () => {
    const [p] = await Product.find().limit(1);
    const expected = p.images.map((i) => i.url);
    await Product.updateOne({ _id: p._id }, { images: [{ url: `/api/media/products/${p.slug}-9.jpg` }] });
    await mongoose.connection.db.collection('seed_meta').updateOne({ _id: 'seed' }, { $set: { version: 1 } });

    await syncSeedProducts();
    expect((await Product.findById(p._id)).images.map((i) => i.url)).toEqual(expected);
  });

  test('every sample product has at least one bundled photo that exists on disk', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.resolve('public', 'products');
    await seed(); // earlier tests replaced some images on purpose
    const all = await Product.find().select('slug images');
    for (const p of all) {
      expect(p.images.length).toBeGreaterThan(0);
      for (const img of p.images) {
        expect(img.url.startsWith('/api/media/products/')).toBe(true);
        expect(fs.existsSync(path.join(dir, img.url.split('/').pop()))).toBe(true);
      }
    }
  });
});
