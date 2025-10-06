import Contributor from "../models/Contributor.js";
import { publishEvent } from "../services/pubsub.service.js";
import Emergency from "../models/Emergency.js";
import { log, err } from "../utils/logger.js";

/**
 * Broadcast emergency alert to all contributors subscribed to an NDRF team
 */
export const broadcastEmergency = async (req, res) => {
  try {
    const { message, ndrfTeamId, emergencyArray, emergencyIds } = req.body;

    if (!message || !ndrfTeamId) {
      return res.status(400).json({ 
        error: "Message and NDRF team ID are required" 
      });
    }

    // Find all contributors subscribed to this NDRF team
    const contributors = await Contributor.find({ 
      ndrfTeamId, 
      isActive: true 
    }).populate('contributorId', 'name email');

    if (contributors.length === 0) {
      return res.status(404).json({ 
        message: "No active contributors found for this NDRF team",
        subscriberCount: 0
      });
    }

    // Build attachments/emergencyArray from client-provided array or fallback to IDs
    let attached = [];
    let fullEmergencyArray = [];
    if (Array.isArray(emergencyArray) && emergencyArray.length) {
      fullEmergencyArray = emergencyArray.map(e => ({
        id: String(e.id || e._id || ''),
        type: e.type,
        status: e.status,
        reporterId: e.reporterId,
        email: e.email,
        mobileNumber: e.mobileNumber,
        address: e.address,
        location: e.location,
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date()
      }));
    } else if (Array.isArray(emergencyIds) && emergencyIds.length) {
      const docs = await Emergency.find({ _id: { $in: emergencyIds } })
        .select('_id type status reporterId email mobileNumber address location createdAt');
      fullEmergencyArray = docs.map(d => ({
        id: d._id.toString(),
        type: d.type,
        status: d.status,
        reporterId: d.reporterId,
        email: d.email,
        mobileNumber: d.mobileNumber,
        address: d.address,
        location: d.location,
        createdAt: d.createdAt
      }));
    }
    attached = fullEmergencyArray.map(d => ({ id: d.id, type: d.type, location: d.location, createdAt: d.createdAt, address: d.address }));

    // Create notification for each contributor
    const notificationPromises = contributors.map(async (contributor) => {
      const notification = {
        emergencyId: null,
        emergencyIds: [],
        emergencyArray: fullEmergencyArray,
        message: message,
        sentAt: new Date(),
        read: false
      };

      contributor.notifications.push(notification);
      return contributor.save();
    });

    await Promise.all(notificationPromises);

    // Publish to Redis Pub/Sub for real-time notifications
    const broadcastPayload = {
      type: "emergency_broadcast",
      ndrfTeamId,
      message,
      emergencyIds: [],
      subscriberCount: contributors.length,
      attachments: attached,
      emergencyArray: fullEmergencyArray,
      timestamp: new Date().toISOString()
    };

    try {
      await publishEvent("emergency.broadcast", broadcastPayload);
      log("📢 Emergency broadcast published to Redis Pub/Sub");
    } catch (e) {
      err("Failed to publish broadcast to Redis:", e);
    }

    log(`📢 Emergency broadcast sent to ${contributors.length} contributors`);

    return res.status(200).json({
      message: "Emergency broadcast sent successfully",
      subscriberCount: contributors.length,
      contributors: contributors.map(c => ({
        id: c.contributorId._id,
        name: c.contributorId.name,
        email: c.contributorId.email
      }))
    });

  } catch (e) {
    err("Broadcast controller error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Get all contributors for an NDRF team
 */
export const getContributors = async (req, res) => {
  try {
    const { ndrfTeamId } = req.params;

    const contributors = await Contributor.find({ 
      ndrfTeamId, 
      isActive: true 
    }).populate('contributorId', 'name email state role');

    return res.status(200).json({
      contributors: contributors.map(c => ({
        id: c.contributorId._id,
        name: c.contributorId.name,
        email: c.contributorId.email,
        state: c.contributorId.state,
        role: c.contributorId.role,
        subscribedAt: c.subscribedAt,
        notificationCount: c.notifications.filter(n => !n.read).length
      }))
    });

  } catch (e) {
    err("Get contributors error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Get active subscriptions for a contributor
 */
export const getContributorSubscriptions = async (req, res) => {
  try {
    const { contributorId } = req.params;

    const subs = await Contributor.find({ contributorId, isActive: true })
      .populate('ndrfTeamId', 'name email state role');

    return res.status(200).json({
      subscriptions: subs.map(s => ({
        ndrfTeamId: s.ndrfTeamId?._id,
        name: s.ndrfTeamId?.name,
        email: s.ndrfTeamId?.email,
        state: s.ndrfTeamId?.state,
        role: s.ndrfTeamId?.role,
        subscribedAt: s.subscribedAt
      }))
    });
  } catch (e) {
    err("Get contributor subscriptions error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Get notifications for a contributor
 */
export const getContributorNotifications = async (req, res) => {
  try {
    const { contributorId } = req.params;

    const subs = await Contributor.find({ contributorId, isActive: true })
      .select('notifications subscribedAt ndrfTeamId')
      .populate('ndrfTeamId', 'name state');

    // Flatten raw notifications
    const rawNotifications = subs.flatMap(s =>
      (s.notifications || []).map(n => ({
        ndrfTeamId: s.ndrfTeamId?._id,
        ndrfTeamName: s.ndrfTeamId?.name,
        message: n.message,
        emergencyId: n.emergencyId,
        emergencyIds: n.emergencyIds || [],
        emergencyArray: n.emergencyArray || [],
        sentAt: n.sentAt,
        read: n.read
      }))
    );

    // Resolve unique emergencyIds to details
    const uniqueIds = Array.from(new Set(rawNotifications.flatMap(n => n.emergencyIds))).filter(Boolean);
    let idToEmergency = new Map();
    if (uniqueIds.length) {
      const docs = await Emergency.find({ _id: { $in: uniqueIds } })
        .select('_id type location createdAt');
      idToEmergency = new Map(
        docs.map(d => [d._id.toString(), {
          id: d._id.toString(),
          type: d.type,
          location: d.location,
          createdAt: d.createdAt
        }])
      );
    }

    const notifications = rawNotifications
      .map(n => ({
        ...n,
        attachments: (n.emergencyIds || []).map(id => idToEmergency.get(id)).filter(Boolean)
      }))
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    return res.status(200).json({ notifications });
  } catch (e) {
    err("Get contributor notifications error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Subscribe a contributor to an NDRF team
 */
export const subscribeToNDRF = async (req, res) => {
  try {
    const { contributorId, ndrfTeamId } = req.body;

    if (!contributorId || !ndrfTeamId) {
      return res.status(400).json({ 
        error: "Contributor ID and NDRF team ID are required" 
      });
    }

    // Check if subscription already exists
    const existingSubscription = await Contributor.findOne({
      contributorId,
      ndrfTeamId
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({ 
          error: "Already subscribed to this NDRF team" 
        });
      } else {
        // Reactivate subscription
        existingSubscription.isActive = true;
        existingSubscription.subscribedAt = new Date();
        await existingSubscription.save();
        
        return res.status(200).json({
          message: "Subscription reactivated successfully"
        });
      }
    }

    // Create new subscription
    const subscription = new Contributor({
      contributorId,
      ndrfTeamId,
      isActive: true
    });

    await subscription.save();

    log(`✅ Contributor ${contributorId} subscribed to NDRF team ${ndrfTeamId}`);

    return res.status(201).json({
      message: "Successfully subscribed to NDRF team"
    });

  } catch (e) {
    err("Subscribe to NDRF error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Unsubscribe a contributor from an NDRF team
 */
export const unsubscribeFromNDRF = async (req, res) => {
  try {
    const { contributorId, ndrfTeamId } = req.body;

    if (!contributorId || !ndrfTeamId) {
      return res.status(400).json({ 
        error: "Contributor ID and NDRF team ID are required" 
      });
    }

    const subscription = await Contributor.findOne({
      contributorId,
      ndrfTeamId
    });

    if (!subscription) {
      return res.status(404).json({ 
        error: "Subscription not found" 
      });
    }

    subscription.isActive = false;
    await subscription.save();

    log(`❌ Contributor ${contributorId} unsubscribed from NDRF team ${ndrfTeamId}`);

    return res.status(200).json({
      message: "Successfully unsubscribed from NDRF team"
    });

  } catch (e) {
    err("Unsubscribe from NDRF error:", e);
    return res.status(500).json({ error: e.message });
  }
};