const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["processed", "duplicate", "failed", "received"],
      default: "received",
      index: true
    },
    signatureVerified: {
      type: Boolean,
      default: false
    },
    caseId: {
      type: String,
      default: null,
      index: true
    },
    transactionId: {
      type: String,
      default: null
    },
    customerId: {
      type: String,
      default: null
    },
    paymentLinkId: {
      type: String,
      default: null,
      index: true
    },
    paymentId: {
      type: String,
      default: null
    },
    orderId: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    message: {
      type: String,
      default: null
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
