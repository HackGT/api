import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import config from "@api/config";
import { StatusCodes } from "http-status-codes";
import { RequestHandler } from "express";

let client: Redis.Redis;

if (config.common.production) {
  client = new Redis(config.database.redis.uri, {
    db: 1,
  });
}

/**
 * Rate limits all services among a common redis database with a redis store. Sets rate limit headers.
 * Only applies in production environments.
 */
export const rateLimiter = () => {
  if (config.common.production) {
    return rateLimit({
      windowMs: 2 * 60 * 1000, // 2 minutes
      max: 1000, // Limit each IP to 1000 requests per window
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: {
        status: StatusCodes.TOO_MANY_REQUESTS,
        type: "rate_limit_error",
        message: "Too many requests sent. Please try again later.",
      },
      keyGenerator: req => 
         req.user && req.user.uid ? req.user.uid : req.ip // Rate limit by user ID if authenticated, otherwise by IP
      ,
      store: new RedisStore({
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args: string[]) => client.call(...args),
      }),
    });
  }

  const defaultHandler: RequestHandler = (req, res, next) => {
    next();
  };
  return defaultHandler;
};
