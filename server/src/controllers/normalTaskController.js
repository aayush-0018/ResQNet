import NormalTask from "../models/NormalTask.js";
import { publishEvent } from "../services/pubsub.service.js";
import { emitStatusUpdate, emitNormalTaskImmediate } from "../services/websocket.service.js";
import { pushNormalJob, pushStatusUpdate } from "../services/queue.service.js";
import { log, err } from "../utils/logger.js";
import { 
  geocodeAddressComponents, 
  getDefaultCoordinates 
} from "../utils/geocoding.js";

/**
 * handleNormalTask
 * - persist the task in Mongo (with location object)
 * - push job to the **END (right)** of Redis queue using rPush
 * - optional Pub/Sub publish for monitoring
 */
export const handleNormalTask = async (req, res) => {
  try {
    const { taskType, reporterId, location, meta } = req.body;

    // Validate required fields
    if (!taskType || !reporterId || !location || !location.address || !location.pincode) {
      return res.status(400).json({
        error: "Invalid payload: require taskType, reporterId, location.address and location.pincode"
      });
    }

    // Geocode address to get coordinates (best-effort)
    let coordinates = await geocodeAddressComponents(location);
    
    if (!coordinates) {
      // Fallback to default coordinates if geocoding fails
      coordinates = getDefaultCoordinates();
      log("⚠️ Geocoding failed, using default coordinates");
    }

    // 1️⃣ Persist in DB
    const saved = await NormalTask.create({
      taskType,
      reporterId,
      location: {
        ...location,
        coordinates // Add coordinates to location
      },
      meta
    });

    const jobPayload = {
      taskType,
      reporterId,
      taskId: saved._id.toString(),
      location: saved.location,
      payload: saved,
      enqueuedAt: Date.now()
    };

    // Create payload for WebSocket broadcast
    const wsPayload = {
      id: saved._id.toString(),
      type: saved.taskType,
      status: saved.status || "open",
      reporterId: saved.reporterId,
      location: saved.location,
      meta: saved.meta,
      createdAt: saved.createdAt
    };

    // 1️⃣ Immediate WebSocket broadcast for real-time updates
    try {
      emitNormalTaskImmediate(wsPayload);
      log("🔊 Normal task WebSocket broadcast sent");
    } catch (e) {
      err("Normal task WebSocket broadcast error:", e);
    }

    // 2️⃣ Queue at RIGHT end (normal jobs)
    try {
      await pushNormalJob(jobPayload);
      log("✅ Normal job queued at RIGHT end", jobPayload);
    } catch (e) {
      err("Queue push error:", e);
    }

    // 3️⃣ Optional Pub/Sub
    try {
      await publishEvent("task.normal", jobPayload);
      log("📣 Published task.normal to Pub/Sub");
    } catch (e) {
      err("Pub/Sub publish error:", e);
    }

    return res.status(201).json({
      message: "Normal task queued successfully",
      task: jobPayload
    });
  } catch (e) {
    err("NormalTask controller error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * List recent normal tasks
 */
export const listRecentNormalTasks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const tasks = await NormalTask.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id taskType reporterId location meta status createdAt updatedAt');
    
    return res.json({
      tasks: tasks.map(t => ({
        id: t._id.toString(),
        type: t.taskType,
        status: t.status || "open",
        reporterId: t.reporterId,
        location: t.location,
        meta: t.meta,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    });
  } catch (e) {
    err('List normal tasks error:', e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Update normal task status
 */
export const updateNormalTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'assigned', 'resolved'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be one of: open, assigned, resolved" 
      });
    }

    const task = await NormalTask.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('_id taskType reporterId location meta status createdAt updatedAt');

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const statusUpdatePayload = {
      id: task._id.toString(),
      type: task.taskType,
      status: task.status,
      reporterId: task.reporterId,
      location: task.location,
      meta: task.meta,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };

    // 1️⃣ Immediate WebSocket broadcast
    try {
      emitStatusUpdate(statusUpdatePayload);
      log("🔊 Status update WebSocket broadcast sent");
    } catch (e) {
      err("Status update WebSocket broadcast error:", e);
    }

    // 2️⃣ Publish to Redis Pub/Sub
    try {
      await publishEvent("status.update", statusUpdatePayload);
      log("📣 Published status.update to Pub/Sub");
    } catch (e) {
      err("Status update Pub/Sub error:", e);
    }

    // 3️⃣ Queue status update job for workers
    try {
      await pushStatusUpdate({
        taskType: "status_update",
        itemType: "normal_task",
        itemId: task._id.toString(),
        status: task.status,
        payload: statusUpdatePayload,
        enqueuedAt: Date.now()
      });
      log("⚡ Status update job queued");
    } catch (e) {
      err("Status update queue error:", e);
    }

    return res.json({ 
      message: "Task status updated successfully",
      task: statusUpdatePayload
    });
  } catch (e) {
    err("Update normal task status error:", e);
    return res.status(500).json({ error: e.message });
  }
};
