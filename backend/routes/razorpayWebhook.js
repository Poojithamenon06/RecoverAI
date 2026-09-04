const express = require("express");
const crypto = require("crypto");

const RecoveryCase = require("../models/RecoveryCase");
const AuditLog = require("../models/AuditLog");
const WebhookEvent = require("../models/WebhookEvent");

const router = express.Router();

// Razorpay Webhook
router.post("/", async (req, res) => {
    let eventId = req.headers["x-razorpay-event-id"];
    let payload = null;

    try {
        const webhookSecret =
            process.env.RAZORPAY_WEBHOOK_SECRET;

        const signature =
            req.headers["x-razorpay-signature"];

        eventId =
            req.headers["x-razorpay-event-id"];

        // Check required headers
        if (!signature) {
            return res.status(400).json({
                success: false,
                message: "Missing Razorpay webhook signature"
            });
        }

        // Verify webhook signature
        const expectedSignature =
            crypto
                .createHmac("sha256", webhookSecret)
                .update(req.body)
                .digest("hex");

        // Prevent timingSafeEqual length error
        if (
            expectedSignature.length !== signature.length ||
            !crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(signature)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook signature"
            });
        }

        // Convert raw body to JSON
        payload =
            JSON.parse(req.body.toString());

        console.log(
            "Razorpay Webhook Event:",
            payload.event
        );

        /*
         * -------------------------------------------------------
         * Persist webhook event
         * -------------------------------------------------------
         */

        // Check if this event was already stored
        if (eventId) {
            const existingEvent =
                await WebhookEvent.findOne({
                    eventId: eventId
                });

            if (existingEvent) {
                console.log(
                    "Duplicate webhook event:",
                    eventId
                );

                return res.status(200).json({
                    success: true,
                    message: "Webhook event already processed",
                    eventId: eventId
                });
            }
        }

        /*
         * We create the event record first.
         * This allows the Webhook Events page to show
         * every verified Razorpay webhook we receive.
         */

        let webhookRecord = null;

        if (eventId) {
            webhookRecord =
                await WebhookEvent.create({
                    eventId: eventId,
                    event: payload.event || "unknown",
                    status: "received",
                    signatureVerified: true,
                    message: "Razorpay webhook received successfully",
                    receivedAt: new Date()
                });
        }

        /*
         * -------------------------------------------------------
         * We only process successful Payment Links
         * -------------------------------------------------------
         */

        if (payload.event !== "payment_link.paid") {

            if (webhookRecord) {
                webhookRecord.status = "processed";
                webhookRecord.message = "Event ignored";
                await webhookRecord.save();
            }

            return res.status(200).json({
                success: true,
                message: "Event ignored"
            });
        }

        // Extract Razorpay data
        const paymentLink =
            payload.payload.payment_link.entity;

        const payment =
            payload.payload.payment.entity;

        const order =
            payload.payload.order.entity;

        const paymentLinkId =
            paymentLink.id;

        const paymentId =
            payment.id;

        const orderId =
            order.id;

        console.log(
            "Payment Link ID:",
            paymentLinkId
        );

        console.log(
            "Payment ID:",
            paymentId
        );

        // Find our RecoverAI case
        const recoveryCase =
            await RecoveryCase.findOne({
                paymentLinkId: paymentLinkId
            });

        if (!recoveryCase) {

            console.log(
                "No RecoverAI case found for Payment Link:",
                paymentLinkId
            );

            if (webhookRecord) {
                webhookRecord.status = "processed";
                webhookRecord.paymentLinkId = paymentLinkId;
                webhookRecord.paymentId = paymentId;
                webhookRecord.orderId = orderId;
                webhookRecord.amount =
                    (paymentLink.amount_paid || 0) / 100;
                webhookRecord.currency =
                    paymentLink.currency || "INR";
                webhookRecord.message =
                    "No matching RecoverAI case";
                await webhookRecord.save();
            }

            return res.status(200).json({
                success: true,
                message: "No matching recovery case"
            });
        }

        /*
         * Update webhook record with RecoveryCase information
         */
        if (webhookRecord) {
            webhookRecord.caseId =
                recoveryCase.caseId;

            webhookRecord.transactionId =
                recoveryCase.transactionId;

            webhookRecord.customerId =
                recoveryCase.customerId;

            webhookRecord.paymentLinkId =
                paymentLinkId;

            webhookRecord.paymentId =
                paymentId;

            webhookRecord.orderId =
                orderId;

            webhookRecord.amount =
                (paymentLink.amount_paid || 0) / 100;

            webhookRecord.currency =
                paymentLink.currency || "INR";
        }

        // Prevent duplicate processing
        if (recoveryCase.status === "recovered") {

            if (webhookRecord) {
                webhookRecord.status = "duplicate";
                webhookRecord.message =
                    "Recovery already processed";
                await webhookRecord.save();
            }

            return res.status(200).json({
                success: true,
                message: "Recovery already processed",
                caseId: recoveryCase.caseId
            });
        }

        // Amount is stored in smallest currency unit
        const recoveredAmount =
            paymentLink.amount_paid / 100;

        // Calculate recovery time
        let recoveryTimeMinutes = 0;

        if (recoveryCase.lastActionAt) {

            const difference =
                Date.now() -
                new Date(
                    recoveryCase.lastActionAt
                ).getTime();

            recoveryTimeMinutes =
                Math.round(
                    difference / 60000
                );
        }

        // Update Recovery Case
        recoveryCase.status =
            "recovered";

        recoveryCase.recoveredAmount =
            recoveredAmount;

        recoveryCase.recoveryTimeMinutes =
            recoveryTimeMinutes;

        recoveryCase.razorpayPaymentId =
            paymentId;

        recoveryCase.razorpayOrderId =
            orderId;

        recoveryCase.actionExecuted =
            recoveryCase.actionExecuted ||
            "payment_link";

        await recoveryCase.save();

        /*
         * Update persistent webhook event
         */
        if (webhookRecord) {
            webhookRecord.status = "processed";
            webhookRecord.message =
                "Payment recovery processed successfully";
            await webhookRecord.save();
        }

        // Create audit log
        await AuditLog.create({

            caseId:
                recoveryCase.caseId,

            event:
                "recovery_payment_received",

            actor:
                "system",

            action:
                "payment_captured",

            reason:
                "Razorpay Payment Link payment successfully completed",

            metadata: {

                razorpayEventId:
                    eventId,

                paymentLinkId:
                    paymentLinkId,

                paymentId:
                    paymentId,

                orderId:
                    orderId,

                amount:
                    recoveredAmount,

                currency:
                    paymentLink.currency,

                paymentMethod:
                    payment.method

            }

        });

        console.log(
            `Recovery successful: ${recoveryCase.caseId}`
        );

        console.log(
            `Recovered amount: ₹${recoveredAmount}`
        );

        return res.status(200).json({

            success: true,

            message:
                "Payment recovery processed successfully",

            data: {

                caseId:
                    recoveryCase.caseId,

                status:
                    recoveryCase.status,

                recoveredAmount:
                    recoveryCase.recoveredAmount,

                recoveryTimeMinutes:
                    recoveryCase.recoveryTimeMinutes,

                paymentLinkId:
                    paymentLinkId,

                paymentId:
                    paymentId

            }

        });

    } catch (error) {

        console.error(
            "Razorpay Webhook Error:",
            error
        );

        /*
         * If webhook was verified and we created a record,
         * mark it as failed instead of losing the event.
         */
        try {
            if (eventId) {

                const existingEvent =
                    await WebhookEvent.findOne({
                        eventId: eventId
                    });

                if (existingEvent) {
                    existingEvent.status = "failed";
                    existingEvent.message =
                        error.message ||
                        "Webhook processing failed";

                    await existingEvent.save();
                }
            }
        } catch (dbError) {
            console.error(
                "Failed to update webhook event:",
                dbError
            );
        }

        return res.status(500).json({

            success: false,

            message:
                "Webhook processing failed",

            error:
                error.message

        });

    }
});

module.exports = router;