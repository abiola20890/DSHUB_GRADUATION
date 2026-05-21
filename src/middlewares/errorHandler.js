import mongoose from 'mongoose';
import {
  sendError,
  sendBadRequest,
  sendNotFound,
  sendServerError,
  parseMongooseValidationError,
} from '../utils/response.js';


export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true; // Distinguishes intentional errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}


const handleValidationError = (err, res) => {
  const errors = parseMongooseValidationError(err);
  return sendBadRequest(res, 'Validation failed', errors);
};


const handleCastError = (err, res) => {
  return sendBadRequest(res, `Invalid ID format for field: ${err.path}`);
};


const handleDuplicateKeyError = (err, res) => {
  const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
  return sendError(
    res,
    409,
    `${field} already exists. Please use a different value.`
  );
};


const handleJwtExpiredError = (res) =>
  sendError(res, 401, 'Your session has expired. Please log in again.');


export const errorHandler = (err, req, res, next) => {
  // Log all errors in development; log only unexpected errors in production
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', {
      message: err.message,
      stack:   err.stack,
      url:     req.originalUrl,
      method:  req.method,
    });
  } else if (!err.isOperational) {
    // Unexpected programming errors in production — log for monitoring
    console.error('[UNEXPECTED ERROR]', {
      message: err.message,
      url:     req.originalUrl,
      method:  req.method,
    });
  }


  if (err.isOperational) {
    return sendError(res, err.statusCode, err.message);
  }


  if (err instanceof mongoose.Error.ValidationError) {
    return handleValidationError(err, res);
  }

  if (err instanceof mongoose.Error.CastError) {
    return handleCastError(err, res);
  }

  // MongoDB duplicate key (not a Mongoose class — identified by error code)
  if (err.code === 11000) {
    return handleDuplicateKeyError(err, res);
  }

 

  if (err.name === 'TokenExpiredError') {
    return handleJwtExpiredError(res);
  }

  if (err.name === 'JsonWebTokenError') {
    return handleJwtInvalidError(res);
  }
  return sendServerError(res, err);
};


export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};