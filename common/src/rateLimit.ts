import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import config from "@api/config";
import { RequestHandler } from "express";

let client: Redis.Redis;

if (config.common.production) {
  client = new Redis(config.database.redis.uri, {
    db: 1,
  });
}

export const rateLimiter = () => {
  if (config.common.production) {
    return rateLimit({
      // Rate limiter configuration
      windowMs: 2 * 60 * 1000, // 2 minutes
      max: 500, // Limit each IP to 500 requests per window
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers

      // Redis store configuration
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
