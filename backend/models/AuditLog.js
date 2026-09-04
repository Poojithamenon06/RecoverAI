const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {

        caseId: {
            type: String,
            required: true
        },

        event: {
            type: String,
            required: true
        },

        actor: {
            type: String,
            enum: [
                "webhook",
                "ml_model",
                "ai_agent",
                "policy_engine",
                "system",
                "human"
            ],
            required: true
        },

        action: {
            type: String
        },

        reason: {
            type: String
        },

        metadata: {
            type: Object,
            default: {}
        }

    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AuditLog",
    auditLogSchema
);