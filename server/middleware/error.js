import multer from 'multer';
import logger from '../config/logger.js';

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

 
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let { errors } = err;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field';
    message =
      {
        email: 'This email is already registered. Please login instead.',
        phone: 'This mobile number is already registered with another account.',
      }[field] || `${field} already exists`;
    errors = [{ field, message }];
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0]?.message || 'Validation failed';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be under 2 MB' : err.message;
  } else if (err.message?.includes('not allowed by CORS')) {
    statusCode = 403;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) logger.error(`${req.method} ${req.originalUrl} - ${err.stack || err}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    // Stack traces only for local debugging - never to visitors of the public link
    ...(process.env.NODE_ENV !== 'production' && process.env.DEBUG_ERRORS === 'true' ? { stack: err.stack } : {}),
  });
};
