import { getPubClient } from "../config/redis.js";
import { err, log } from "../utils/logger.js";

export const publishEvent = async (channel, payload) => {
  const pub = getPubClient();
  if (!pub) {
    log("⚠️ Pub client not available - skipping publish");
    return;
  }
  try {
    await pub.publish(channel, JSON.stringify(payload));
    log(`📣 Published to channel ${channel}`);
  } catch (e) {
    err("Publish error:", e);
    throw e;
  }
};
