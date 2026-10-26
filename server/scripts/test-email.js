/* eslint-disable no-console */
// Usage: npm run test-email -- you@example.com
import 'dotenv/config';
import { emails, getEmailStatus } from '../services/emailService.js';

const to = process.argv[2] || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
if (!to) {
  console.error('Usage: npm run test-email -- you@example.com');
  process.exit(1);
}

const status = await getEmailStatus();
console.log(`Mode: ${status.mode}  (${status.detail})`);
console.log(`From: ${status.from}`);
console.log(`Sending a test email to ${to} ...`);

const result = await emails.test(to);
if (result.status === 'sent' && result.mode === 'smtp') {
  console.log(`\nSUCCESS - check the inbox (and Spam folder) of ${to}`);
} else if (result.status === 'sent' && result.mode === 'preview') {
  console.log(`\nSent to the TEST mailbox (no SMTP configured). View it here:\n${result.previewUrl}`);
  console.log('Run setup-email.bat to send real emails to real inboxes.');
} else if (result.status === 'sent') {
  console.log('\nSMTP is not configured and the preview mailbox is unreachable - the email was only logged.');
} else {
  console.error(`\nFAILED: ${result.error}`);
  if (/Invalid login|Username and Password not accepted|EAUTH|535/i.test(result.error || '')) {
    console.error(
      'Gmail needs an App Password (not your normal password): https://myaccount.google.com/apppasswords'
    );
  }
  process.exit(1);
}
process.exit(0);
