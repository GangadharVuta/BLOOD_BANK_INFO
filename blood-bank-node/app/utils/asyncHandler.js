/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors and pass to Express error middleware
 * 
 * Usage:
 * router.post('/path', asyncHandler(async (req, res, next) => {
 *   // Your async code here
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
