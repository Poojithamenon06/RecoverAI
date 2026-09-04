const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createPaymentLink({
    caseId,
    amount,
    currency,
    customerId,
    transactionId
}) {
    try {

        const amountInSubunits = Math.round(amount * 100);

        const referenceId = `REC-${caseId}`;

        const paymentLink = await razorpay.paymentLink.create({
            amount: amountInSubunits,
            currency: currency || "INR",
            accept_partial: false,

            reference_id: referenceId,

            description:
                `RecoverAI payment recovery for transaction ${transactionId}`,

            customer: {
                name: customerId || "RecoverAI Customer"
            },

            expire_by:
                Math.floor(Date.now() / 1000) + (24 * 60 * 60),

            reminder_enable: false,

            notes: {
                recoverai_case_id: caseId,
                transaction_id: transactionId
            }
        });

        return {
            success: true,
            paymentLinkId: paymentLink.id,
            shortUrl: paymentLink.short_url,
            amount: paymentLink.amount,
            currency: paymentLink.currency,
            status: paymentLink.status,
            referenceId: paymentLink.reference_id
        };

    } catch (error) {

        console.error(
            "Razorpay Payment Link Error:",
            error
        );

        throw new Error(
            error?.error?.description ||
            error.message ||
            "Failed to create Razorpay Payment Link"
        );
    }
}

module.exports = {
    createPaymentLink
};