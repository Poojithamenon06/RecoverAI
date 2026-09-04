const mongoose = require("mongoose");

const recoveryCaseSchema = new mongoose.Schema(
    {

        caseId: {
            type: String,
            required: true,
            unique: true
        },

        transactionId: {
            type: String,
            required: true,
            unique: true
        },

        customerId: {
            type: String,
            required: true
        },

        razorpayPaymentId: {
            type: String
        },

        razorpayOrderId: {
            type: String
        },
        paymentLinkId: {
    type: String,
    default: null
},

paymentLinkUrl: {
    type: String,
    default: null
},

        amount: {
            type: Number,
            required: true
        },

        currency: {
            type: String,
            default: "INR"
        },

        paymentMethod: {
            type: String
        },

        failureReason: {
            type: String
        },

        attemptNumber: {
            type: Number,
            default: 1
        },

        status: {
            type: String,
            enum: [
                "open",
                "processing",
                "recovered",
                "failed",
                "escalated",
                "stopped"
            ],
            default: "open"
        },

        recoveryProbability: {
            type: Number
        },

        recoveryPrediction: {
            type: String
        },

        aiDiagnosis: {
            type: String
        },

        recommendedAction: {
            type: String,
            enum: [
                "retry",
                "payment_link",
                "reminder",
                "escalate",
                null
            ],
            default: null
        },

        aiConfidence: {
            type: Number
        },

        actionExecuted: {
            type: String,
            default: null
        },

        recoveredAmount: {
            type: Number,
            default: 0
        },

        recoveryTimeMinutes: {
            type: Number,
            default: 0
        },

        attemptsMade: {
            type: Number,
            default: 0
        },

        lastActionAt: {
            type: Date
        }

    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "RecoveryCase",
    recoveryCaseSchema
);