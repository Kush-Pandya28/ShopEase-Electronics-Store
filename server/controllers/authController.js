import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  issueTokens,
  clearRefreshCookie,
  getRefreshCookie,
  hashToken,
  randomToken,
} from '../utils/generateToken.js';
import { emails } from '../services/emailService.js';

export const EMAIL_TAKEN = 'This email is already registered. Please login instead.';
export const PHONE_TAKEN = 'This mobile number is already registered with another account.';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  // One account per email and per mobile number
  if (await User.exists({ email: email.toLowerCase() })) {
    throw new ApiError(409, EMAIL_TAKEN, [{ field: 'email', message: EMAIL_TAKEN }]);
  }
  if (await User.exists({ phone })) {
    throw new ApiError(409, PHONE_TAKEN, [{ field: 'phone', message: PHONE_TAKEN }]);
  }
  const verifyToken = randomToken();
  const user = await User.create({ name, email, phone, password, emailVerifyToken: hashToken(verifyToken) });
  const accessToken = await issueTokens(res, user);

  emails.welcome(user);
  emails.verifyEmail(user, verifyToken);

  res.status(201).json({ success: true, user, accessToken });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  // Registration already tells whether an email exists, so a clear message here leaks nothing new
  if (!user) {
    const message = 'No account found with this email. Please create an account first.';
    throw new ApiError(401, message, [{ field: 'email', message }]);
  }
  if (!(await user.comparePassword(password))) {
    const message = 'Incorrect password. Try again or use "Forgot password?".';
    throw new ApiError(401, message, [{ field: 'password', message }]);
  }
  if (user.isBlocked) throw new ApiError(403, 'Your account has been blocked. Contact support.');

  const accessToken = await issueTokens(res, user);
  res.json({ success: true, user, accessToken });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const token = getRefreshCookie(req);
  // Only this device's session ends; other devices stay logged in
  if (token) await User.updateOne({ refreshTokens: hashToken(token) }, { $pull: { refreshTokens: hashToken(token) } });
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

// POST /api/auth/refresh-token  (rotates the refresh token)
export const refreshToken = asyncHandler(async (req, res) => {
  const token = getRefreshCookie(req);
  if (!token) throw new ApiError(401, 'No session');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired, please login again');
  }

  const hash = hashToken(token);
  let user = await User.findOne({ _id: decoded.id, refreshTokens: hash });
  let rotate = true;
  if (!user) {
    // Another tab rotated this token a moment ago: accept it once more within the grace window
    user = await User.findOne({
      _id: decoded.id,
      graceTokens: { $elemMatch: { hash, until: { $gt: new Date() } } },
    });
    rotate = false;
  }
  if (!user) throw new ApiError(401, 'Invalid session');
  if (user.isBlocked) throw new ApiError(403, 'Your account has been blocked');

  const accessToken = await issueTokens(res, user, rotate ? hash : undefined);
  res.json({ success: true, user, accessToken });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (user) {
    const token = randomToken();
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    emails.resetPassword(user, token);
  }
  // Same response either way so emails cannot be enumerated
  res.json({ success: true, message: 'If that email is registered, a reset link has been sent' });
});

// PUT /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.params.token),
    resetPasswordExpire: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = []; // log out every device
  user.graceTokens = [];
  await user.save();
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Password updated, please login with your new password' });
});

// GET /api/auth/verify-email/:token
export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ emailVerifyToken: hashToken(req.params.token) });
  if (!user) throw new ApiError(400, 'Verification link is invalid or already used');
  user.isVerified = true;
  user.emailVerifyToken = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Email verified successfully' });
});
