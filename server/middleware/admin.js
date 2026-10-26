import ApiError from '../utils/ApiError.js';

/** Allows only admins. Use after `protect` (which sets req.user). */
const admin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return next(new ApiError(403, 'Admin access only'));
};

export default admin;
