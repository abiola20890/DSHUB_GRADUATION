export const sendSuccess = (res, statusCode, message, data = null, pagination = null) => {
  const body = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    body.pagination = pagination;
  }

  return res.status(statusCode).json(body);
};


export const sendOk = (res, message, data, pagination) =>
  sendSuccess(res, 200, message, data, pagination);


export const sendCreated = (res, message, data) =>
  sendSuccess(res, 201, message, data);


export const sendNoContent = (res) => res.status(204).send();


export const sendError = (res, statusCode, message, errors = null, err = null) => {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }


  if (err?.stack && process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};

export const sendBadRequest = (res, message = 'Bad request', errors = null, err = null) =>
  sendError(res, 400, message, errors, err);


export const sendUnauthorized = (res, message = 'Authentication required') =>
  sendError(res, 401, message);


export const sendForbidden = (res, message = 'You do not have permission to perform this action') =>
  sendError(res, 403, message);


export const sendNotFound = (res, message = 'Resource not found') =>
  sendError(res, 404, message);


export const sendConflict = (res, message = 'Resource already exists') =>
  sendError(res, 409, message);


export const sendUnprocessable = (res, message = 'Unprocessable request', errors = null) =>
  sendError(res, 422, message, errors);

export const sendTooManyRequests = (res, message = 'Too many requests, please try again later') =>
  sendError(res, 429, message);


export const sendServerError = (res, err = null) => {
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err?.message || 'Internal server error';

  return sendError(res, 500, message, null, err);
};


export const buildPagination = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    currentPage:  page,
    totalPages,
    totalCount,
    limit,
    hasNextPage:  page < totalPages,
    hasPrevPage:  page > 1,
  };
};


export const parseMongooseValidationError = (err) => {
  return Object.fromEntries(
    Object.entries(err.errors).map(([field, error]) => [field, error.message])
  );
};