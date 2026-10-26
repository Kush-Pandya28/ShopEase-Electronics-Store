import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { startJobs } from './jobs/index.js';
import { verifyEmailTransport } from './services/emailService.js';
import { ensureAdminAccount } from './services/adminAccount.js';

const PORT = process.env.PORT || 5000;

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  logger.error(`Missing required env variables: ${missing.join(', ')}`);
  process.exit(1);
}
// On the internet the public demo admin (admin@shopease.com / Admin@123) must never exist
if (process.env.NODE_ENV === 'production') {
  const problems = [];
  if (!process.env.ADMIN_LOGIN_EMAIL || !process.env.ADMIN_LOGIN_PASSWORD) problems.push('set ADMIN_LOGIN_EMAIL and ADMIN_LOGIN_PASSWORD');
  else if (process.env.ADMIN_LOGIN_PASSWORD.length < 8) problems.push('ADMIN_LOGIN_PASSWORD must be at least 8 characters');
  if (process.env.MONGO_URI === 'memory') problems.push('MONGO_URI=memory is for this computer only - use a MongoDB Atlas connection string');
  if (['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].some((k) => process.env[k].length < 32 || /change_me/.test(process.env[k])))
    problems.push('JWT secrets must be long random values');
  if (problems.length) {
    logger.error(`Production settings are not safe: ${problems.join('; ')}`);
    process.exit(1);
  }
}

/** Loads the sample catalogue on the first run of a fresh (local) database. */
const seedIfEmpty = async () => {
  if (process.env.MONGO_URI !== 'memory' && process.env.SEED_ON_EMPTY !== 'true') return;
  const { default: Product } = await import('./models/Product.js');
  const { default: User } = await import('./models/User.js');
  const { default: Order } = await import('./models/Order.js');
  const { seed, syncSeedProducts } = await import('./seeds/seed.js');
  // Real queries, not estimatedDocumentCount(): its cached count can read 0 after the local
  // database was stopped abruptly, and seed() wipes everything before loading the samples.
  const [product, user, order] = await Promise.all([Product.exists({}), User.exists({}), Order.exists({})]);
  if (!product && !user && !order) {
    logger.info('Empty database detected - loading sample data...');
    await seed();
    return;
  }
  // Existing data is kept; only sample products added in a newer version are inserted
  const added = await syncSeedProducts();
  if (added) logger.info(`Added ${added} new sample product(s) to the catalogue`);
};

const start = async () => {
  await connectDB();
  await seedIfEmpty();
  await ensureAdminAccount();
  const server = app.listen(PORT, () => {
    logger.info(`ShopEase API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use - ShopEase is probably already running (http://localhost:${PORT}).`);
      process.exit(1);
    }
    throw err;
  });

  // Optional second port, e.g. ALSO_PORT=5173 so an old bookmark http://localhost:5173 keeps working
  const extraPort = Number(process.env.ALSO_PORT);
  if (extraPort && extraPort !== Number(PORT)) {
    app
      .listen(extraPort, () => logger.info(`Also available on port ${extraPort}`))
      .on('error', (err) => logger.warn(`Could not also listen on port ${extraPort}: ${err.code || err.message}`));
  }
  verifyEmailTransport();
  startJobs();

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err?.stack || err}`);
});

start();
