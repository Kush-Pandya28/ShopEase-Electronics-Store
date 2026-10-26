import { connect, clear, disconnect, api } from './helpers.js';

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const user = { name: 'Aarav Shah', email: 'aarav@test.com', phone: '9876543210', password: 'Secret123' };

describe('auth flow', () => {
  test('register returns access token and sets httpOnly refresh cookie', async () => {
    const res = await api().post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=.*HttpOnly/);
  });

  test('duplicate email is rejected', async () => {
    await api().post('/api/auth/register').send(user);
    const res = await api().post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  test('the same email in another case / with spaces is still a duplicate', async () => {
    await api().post('/api/auth/register').send(user);
    const res = await api()
      .post('/api/auth/register')
      .send({ ...user, email: '  AARAV@Test.com ', phone: '9000000001' });
    expect(res.status).toBe(409);
    expect(res.body.errors[0].field).toBe('email');
    expect(res.body.message).toMatch(/already registered/);
  });

  test('a mobile number can belong to only one account, in any format', async () => {
    await api().post('/api/auth/register').send(user);
    for (const phone of ['9876543210', '+91 98765 43210', '098765-43210']) {
       
      const res = await api().post('/api/auth/register').send({ ...user, email: `other${phone.length}@test.com`, phone });
      expect(res.status).toBe(409);
      expect(res.body.errors[0].field).toBe('phone');
    }
  });

  test('mobile number is required and stored in one format', async () => {
    const missing = await api().post('/api/auth/register').send({ ...user, phone: '' });
    expect(missing.status).toBe(400);
    const res = await api().post('/api/auth/register').send({ ...user, phone: '+91 98765 43210' });
    expect(res.status).toBe(201);
    expect(res.body.user.phone).toBe('9876543210');
  });

  test("profile cannot take another account's mobile number", async () => {
    await api().post('/api/auth/register').send(user);
    const other = await api()
      .post('/api/auth/register')
      .send({ ...user, email: 'riya@test.com', phone: '9123456780' });
    const res = await api()
      .put('/api/users/me')
      .set('Authorization', `Bearer ${other.body.accessToken}`)
      .send({ phone: '98765 43210' });
    expect(res.status).toBe(409);
    // keeping your own number is fine
    const own = await api()
      .put('/api/users/me')
      .set('Authorization', `Bearer ${other.body.accessToken}`)
      .send({ phone: '9123456780', name: 'Riya P' });
    expect(own.status).toBe(200);
  });

  test('a registered account can always log in again (email in any case)', async () => {
    await api().post('/api/auth/register').send(user);
    const res = await api().post('/api/auth/login').send({ email: ' Aarav@TEST.com ', password: user.password });
    expect(res.status).toBe(200);
  });

  test('login explains what is wrong: unknown email vs wrong password', async () => {
    await api().post('/api/auth/register').send(user);
    const unknown = await api().post('/api/auth/login').send({ email: 'nobody@test.com', password: 'Secret123' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.errors[0].field).toBe('email');
    expect(unknown.body.message).toMatch(/No account found/);
    const wrong = await api().post('/api/auth/login').send({ email: user.email, password: 'Wrong1234' });
    expect(wrong.body.errors[0].field).toBe('password');
  });

  test('weak password fails validation', async () => {
    const res = await api().post('/api/auth/register').send({ ...user, password: 'short' });
    expect(res.status).toBe(400);
  });

  test('login with wrong password fails, correct password works', async () => {
    await api().post('/api/auth/register').send(user);
    const bad = await api().post('/api/auth/login').send({ email: user.email, password: 'Wrong1234' });
    expect(bad.status).toBe(401);
    const ok = await api().post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe(user.email);
  });

  test('protected route needs a token; refresh token issues a new one', async () => {
    const reg = await api().post('/api/auth/register').send(user);
    expect((await api().get('/api/users/me')).status).toBe(401);

    const me = await api().get('/api/users/me').set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(me.status).toBe(200);

    const refreshed = await api().post('/api/auth/refresh-token').set('Cookie', reg.headers['set-cookie']);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeDefined();
  });

  test('customer cannot access admin routes', async () => {
    const reg = await api().post('/api/auth/register').send(user);
    const res = await api().get('/api/admin/stats').set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});
