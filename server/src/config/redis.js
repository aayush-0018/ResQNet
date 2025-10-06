import { createClient } from "redis";
import { log, err } from "../utils/logger.js";

let redisClient = null;
let pubClient = null;
let subClient = null;

/**
 * Initialize three Redis clients:
 *  - redisClient : used for list queue operations (LPUSH / RPUSH / BRPOP)
 *  - pubClient : used for publishing Pub/Sub messages
 *  - subClient : used for subscribing to channels (workers or internal listeners can also create their own)
 */
export const initRedis = async () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisClient = createClient({ url });
    pubClient = createClient({ url });
    subClient = createClient({ url });

    // connect clients in parallel
    await Promise.all([redisClient.connect(), pubClient.connect(), subClient.connect()]);

    log("🟢 Redis connected");
  } catch (e) {
    err("Redis connection error:", e);
    throw e;
  }
};

export const getRedisClient = () => redisClient;
export const getPubClient = () => pubClient;
export const getSubClient = () => subClient;
