/* eslint-disable no-console */
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { resolveMongoUri } from '../config/db.js';
import { adminCredentials } from '../services/adminAccount.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';
import { toSlug, generateInvoiceNumber } from '../utils/helpers.js';
import { calcPricing, variantLabel } from '../utils/pricing.js';
import { categories, brands, products, img, productImage, SEED_VERSION } from './data.js';

export const destroy = async () => {
  await Promise.all(
    [User, Category, Brand, Product, Cart, Order, Review, Coupon, Banner].map((M) => M.deleteMany({}))
  );
};

/** Turns a sample product from data.js into a Product document. */
const productDoc = (p, brandBy, catBy) => {
  const rest = { ...p };
  delete rest.bg; // only used to draw the fallback image
  return {
    ...rest,
    slug: toSlug(p.title),
    brand: brandBy[p.brand]._id,
    brandName: p.brand,
    category: catBy[p.category]._id,
    images: sampleImages(p),
    variants: p.variants.map((v) => ({ ...v, images: [] })),
  };
};

// Real product photos (Wikimedia Commons, see public/products/CREDITS.md) named <slug>-1.jpg, <slug>-2.jpg ...
const PHOTO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'products');
const photoFiles = fs.existsSync(PHOTO_DIR) ? fs.readdirSync(PHOTO_DIR) : [];

const sampleImages = (p) => {
  const slug = toSlug(p.title);
  const photos = photoFiles
    .filter((f) => new RegExp(`^${slug}-\\d+\\.jpg$`).test(f))
    .sort((a, b) => parseInt(a.slice(slug.length + 1), 10) - parseInt(b.slice(slug.length + 1), 10));
  if (photos.length) return photos.map((f) => ({ url: `/api/media/products/${f}` }));
  return [0, 1, 2].map((view) => ({ url: productImage({ title: p.title, brand: p.brand, bg: p.bg, category: p.category, view }) }));
};

// Generated SVG placeholder (any older version) - safe to replace; real uploads are never touched
const isPlaceholder = (url = '') => url.startsWith('data:image/svg+xml');
// Bundled sample photo (public/products) - refreshed when the photo set changes
const isBundledPhoto = (url = '') => url.startsWith('/api/media/products/');
const isSampleImage = (url) => isPlaceholder(url) || isBundledPhoto(url);

const photoOf = (title) => sampleImages({ title }).find((i) => !isPlaceholder(i.url))?.url;

// Cover photo for each category tile
const CATEGORY_COVER = {
  Mobiles: 'Apple iPhone 16 Pro (256 GB)',
  Laptops: 'Apple MacBook Air M3 13-inch',
  Tablets: 'Apple iPad (10th Generation) Wi-Fi',
  'Headphones & Earbuds': 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
  Smartwatches: 'Garmin Forerunner 265 GPS Running Watch',
  Cameras: 'Nikon Z50 Mirrorless Camera with 16-50mm Lens',
  TVs: 'Sony Bravia 7 65" 4K Mini LED Google TV',
  Speakers: 'JBL Charge 5 Portable Waterproof Speaker',
  Gaming: 'Nintendo Switch OLED Model',
  'Computer Accessories': 'Logitech MX Master 3S Wireless Mouse',
  'Chargers & Power Banks': 'Anker 737 Power Bank 24000mAh 140W',
  'Smart Home': 'Amazon Echo Dot (5th Gen) Smart Speaker with Alexa',
};
const CATEGORY_COLORS = ['4f46e5', '0ea5e9', '16a34a', 'db2777', 'ea580c', '7c3aed'];
const categoryImage = (c, i) => photoOf(CATEGORY_COVER[c.name] || '') || img(c.name, CATEGORY_COLORS[i % 6]);

const BANNERS = [
  { title: 'iPhone 15 is here', subtitle: 'Dynamic Island. 48MP camera. USB-C. From Rs. 69,900', cover: 'Apple iPhone 15 (128 GB)', bg: '111827', link: '/product/apple-iphone-15-128-gb', buttonText: 'Buy now', position: 1 },
  { title: 'Mega Laptop Sale', subtitle: 'Up to 35% off on HP, Dell, Lenovo and ASUS', cover: 'Apple MacBook Pro 14" (M3 Pro)', bg: '1d4ed8', link: '/category/laptops', buttonText: 'Explore laptops', position: 2 },
  { title: 'Sound that moves you', subtitle: 'Earbuds and headphones starting Rs. 1,099', cover: 'Apple AirPods Pro (2nd Gen) with MagSafe USB-C', bg: 'dc2626', link: '/category/headphones-and-earbuds', buttonText: 'Shop audio', position: 3 },
];
const bannerDocs = () =>
  BANNERS.map(({ cover, bg, ...b }) => ({ ...b, image: photoOf(cover) || img(b.title, bg) }));

/** Swaps generated placeholder images of categories and banners for real photos. */
const upgradeCategoryAndBannerImages = async () => {
  for (const [i, c] of categories.entries()) {
     
    const doc = await Category.findOne({ name: c.name }).select('image');
     
    if (doc && isPlaceholder(doc.image)) await Category.updateOne({ _id: doc._id }, { $set: { image: categoryImage(c, i) } });
  }
  for (const b of bannerDocs()) {
     
    await Banner.updateMany({ title: b.title, image: /^data:image\/svg/ }, { $set: { image: b.image } });
  }
};

const metaCollection = () => mongoose.connection.db.collection('seed_meta');
const saveSeedVersion = () =>
  metaCollection().updateOne({ _id: 'seed' }, { $set: { version: SEED_VERSION, at: new Date() } }, { upsert: true });

/**
 * Adds sample products (and their brands / categories) that are new in data.js to an existing
 * database, without touching orders, users or edited products. Runs once per SEED_VERSION.
 * @returns {Promise<number>} number of products added
 */
export const syncSeedProducts = async () => {
  const meta = await metaCollection().findOne({ _id: 'seed' });
  if ((meta?.version || 0) >= SEED_VERSION) return 0;

  const catBy = {};
  for (const [i, c] of categories.entries()) {
     
    catBy[c.name] =
      (await Category.findOne({ name: c.name })) ||
       
      (await Category.create({ ...c, slug: toSlug(c.name), image: categoryImage(c, i) }));
  }
  const brandBy = {};
  for (const name of brands) {
     
    brandBy[name] = (await Brand.findOne({ name })) || (await Brand.create({ name, slug: toSlug(name), logo: img(name, '111827') }));
  }

  let added = 0;
  for (const p of products) {
    const skus = p.variants.map((v) => v.sku);
     
    const existing = await Product.findOne({ $or: [{ slug: toSlug(p.title) }, { 'variants.sku': { $in: skus } }] }).select('images');
    if (existing) {
      // Refresh sample images (placeholders or an older bundled photo set); admin uploads are kept
      const fresh = sampleImages(p);
      const current = existing.images.map((i) => i.url);
      if (
        current.length &&
        current.every(isSampleImage) &&
        current.join('|') !== fresh.map((i) => i.url).join('|')
      ) {
         
        await Product.updateOne({ _id: existing._id }, { $set: { images: fresh } });
      }
      continue;
    }
     
    await Product.create(productDoc(p, brandBy, catBy));
    added += 1;
  }
  await upgradeCategoryAndBannerImages();
  await saveSeedVersion();
  return added;
};

export const seed = async () => {
  await destroy();
  const adminLogin = adminCredentials();

  const [adminUser, customer] = await User.create([
    { name: adminLogin.name, email: adminLogin.email, phone: '9876543210', password: adminLogin.password, role: 'admin', isVerified: true },
    {
      name: 'Riya Patel',
      email: 'customer@shopease.com',
      phone: '9123456780',
      password: 'Customer@123',
      isVerified: true,
      addresses: [
        { fullName: 'Riya Patel', phone: '9123456780', street: '12, Shanti Nagar, CG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', isDefault: true },
        { fullName: 'Riya Patel', phone: '9123456780', street: 'B-204, Lotus Park, Adajan', city: 'Surat', state: 'Gujarat', pincode: '395009' },
      ],
    },
  ]);

  const catDocs = await Category.insertMany(
    categories.map((c, i) => ({ ...c, slug: toSlug(c.name), image: categoryImage(c, i) }))
  );
  const brandDocs = await Brand.insertMany(brands.map((name) => ({ name, slug: toSlug(name), logo: img(name, '111827') })));
  const catBy = Object.fromEntries(catDocs.map((c) => [c.name, c]));
  const brandBy = Object.fromEntries(brandDocs.map((b) => [b.name, b]));

  const productDocs = [];
  for (const [i, p] of products.entries()) {
     
    const doc = await Product.create(productDoc(p, brandBy, catBy));
    // stagger createdAt so "new arrivals" has a meaningful order (raw driver call skips timestamps)
     
    await Product.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: new Date(Date.now() - (products.length - i) * 86400000) } }
    );
    productDocs.push(doc);
  }

  // A delivered order for the demo customer so reviews can be tested right away
  const reviewCategoryIds = [catBy.Mobiles._id, catBy['Headphones & Earbuds']._id].map(String);
  const reviewTargets = productDocs.filter((p) => reviewCategoryIds.includes(String(p.category))).slice(0, 3);
  const items = reviewTargets.map((p) => ({
    product: p._id,
    title: p.title,
    slug: p.slug,
    brandName: p.brandName,
    image: p.images[0].url,
    variantSku: p.variants[0].sku,
    variantLabel: variantLabel(p.variants[0]),
    quantity: 1,
    price: p.variants[0].price,
    mrp: p.variants[0].mrp,
    serialNumber: `SN${Math.floor(Math.random() * 1e10)}`,
  }));
  const pricing = calcPricing(items);
  const placedAt = new Date(Date.now() - 3 * 86400000);
  const addr = customer.addresses[0];
  const demoOrder = await Order.create({
    user: customer._id,
    items,
    shippingAddress: { fullName: addr.fullName, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode },
    paymentMethod: 'cod',
    itemsPrice: pricing.itemsPrice,
    discount: 0,
    taxPrice: pricing.taxPrice,
    shippingPrice: pricing.shippingPrice,
    totalPrice: pricing.totalPrice,
    isPaid: true,
    paidAt: new Date(),
    status: 'delivered',
    statusHistory: ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].map((status, idx) => ({
      status,
      date: new Date(placedAt.getTime() + idx * 10 * 3600000),
      note: `Order ${status.replace(/_/g, ' ')}`,
    })),
    trackingId: 'DLV123456789IN',
    courier: 'Delhivery',
    deliveredAt: new Date(Date.now() - 86400000),
    invoiceNumber: generateInvoiceNumber(),
  });
  await Order.collection.updateOne({ _id: demoOrder._id }, { $set: { createdAt: placedAt } });

  // One sample review
  await Review.create({
    user: customer._id,
    product: reviewTargets[0]._id,
    rating: 5,
    title: 'Excellent phone!',
    comment: 'Camera quality is superb and the battery easily lasts a full day. Delivery was quick too.',
    isVerifiedPurchase: true,
  });
  await Review.calcAverageRatings(reviewTargets[0]._id);

  const inMonths = (m) => new Date(Date.now() + m * 30 * 86400000);
  await Coupon.insertMany([
    { code: 'WELCOME10', description: '10% off up to Rs. 2,000 on orders above Rs. 999', type: 'percent', value: 10, maxDiscount: 2000, minOrderValue: 999, expiresAt: inMonths(6), usageLimit: 1000 },
    { code: 'FLAT500', description: 'Flat Rs. 500 off on orders above Rs. 5,000', type: 'flat', value: 500, minOrderValue: 5000, expiresAt: inMonths(3), usageLimit: 500 },
    { code: 'MEGA15', description: '15% off up to Rs. 7,500 on orders above Rs. 40,000', type: 'percent', value: 15, maxDiscount: 7500, minOrderValue: 40000, expiresAt: inMonths(2) },
  ]);

  await Banner.insertMany(bannerDocs());

  await saveSeedVersion();
  console.log(`Seeded: ${catDocs.length} categories, ${brandDocs.length} brands, ${productDocs.length} products`);
  console.log(`Admin    -> ${adminLogin.email}${adminLogin.custom ? ' (password from server/.env)' : ' / Admin@123'}`);
  console.log('Customer -> customer@shopease.com / Customer@123');
  return adminUser;
};

const run = async () => {
  try {
    await mongoose.connect(await resolveMongoUri());
    if (process.argv.includes('--destroy')) {
      await destroy();
      console.log('All data destroyed');
    } else {
      await seed();
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    // The local dev database (MONGO_URI=memory) would otherwise keep the process alive
    process.exit();
  }
};

// Run only when executed directly (`npm run seed`), not when imported by server.js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
