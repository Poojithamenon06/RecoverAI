const express = require("express");
const WebhookEvent = require("../models/WebhookEvent");

const router = express.Router();

// GET /api/webhooks/events
// Returns the latest persisted Razorpay webhook events for the dashboard.
router.get("/events", async (req, res) => {
  try {
    const events = await WebhookEvent.find()
      .sort({ receivedAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error("Webhook Events API Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load webhook events"
    });
  }
});

module.exports = router;
