import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import EmailLog from '../models/EmailLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ETHEREAL_FILE = path.resolve(__dirname, '..', '.data', 'ethereal.json');

/**
 * Delivery modes:
 *  - smtp:    SMTP_HOST is set (e.g. Gmail) -> real emails to real inboxes
 *  - preview: development without SMTP -> free Ethereal test mailbox, every email gets a link to view it
 *  - console: no SMTP and no internet -> the email is only written to the server log
 */
let transportPromise = null;
let state = { mode: 'console', from: '', detail: '' };

const smtpTransport = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
  });
};

const etherealTransport = async () => {
  let account = null;
  try {
    account = JSON.parse(fs.readFileSync(ETHEREAL_FILE, 'utf8'));
  } catch {
    account = await nodemailer.createTestAccount();
    fs.mkdirSync(path.dirname(ETHEREAL_FILE), { recursive: true });
    fs.writeFileSync(ETHEREAL_FILE, JSON.stringify(account));
  }
  state.detail = `Ethereal test inbox: login at https://ethereal.email with ${account.user} / ${account.pass}`;
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
};

const createTransport = async () => {
  if (process.env.SMTP_HOST) {
    state = {
      mode: 'smtp',
      from: fromAddress(),
      detail: `${process.env.SMTP_HOST} as ${process.env.SMTP_USER}`,
    };
    return smtpTransport();
  }
  if (process.env.NODE_ENV !== 'production') {
    try {
      const t = await etherealTransport();
      state = { ...state, mode: 'preview', from: fromAddress() };
      return t;
    } catch (err) {
      logger.warn(`Email preview mailbox unavailable (${err.message}) - emails will only be logged`);
    }
  }
  state = {
    mode: 'console',
    from: fromAddress(),
    detail: 'SMTP not configured - emails are written to the server log only',
  };
  return null;
};

const getTransport = () => {
  if (!transportPromise) transportPromise = createTransport();
  return transportPromise;
};

// Gmail and most providers only allow sending "from" the account you log in with
function fromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  return process.env.SMTP_USER ? `ShopEase <${process.env.SMTP_USER}>` : 'ShopEase <no-reply@shopease.com>';
}

/** Current delivery mode, used by the admin Emails page and server start-up log. */
export const getEmailStatus = async () => {
  await getTransport();
  return { ...state };
};

/** Checks the SMTP login once at start-up so a wrong password is reported immediately. */
export const verifyEmailTransport = async () => {
  if (process.env.NODE_ENV === 'test') return;
  const transport = await getTransport();
  if (state.mode === 'smtp') {
    try {
      await transport.verify();
      logger.info(`Email: real sending enabled via ${state.detail}`);
    } catch (err) {
      logger.error(
        `Email: SMTP login failed (${err.message}). For Gmail use an App Password - run setup-email.bat`
      );
    }
  } else if (state.mode === 'preview') {
    logger.info(
      'Email: preview mode (no SMTP set). Open the link printed for each email, or see Admin > Emails.'
    );
  } else {
    logger.info('Email: console mode - emails are only logged');
  }
};

const saveLog = async (entry) => {
  if (mongoose.connection.readyState !== 1) return; // e.g. the CLI test script without a database
  try {
    await EmailLog.create(entry);
  } catch (err) {
    logger.warn(`Could not save email log: ${err.message}`);
  }
};

// Links in emails, best first: the internet link (written by start-public-link.ps1, it changes on
// every start so it is read at send time), then PUBLIC_SITE_URL (this PC's network address).
const PUBLIC_LINK_FILE = path.resolve(__dirname, '..', '..', 'logs', 'public-url.txt');
export const publicLink = () => {
  try {
    const url = fs.readFileSync(PUBLIC_LINK_FILE, 'utf8').trim();
    return /^https:\/\/\S+$/.test(url) ? url : '';
  } catch {
    return '';
  }
};
const clientUrl = () =>
  (publicLink() ||
    process.env.PUBLIC_SITE_URL ||
    process.env.RENDER_EXTERNAL_URL || // set automatically by Render
    (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0])
    .trim()
    .replace(/\/$/, '');
const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const layout = (title, body) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#4f46e5;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">ShopEase</div>
  <div style="padding:24px;color:#111827;line-height:1.6">
    <h2 style="margin-top:0">${title}</h2>
    ${body}
  </div>
  <div style="background:#f9fafb;padding:14px 24px;color:#6b7280;font-size:12px">
    You are receiving this email because you have an account on ShopEase.
  </div>
</div>`;

const button = (href, label) =>
  `<p><a href="${href}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">${label}</a></p>`;

/**
 * Sends one email and records the result. Never throws: a mail problem must not break
 * registration or checkout. Returns { status, mode, previewUrl?, error? }.
 */
export const sendEmail = async ({ to, subject, html, type = 'general' }) => {
  if (process.env.NODE_ENV === 'test') return { status: 'sent', mode: 'console' };
  if (!to) return { status: 'failed', mode: state.mode, error: 'No recipient' };

  const transport = await getTransport();
  const base = { to, subject, type, mode: state.mode };

  if (!transport) {
    logger.info(`[email] to=${to} subject="${subject}" (not sent: SMTP not configured)`);
    await saveLog({ ...base, status: 'sent' });
    return { status: 'sent', mode: 'console' };
  }

  // One retry for temporary network / server errors
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
       
      const info = await transport.sendMail({ from: fromAddress(), to, subject, html });
      const previewUrl =
        state.mode === 'preview' ? nodemailer.getTestMessageUrl(info) || undefined : undefined;
      logger.info(`[email] sent to=${to} subject="${subject}"${previewUrl ? ` preview: ${previewUrl}` : ''}`);
      await saveLog({ ...base, status: 'sent', messageId: info.messageId, previewUrl });
      return { status: 'sent', mode: state.mode, previewUrl };
    } catch (err) {
      const permanent = err.responseCode >= 500 || err.code === 'EAUTH';
      if (attempt === 2 || permanent) {
        logger.error(`[email] FAILED to=${to} subject="${subject}": ${err.message}`);
        await saveLog({ ...base, status: 'failed', error: err.message });
        return { status: 'failed', mode: state.mode, error: err.message };
      }
       
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return { status: 'failed', mode: state.mode };
};

const orderItemsTable = (order) => `
<table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:14px">
  ${order.items
    .map(
      (i) => `<tr style="border-bottom:1px solid #eee">
        <td>${i.title}${i.variantLabel ? `<br><small style="color:#6b7280">${i.variantLabel}</small>` : ''}</td>
        <td align="center">x${i.quantity}</td>
        <td align="right">${rs(i.price * i.quantity)}</td></tr>`
    )
    .join('')}
  <tr><td colspan="2">Shipping</td><td align="right">${order.shippingPrice ? rs(order.shippingPrice) : 'FREE'}</td></tr>
  ${order.discount ? `<tr><td colspan="2">Discount</td><td align="right">- ${rs(order.discount)}</td></tr>` : ''}
  <tr><td colspan="2"><b>Total (incl. GST ${rs(order.taxPrice)})</b></td><td align="right"><b>${rs(order.totalPrice)}</b></td></tr>
</table>`;

export const emails = {
  welcome: (user) =>
    sendEmail({
      to: user.email,
      subject: 'Welcome to ShopEase!',
      type: 'welcome',
      html: layout(
        `Hi ${user.name}, welcome aboard!`,
        `<p>Thanks for joining ShopEase - your one stop shop for mobiles, laptops, audio and more.</p>
         ${button(`${clientUrl()}/products`, 'Start shopping')}`
      ),
    }),

  verifyEmail: (user, token) =>
    sendEmail({
      to: user.email,
      subject: 'Verify your ShopEase email',
      type: 'verify-email',
      html: layout(
        'Verify your email',
        `<p>Please confirm your email address to secure your account.</p>
         ${button(`${clientUrl()}/verify-email/${token}`, 'Verify email')}`
      ),
    }),

  resetPassword: (user, token) =>
    sendEmail({
      to: user.email,
      subject: 'Reset your ShopEase password',
      type: 'reset-password',
      html: layout(
        'Password reset request',
        `<p>We received a request to reset your password. This link is valid for 15 minutes.</p>
         ${button(`${clientUrl()}/reset-password/${token}`, 'Reset password')}
         <p style="color:#6b7280">If you did not request this, you can safely ignore this email.</p>`
      ),
    }),

  orderConfirmation: (user, order) =>
    sendEmail({
      to: user.email,
      subject: `Order confirmed - ${order.invoiceNumber}`,
      type: 'order-confirmation',
      html: layout(
        `Thank you for your order, ${user.name}!`,
        `<p>Your order <b>#${order._id}</b> has been placed successfully.</p>
         ${orderItemsTable(order)}
         <p>Payment: <b>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'}</b></p>
         ${button(`${clientUrl()}/orders/${order._id}`, 'Track order')}`
      ),
    }),

  orderStatus: (user, order) => {
    const label = order.status.replace(/_/g, ' ');
    return sendEmail({
      to: user.email,
      subject: `Your ShopEase order is ${label}`,
      type: `order-${order.status}`,
      html: layout(
        `Order ${label}`,
        `<p>Hi ${user.name}, your order <b>#${order._id}</b> is now <b>${label}</b>.</p>
         ${order.trackingId ? `<p>Courier: ${order.courier || '-'}<br>Tracking ID: <b>${order.trackingId}</b></p>` : ''}
         ${button(`${clientUrl()}/orders/${order._id}`, 'View order')}`
      ),
    });
  },

  test: (to) =>
    sendEmail({
      to,
      subject: 'ShopEase test email',
      type: 'test',
      html: layout(
        'Your email setup works!',
        `<p>This is a test email from your ShopEase store, sent at ${new Date().toLocaleString('en-IN')}.</p>
         <p>Customers will now receive welcome, order confirmation, shipping and password reset emails.</p>
         ${button(clientUrl(), 'Open ShopEase')}`
      ),
    }),

  lowStock: (products) =>
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Low stock alert: ${products.length} product(s)`,
      type: 'low-stock',
      html: layout(
        'Low stock alert',
        `<ul>${products.map((p) => `<li>${p.title} - <b>${p.stock}</b> left</li>`).join('')}</ul>
         ${button(`${clientUrl()}/admin/products`, 'Manage inventory')}`
      ),
    }),
};
