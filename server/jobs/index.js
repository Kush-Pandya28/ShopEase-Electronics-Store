import cron from 'node-cron';
import Product from '../models/Product.js';
import logger from '../config/logger.js';
import { emails } from '../services/emailService.js';

/** Daily 9:00 AM IST low stock digest for the admin. */
export const startJobs = () => {
  if (process.env.NODE_ENV === 'test') return;

  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 5;
        const products = await Product.find({ isActive: true, stock: { $lte: threshold } })
          .select('title stock')
          .sort({ stock: 1 })
          .lean();
        if (products.length) await emails.lowStock(products);
        logger.info(`Low stock job: ${products.length} product(s) flagged`);
      } catch (err) {
        logger.error(`Low stock job failed: ${err.message}`);
      }
    },
    { timezone: 'Asia/Kolkata' }
  );
};
