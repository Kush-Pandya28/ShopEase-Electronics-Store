import { connect, disconnect, api, createUserAndLogin } from './helpers.js';

beforeAll(connect);
afterAll(disconnect);

describe('access from other devices', () => {
  test('a request from the same address the site is opened on is allowed (e.g. http://192.168.1.20:5000)', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Host', '192.168.1.20:5000')
      .set('Origin', 'http://192.168.1.20:5000')
      .send({ email: 'nobody@example.com', password: 'Wrong1234' });
    expect(res.status).toBe(401); // reached the login logic, not blocked by CORS
    expect(res.headers['access-control-allow-origin']).toBe('http://192.168.1.20:5000');
  });

  test('devices on the local network are allowed while developing', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://192.168.0.15:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://192.168.0.15:5173');
  });

  test('unknown websites are still blocked', async () => {
    const res = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.status).toBe(403);
  });

  test('the public internet link (tunnel) works: same-origin request is allowed', async () => {
    const host = 'shop-test-link.trycloudflare.com';
    const res = await api()
      .post('/api/auth/login')
      .set('Host', host)
      .set('Origin', `https://${host}`)
      .set('X-Forwarded-Proto', 'https')
      .send({ email: 'nobody@example.com', password: 'Wrong1234' });
    expect(res.status).toBe(401);
    expect(res.headers['access-control-allow-origin']).toBe(`https://${host}`);
  });

  test('over the https link the login cookie is Secure; over plain http it is not', async () => {
    await createUserAndLogin({ email: 'cookie@test.com' });
    const viaLink = await api()
      .post('/api/auth/login')
      .set('X-Forwarded-Proto', 'https') // added by the tunnel running on this PC
      .send({ email: 'cookie@test.com', password: 'Password1' });
    expect(viaLink.headers['set-cookie'][0]).toMatch(/Secure/);
    const plain = await api().post('/api/auth/login').send({ email: 'cookie@test.com', password: 'Password1' });
    expect(plain.headers['set-cookie'][0]).not.toMatch(/Secure/);
  });

  test('only the admin can read the public link', async () => {
    const admin = await createUserAndLogin({ role: 'admin', email: 'boss@test.com' });
    const customer = await createUserAndLogin({ email: 'shopper@test.com' });
    const ok = await api().get('/api/admin/public-link').set('Authorization', `Bearer ${admin.token}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toHaveProperty('url');
    const denied = await api().get('/api/admin/public-link').set('Authorization', `Bearer ${customer.token}`);
    expect(denied.status).toBe(403);
  });

  test('error responses never include stack traces', async () => {
    const res = await api().get('/api/products/not-a-valid-id/related');
    expect(res.body.stack).toBeUndefined();
  });

  test('LAN origins are blocked in production unless listed in CLIENT_URL', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await api().get('/api/health').set('Origin', 'http://192.168.0.15:5173');
    process.env.NODE_ENV = prev;
    expect(res.status).toBe(403);
  });
});
