const RecoveryCase = require("../models/RecoveryCase");
const AuditLog = require("../models/AuditLog");

const { predictRecovery } = require("./mlService");
const { evaluatePolicy } = require("./policyEngine");

const {
    createPaymentLink
} = require("./razorpayService");


async function processRecoveryCase(data) {

    const caseId = `RC-${Date.now()}`;

    const recoveryCase = new RecoveryCase({

        caseId,
        // Thunder Client uses camelCase
        transactionId: data.transactionId,
        customerId: data.customerId,

        razorpayPaymentId:
            data.razorpay_payment_id || null,

        razorpayOrderId:
            data.razorpay_order_id || null,

        amount:
            data.amount,

        currency:
            data.currency || "INR",

        paymentMethod:
            data.paymentMethod || data.payment_method,

        failureReason:
            data.failureReason || data.failure_reason,

        attemptNumber:
            data.attemptNumber ||
            data.attempt_number ||
            1,

        status:
            "processing",

        attemptsMade:
            0,

        recoveredAmount:
            0
    });


    // Save recovery case
    await recoveryCase.save();

    await AuditLog.create({

        caseId,

        event:
            "recovery_case_created",

        actor:
            "webhook",

        action:
            "create_case",

        reason:
            "Payment failure detected and recovery case created",

        metadata: {

            transactionId:
                data.transactionId,

            customerId:
                data.customerId,

            amount:
                data.amount,

            failureReason:
                data.failureReason ||
                data.failure_reason
        }

    });

    const prediction =
        await predictRecovery({

            amount:
                data.amount,

            currency:
                data.currency,

            payment_method:
                data.paymentMethod ||
                data.payment_method,

            failure_reason:
                data.failureReason ||
                data.failure_reason,

            attempt_number:
                data.attemptNumber ||
                data.attempt_number ||
                1,

            previous_success_count:
                data.previousSuccessCount ||
                data.previous_success_count ||
                0,

            previous_failure_count:
                data.previousFailureCount ||
                data.previous_failure_count ||
                0,

            average_transaction_amount:
                data.averageTransactionAmount ||
                data.average_transaction_amount ||
                0,

            customer_lifetime_value:
                data.customerLifetimeValue ||
                data.customer_lifetime_value ||
                0,

            days_since_last_purchase:
                data.daysSinceLastPurchase ||
                data.days_since_last_purchase ||
                0,

            purchase_frequency:
                data.purchaseFrequency ||
                data.purchase_frequency ||
                0,

            subscription_status:
                data.subscriptionStatus ||
                data.subscription_status ||
                "inactive",

            device_type:
                data.deviceType ||
                data.device_type ||
                "unknown",

            country:
                data.country ||
                "India",

            hour:
                data.hour !== undefined
                    ? data.hour
                    : 12,

            day_of_week:
                data.dayOfWeek !== undefined
                    ? data.dayOfWeek
                    : (
                        data.day_of_week !== undefined
                            ? data.day_of_week
                            : 0
                    )
        });

    const probability =
        prediction.recovery_probability;

    const recoveryPrediction =
        prediction.prediction;


    recoveryCase.status =
        "open";

    recoveryCase.recoveryProbability =
        probability;

    recoveryCase.recoveryPrediction =
        recoveryPrediction;


    await recoveryCase.save();

    await AuditLog.create({

        caseId,

        event:
            "recovery_prediction_generated",

        actor:
            "ml_model",

        action:
            "predict_recovery",

        reason:
            "Random Forest model evaluated recovery probability",

        metadata: {

            recoveryProbability:
                probability,

            recoveryPercentage:
                prediction.recovery_percentage,

            prediction:
                recoveryPrediction,

            model:
                prediction.model
        }

    });

    const failureReason =
        data.failureReason ||
        data.failure_reason;


    let diagnosis =
        `Payment failure caused by ${failureReason}`;

    let action;

    let reason;


    if (probability >= 0.75) {

        // Temporary failures are better handled
        // using a payment link

        if (
            failureReason === "network_error" ||
            failureReason === "bank_timeout"
        ) {

            action =
                "payment_link";

            reason =
                "High recovery probability with a temporary payment failure";

        } else {

            action =
                "retry";

            reason =
                "High recovery probability supports another payment attempt";
        }
    }

    else if (probability >= 0.45) {

        action =
            "reminder";

        reason =
            "Moderate recovery probability suggests customer follow-up";
    }

    else {
        action =
            "escalate";

        reason =
            "Low recovery probability requires escalation instead of automated recovery";
    }

    recoveryCase.aiDiagnosis =
        diagnosis;

    recoveryCase.aiConfidence =
        probability;

    const policyDecision =
        evaluatePolicy({

            recoveryCase,

            proposedAction:
                action
        });

    await AuditLog.create({

        caseId,

        event:
            "policy_evaluation",

        actor:
            "policy_engine",

        action,

        reason:
            policyDecision.reason,

        metadata: {

            decision:
                policyDecision.decision,

            allowed:
                policyDecision.allowed,

            checks:
                policyDecision.checks
        }

    });

    if (!policyDecision.allowed) {

        recoveryCase.status =
            policyDecision.decision === "ESCALATE"
                ? "escalated"
                : "stopped";


        recoveryCase.recommendedAction =
            policyDecision.decision === "ESCALATE"
                ? "escalate"
                : action;


        await recoveryCase.save();
        // Audit policy decision

        await AuditLog.create({

            caseId,

            event:
                policyDecision.decision === "ESCALATE"
                    ? "recovery_escalated"
                    : "recovery_stopped",

            actor:
                "policy_engine",

            action:
                recoveryCase.recommendedAction,

            reason:
                policyDecision.reason,

            metadata: {

                amount:
                    recoveryCase.amount,

                recoveryProbability:
                    probability,

                decision:
                    policyDecision.decision,

                checks:
                    policyDecision.checks
            }

        });
        return {
            caseId,
            recoveryProbability:
                probability,

            prediction:
                recoveryPrediction,

            diagnosis:
                recoveryCase.aiDiagnosis,

            recommendedAction:
                recoveryCase.recommendedAction,

            policyDecision:
                policyDecision.decision,

            policyReason:
                policyDecision.reason,

            policyChecks:
                policyDecision.checks
        };
    }

    recoveryCase.recommendedAction =
        action;


    let paymentLinkResult =
        null;

    if (action === "payment_link") {

        paymentLinkResult =
            await createPaymentLink({

                caseId,

                amount:
                    recoveryCase.amount,

                currency:
                    recoveryCase.currency,

                customerId:
                    recoveryCase.customerId,

                transactionId:
                    recoveryCase.transactionId
            });


        recoveryCase.paymentLinkId =
            paymentLinkResult.paymentLinkId;


        recoveryCase.paymentLinkUrl =
            paymentLinkResult.shortUrl;


        recoveryCase.actionExecuted =
            "payment_link";


        recoveryCase.attemptsMade =
            recoveryCase.attemptsMade + 1;


        recoveryCase.lastActionAt =
            new Date();


        await recoveryCase.save();

        await AuditLog.create({

            caseId,

            event:
                "payment_link_created",

            actor:
                "system",

            action:
                "payment_link",

            reason:
                "Policy-approved Razorpay Payment Link created for recovery",

            metadata: {

                paymentLinkId:
                    paymentLinkResult.paymentLinkId,

                paymentLinkUrl:
                    paymentLinkResult.shortUrl,

                amount:
                    paymentLinkResult.amount,

                currency:
                    paymentLinkResult.currency,

                referenceId:
                    paymentLinkResult.referenceId
            }

        });

    }

    else {

        await recoveryCase.save();
    }

    await AuditLog.create({

        caseId,

        event:
            "ai_recovery_recommendation",

        actor:
            "ai_agent",

        action,

        reason,

        metadata: {

            diagnosis,

            confidence:
                probability,

            recoveryProbability:
                probability
        }

    });

    return {

        caseId,

        recoveryProbability:
            probability,

        prediction:
            recoveryPrediction,

        diagnosis,

        recommendedAction:
            action,

        reason,

        policyDecision:
            "ALLOW",

        policyReason:
            policyDecision.reason,

        policyChecks:
            policyDecision.checks,

        actionExecuted:
            recoveryCase.actionExecuted ||
            null,

        paymentLinkId:
            recoveryCase.paymentLinkId ||
            null,

        paymentLinkUrl:
            recoveryCase.paymentLinkUrl ||
            null
    };
}


module.exports = {
    processRecoveryCase
};