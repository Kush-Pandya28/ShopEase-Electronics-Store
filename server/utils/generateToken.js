import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const REFRESH_COOKIE = 'refreshToken';

export const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });

// jti makes every token unique, even two logins in the same second
export const signRefreshToken = (user) =>
  jwt.sign({ id: user._id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const randomToken = () => crypto.randomBytes(32).toString('hex');

const cookieOptions = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Also secure when the site is opened over https (the public link), not only in production
    secure: isProd || Boolean(res?.req?.secure),
    // Frontend and API live on different domains in production (Vercel + Render)
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
  };
};

export const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(res), maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions(res));
};

export const getRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE];

const MAX_SESSIONS = 5;
const GRACE_MS = 30 * 1000;

/**
 * Issues a fresh access + refresh token pair. Each device keeps its own hashed refresh token
 * (newest 5 kept), so logging in on a phone does not log the laptop out.
 * @param {string} [replaceHash] hash of the refresh token being rotated (removed first)
 */
export const issueTokens = async (res, user, replaceHash) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  if (replaceHash) {
    await User.updateOne(
      { _id: user._id },
      {
        $pull: { refreshTokens: replaceHash },
        $push: { graceTokens: { $each: [{ hash: replaceHash, until: new Date(Date.now() + GRACE_MS) }], $slice: -10 } },
      }
    );
  }
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { $each: [hashToken(refreshToken)], $slice: -MAX_SESSIONS } } }
  );
  setRefreshCookie(res, refreshToken);
  return accessToken;
};
