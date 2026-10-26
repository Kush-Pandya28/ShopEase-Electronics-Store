import express from 'express';
import request from 'supertest';
import { authLimiter } from '../middleware/rateLimit.js';

describe('login rate limit', () => {
  const prevEnv = process.env.NODE_ENV;
  // The limiter is skipped when NODE_ENV=test, so switch it off for this test only
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });
  afterAll(() => {
    process.env.NODE_ENV = prevEnv;
  });

  test('successful logins never get blocked, failed ones do', async () => {
    const app = express();
    app.use(express.json());
    app.post('/login', authLimiter, (req, res) => res.status(req.body.ok ? 200 : 401).json({}));

    for (let i = 0; i < 30; i++) {
       
      expect((await request(app).post('/login').send({ ok: true })).status).toBe(200);
    }
    let last;
    for (let i = 0; i < 21; i++) {
       
      last = await request(app).post('/login').send({ ok: false });
    }
    expect(last.status).toBe(429);
  });
});
