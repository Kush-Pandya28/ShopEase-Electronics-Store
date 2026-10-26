import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { normalizePhone } from '../utils/helpers.js';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';

const router = Router();

const password = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
    body('phone')
      .customSanitizer(normalizePhone)
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Enter a valid 10 digit mobile number'),
    password(),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post(
  '/forgot-password',
  authLimiter,
  [body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false })],
  validate,
  forgotPassword
);
router.put('/reset-password/:token', authLimiter, [password()], validate, resetPassword);
router.get('/verify-email/:token', verifyEmail);

export default router;
