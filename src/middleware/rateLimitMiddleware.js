const { Ratelimit } = require('@upstash/ratelimit');
const redis = require('../config/redis');

const createRateLimiter = ({ maxRequests, window, prefix }) => {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, window),
    prefix: `rl:${prefix}`,
    analytics: false,
  });

  return async (req, res, next) => {
             const identifier = req.user?.id || req.ip;

    try {
      const { success, limit, remaining, reset } = await limiter.limit(identifier);

    
      res.set('X-RateLimit-Limit', limit);
      res.set('X-RateLimit-Remaining', remaining);
      res.set('X-RateLimit-Reset', reset);

      if (!success) {
        const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
        res.set('Retry-After', retryAfterSec);
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: retryAfterSec,
          data: null,
        });
      }

      return next();
    } catch (err) {
      
      console.error('[RateLimit] Redis error:', err.message);
      return next();
    }
  };
};


const loginRateLimiter = createRateLimiter({
  maxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
  window: process.env.LOGIN_RATE_LIMIT_WINDOW || '15 m',
  prefix: 'auth:login',
});

const generalRateLimiter = createRateLimiter({
  maxRequests: parseInt(process.env.GENERAL_RATE_LIMIT_MAX, 10) || 100,
  window: process.env.GENERAL_RATE_LIMIT_WINDOW || '1 m',
  prefix: 'api:general',
});

module.exports = { createRateLimiter, loginRateLimiter, generalRateLimiter };
