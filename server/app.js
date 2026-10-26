import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import logger from './config/logger.js';
import xssSanitize from './middleware/xss.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { UPLOAD_ROOT } from './controllers/uploadController.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Private network addresses (other PCs / phones on the same Wi-Fi), allowed in development
const isPrivateHost = (hostname) =>
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(hostname) ||
  hostname.endsWith('.local');

// Production (Render etc.) sits behind one proxy. Locally only the public-link tunnel, which runs on
// this PC, is trusted - so LAN visitors cannot fake X-Forwarded-For to dodge the rate limits.
app.set('trust proxy', process.env.TRUST_PROXY || (process.env.NODE_ENV === 'production' ? 1 : 'loopback'));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Browsers ignore (and warn about) this header on plain-http LAN addresses, so only send it in production (https)
    crossOriginOpenerPolicy: process.env.NODE_ENV === 'production' ? { policy: 'same-origin-allow-popups' } : false,
    originAgentCluster: process.env.NODE_ENV === 'production',
    // The website is served from this server too, so the policy must allow its fonts, images and Razorpay
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        // Served over plain http on the local network: don't force https
        upgradeInsecureRequests: null,
      },
    },
  })
);
app.use(
  cors((req, callback) => {
    const { origin } = req.headers;
    let allowed = !origin || allowedOrigins.includes(origin); // no Origin = same-origin GET / server-to-server
    if (!allowed) {
      try {
        const url = new URL(origin);
        // Same server (any address it is opened on) is always fine; LAN devices too while developing
        allowed =
          url.host === req.headers.host ||
          (process.env.NODE_ENV !== 'production' && isPrivateHost(url.hostname));
      } catch {
        allowed = false;
      }
    }
    callback(allowed ? null : new Error(`Origin ${origin} not allowed by CORS`), {
      origin: allowed,
      credentials: true,
    });
  })
);

// Razorpay webhook needs the raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssSanitize);
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
// Locally stored images (used when Cloudinary is not configured)
app.use('/api/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d', index: false, dotfiles: 'deny' }));
// Bundled sample product photos and banners
app.use(
  '/api/media',
  express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public'), { maxAge: '30d', index: false, dotfiles: 'deny' })
);

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Serve the built website (client/dist) from this same server, so one URL works for everything:
// http://localhost:5000 on this PC, or http://<this-PC-IP>:5000 from other devices on the network.
const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
if (
  process.env.NODE_ENV !== 'test' &&
  process.env.SERVE_CLIENT !== 'false' &&
  fs.existsSync(path.join(CLIENT_DIST, 'index.html'))
) {
  // Hashed asset files never change, so they can be cached for a long time
  app.use('/assets', express.static(path.join(CLIENT_DIST, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
  // Any non-API URL (/products, /orders/123, ...) is a page of the single-page app
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
