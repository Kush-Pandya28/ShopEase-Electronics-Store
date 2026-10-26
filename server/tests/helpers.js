import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

let mongo;

export const connect = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
};

export const clear = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
};

export const disconnect = async () => {
  await mongoose.disconnect();
  await mongo?.stop();
};

export const api = () => request(app);

export const createUserAndLogin = async ({ role = 'customer', email = `u${Date.now()}${Math.random()}@test.com` } = {}) => {
  const user = await User.create({
    name: 'Test User',
    email,
    password: 'Password1',
    role,
    addresses: [
      { fullName: 'Test User', phone: '9876543210', street: '1 MG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', isDefault: true },
    ],
  });
  const res = await api().post('/api/auth/login').send({ email, password: 'Password1' });
  return { user, token: res.body.accessToken, cookie: res.headers['set-cookie'] };
};

export const createProduct = async (overrides = {}) => {
  const category = await Category.create({ name: `Mobiles ${Math.random()}`, slug: `mobiles-${Date.now()}${Math.random()}`.replace('.', '') });
  const brand = await Brand.create({ name: `Brand ${Math.random()}`, slug: `brand-${Date.now()}${Math.random()}`.replace('.', '') });
  return Product.create({
    title: 'Test Phone',
    slug: `test-phone-${Date.now()}${Math.random()}`.replace('.', ''),
    brand: brand._id,
    brandName: brand.name,
    category: category._id,
    images: [{ url: 'https://example.com/a.png' }],
    variants: [{ sku: `SKU-${Date.now()}${Math.random()}`, color: 'Black', storage: '128 GB', ram: '8 GB', price: 10000, mrp: 12000, stock: 5 }],
    ...overrides,
  });
};
