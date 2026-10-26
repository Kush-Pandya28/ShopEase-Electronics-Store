import User from '../models/User.js';
import logger from '../config/logger.js';

export const DEMO_ADMIN_EMAIL = 'admin@shopease.com';

/** Admin login from server/.env (ADMIN_LOGIN_EMAIL / ADMIN_LOGIN_PASSWORD), or the demo admin. */
export const adminCredentials = () => {
  const email = (process.env.ADMIN_LOGIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_LOGIN_PASSWORD || '';
  if (email && password) {
    return { name: process.env.ADMIN_NAME || 'ShopEase Admin', email, password, custom: true };
  }
  return { name: 'ShopEase Admin', email: DEMO_ADMIN_EMAIL, password: 'Admin@123', custom: false };
};

/**
 * Makes sure the configured admin can log in. Runs on every start-up:
 *  - creates the admin account if it does not exist
 *  - promotes an existing customer account with that email to admin (and sets the configured password)
 *  - removes the public demo admin once a custom admin is configured, so its known password can't be used
 * An admin who later changes their password in the profile keeps the new one.
 */
export const ensureAdminAccount = async () => {
  const creds = adminCredentials();
  if (!creds.custom) return;

  const user = await User.findOne({ email: creds.email });
  if (!user) {
    await User.create({ name: creds.name, email: creds.email, password: creds.password, role: 'admin', isVerified: true });
    logger.info(`Admin account created: ${creds.email}`);
  } else if (user.role !== 'admin' || user.isBlocked) {
    user.role = 'admin';
    user.isBlocked = false;
    user.password = creds.password;
    await user.save();
    logger.info(`Admin access granted to ${creds.email}`);
  }

  const demo = await User.findOneAndDelete({ email: DEMO_ADMIN_EMAIL, role: 'admin' });
  if (demo) logger.info(`Removed demo admin ${DEMO_ADMIN_EMAIL}`);
};
