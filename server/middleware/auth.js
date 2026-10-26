import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const readBearer = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const resolveUser = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired, please login again');
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (user.isBlocked) throw new ApiError(403, 'Your account has been blocked. Contact support.');
  return user;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = readBearer(req);
  if (!token) throw new ApiError(401, 'Not authorized, please login');
  req.user = await resolveUser(token);
  next();
});

/** Attaches req.user when a valid token is present, but never blocks the request. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readBearer(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
});

// Re-exported so routes can import { protect, admin } from one place
export { default as admin } from './admin.js';
