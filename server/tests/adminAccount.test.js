import { connect, clear, disconnect, api } from './helpers.js';
import User from '../models/User.js';
import { ensureAdminAccount } from '../services/adminAccount.js';

beforeAll(connect);
afterEach(async () => {
  delete process.env.ADMIN_LOGIN_EMAIL;
  delete process.env.ADMIN_LOGIN_PASSWORD;
  await clear();
});
afterAll(disconnect);

describe('admin account from .env', () => {
  test('creates the configured admin who can log in, and removes the demo admin', async () => {
    await User.create({ name: 'Demo', email: 'admin@shopease.com', password: 'Admin@123', role: 'admin' });
    process.env.ADMIN_LOGIN_EMAIL = 'Owner@Example.com';
    process.env.ADMIN_LOGIN_PASSWORD = 'Owner@2004';
    await ensureAdminAccount();

    const res = await api().post('/api/auth/login').send({ email: 'owner@example.com', password: 'Owner@2004' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');

    const demo = await api().post('/api/auth/login').send({ email: 'admin@shopease.com', password: 'Admin@123' });
    expect(demo.status).toBe(401);
  });

  test('promotes an existing customer with that email to admin', async () => {
    await User.create({ name: 'Owner', email: 'owner@example.com', password: 'OldPass123' });
    process.env.ADMIN_LOGIN_EMAIL = 'owner@example.com';
    process.env.ADMIN_LOGIN_PASSWORD = 'Owner@2004';
    await ensureAdminAccount();
    const res = await api().post('/api/auth/login').send({ email: 'owner@example.com', password: 'Owner@2004' });
    expect(res.body.user.role).toBe('admin');
  });

  test('keeps a password the admin changed later (runs safely on every start)', async () => {
    process.env.ADMIN_LOGIN_EMAIL = 'owner@example.com';
    process.env.ADMIN_LOGIN_PASSWORD = 'Owner@2004';
    await ensureAdminAccount();
    const admin = await User.findOne({ email: 'owner@example.com' });
    admin.password = 'Changed123';
    await admin.save();
    await ensureAdminAccount();
    const res = await api().post('/api/auth/login').send({ email: 'owner@example.com', password: 'Changed123' });
    expect(res.status).toBe(200);
  });
});
