import "dotenv/config.js";
import { initRedis, getRedisClient, getPubClient } from "../src/config/redis.js";
import { log, err } from "../src/utils/logger.js";

const JOB_QUEUE_KEY = "cen:jobs";
const PUBSUB_CHANNEL = "worker:notification";

(async function startWorker() {
  try {
    // Initialize Redis connections
    await initRedis();
    const redis = getRedisClient();
    const pub = getPubClient();

    log("🚀 Notification Worker started and connected to Redis");

    while (true) {
      try {
        /**
         * ✅ BLPOP pops from the LEFT (head of list).
         * Emergency jobs are LPUSHed to the left,
         * so they will always be processed first.
         * Timeout 0 = block until an item exists.
         */
        const result = await redis.blPop(JOB_QUEUE_KEY, 0);
        if (!result) continue;

        const job = JSON.parse(result.element);
        log("📦 Picked job:", job);

        let notification;

        if (job.taskType === "emergency") {
          notification = {
            userId: job.reporterId,
            message:
              "Sent to local authorities, disaster management teams, and partnered NGOs for immediate review and action. You will receive updates as soon as rescue or relief teams respond.",
            jobPayload: job,
            processedAt: new Date().toISOString(),
          };
          
        } else if (job.taskType === "Resource Allocation") {
          notification = {
            userId: job.reporterId,
            message: "Your resource allocation request has been submitted successfully! Our team will review your request and coordinate with relevant agencies to fulfill your needs. You will be contacted within 24 hours with updates on resource availability and delivery timeline.",
            jobPayload: job,
            processedAt: new Date().toISOString(),
          };
          
        } 
        else {
          log(`⚠️ No notification created for job type: ${job.taskType}`);
        }
        await pub.publish(PUBSUB_CHANNEL, JSON.stringify(notification));
          log(`📡 Published notification to channel '${PUBSUB_CHANNEL}'`, notification);
      } catch (loopErr) {
        err("Worker loop error:", loopErr);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  } catch (e) {
    err("Fatal worker startup error:", e);
    process.exit(1);
  }
})();
