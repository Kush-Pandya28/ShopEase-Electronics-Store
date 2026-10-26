export default class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
