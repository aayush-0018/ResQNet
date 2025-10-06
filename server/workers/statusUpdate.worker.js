import { getRedisClient } from "../src/config/redis.js";
import { log, err } from "../src/utils/logger.js";
import { initRedis } from "../src/config/redis.js";
await initRedis();
const STATUS_UPDATE_QUEUE_KEY = "cen:status_updates";

/**
 * Status Update Worker
 * Processes status update jobs from the Redis queue
 * Handles both emergency and normal task status updates
 */
class StatusUpdateWorker {
  constructor() {
    this.redis = null;
    this.isRunning = false;
  }

  async start() {
    try {
      this.redis = getRedisClient();
      if (!this.redis) {
        throw new Error("Redis client not initialized");
      }

      this.isRunning = true;
      log("🚀 Status Update Worker started");

      // Start processing loop
      this.processQueue();
    } catch (error) {
      err("Failed to start Status Update Worker:", error);
      process.exit(1);
    }
  }

  async processQueue() {
    while (this.isRunning) {
      try {
        // Blocking pop from the right end of the queue
        const result = await this.redis.brPop(STATUS_UPDATE_QUEUE_KEY, 5); // 5 second timeout
        
        if (result) {
          const job = JSON.parse(result.element);
          await this.processStatusUpdate(job);
        }
      } catch (error) {
        err("Error processing status update queue:", error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async processStatusUpdate(job) {
    try {
      log("📋 Processing status update job:", {
        taskType: job.taskType,
        itemType: job.itemType,
        itemId: job.itemId,
        status: job.status
      });

      const { taskType, itemType, itemId, status, payload } = job;

      // Log the status update for monitoring
      log(`✅ Status updated: ${itemType} ${itemId} -> ${status}`);

      // Here you can add additional processing logic:
      // - Send notifications to specific users
      // - Update external systems
      // - Generate reports
      // - Send emails/SMS notifications
      
      // Example: Send notification to the reporter
      if (payload.reporterId) {
        log(`📧 Status update notification would be sent to reporter: ${payload.reporterId}`);
        // TODO: Implement actual notification sending logic here
      }

      // Example: Log for audit trail
      log(`📊 Audit: ${itemType} ${itemId} status changed to ${status} at ${new Date().toISOString()}`);

    } catch (error) {
      err("Error processing status update job:", error);
    }
  }

  stop() {
    this.isRunning = false;
    log("🛑 Status Update Worker stopped");
  }
}

// Start the worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new StatusUpdateWorker();
  worker.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    log("Received SIGINT, shutting down Status Update Worker...");
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log("Received SIGTERM, shutting down Status Update Worker...");
    worker.stop();
    process.exit(0);
  });
}

export default StatusUpdateWorker;