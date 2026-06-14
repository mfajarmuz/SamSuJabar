'use strict';

/**
 * Wraps an async Express route handler so that any thrown error
 * is forwarded to Express's error middleware via next().
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
