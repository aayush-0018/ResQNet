import { getRedisClient } from "../config/redis.js";

const JOB_QUEUE_KEY = "cen:jobs";
const STATUS_UPDATE_QUEUE_KEY = "cen:status_updates";

/**
 * pushEmergencyAtFront(job)
 * Use LPUSH to add to the front (left) of the list.
 * Workers should BRPOP (pop from right) so emergency items are consumed first.
 */
export const pushEmergencyAtFront = async (job) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis client not initialized");
  const payload = JSON.stringify(job);
  await redis.lPush(JOB_QUEUE_KEY, payload);
};

/**
 * pushNormalJob(job)
 * Use RPUSH to add to the end (right) of the list.
 */
export const pushNormalJob = async (job) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis client not initialized");
  await redis.rPush(JOB_QUEUE_KEY, JSON.stringify(job));
};

/**
 * pushStatusUpdate(job)
 * Use LPUSH to add status updates to the front for immediate processing.
 */
export const pushStatusUpdate = async (job) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis client not initialized");
  const payload = JSON.stringify(job);
  await redis.lPush(STATUS_UPDATE_QUEUE_KEY, payload);
};
