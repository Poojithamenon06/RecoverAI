const express = require("express");
const router = express.Router();

const RecoveryCase = require("../models/RecoveryCase");

router.get("/stats", async (req, res) => {
    try {
        const cases = await RecoveryCase.find().lean();

        const totalCases = cases.length;

        const totalRevenueAtRisk = cases.reduce(
            (sum, item) => sum + (item.amount || 0),
            0
        );

        const recoveredCases = cases.filter(
            item => item.status === "recovered"
        );

        const recoveredRevenue = recoveredCases.reduce(
            (sum, item) => sum + (item.recoveredAmount || 0),
            0
        );

        const failedCases = cases.filter(
            item => item.status === "failed"
        ).length;

        const escalatedCases = cases.filter(
            item => item.status === "escalated"
        ).length;

        const stoppedCases = cases.filter(
            item => item.status === "stopped"
        ).length;

        const processingCases = cases.filter(
            item => item.status === "processing"
        ).length;

        const recoveryRate =
            totalCases > 0
                ? (recoveredCases.length / totalCases) * 100
                : 0;

        const recoveryTimes = recoveredCases
            .map(item => item.recoveryTimeMinutes || 0)
            .filter(time => time > 0);

        const averageRecoveryTime =
            recoveryTimes.length > 0
                ? recoveryTimes.reduce(
                      (sum, time) => sum + time,
                      0
                  ) / recoveryTimes.length
                : 0;

        const actionCounts = {};

        cases.forEach(item => {
            const action =
                item.recommendedAction || "unknown";

            actionCounts[action] =
                (actionCounts[action] || 0) + 1;
        });

        const failureReasonCounts = {};

        cases.forEach(item => {
            const reason =
                item.failureReason || "unknown";

            failureReasonCounts[reason] =
                (failureReasonCounts[reason] || 0) + 1;
        });

        const probabilityValues = cases
            .filter(
                item =>
                    typeof item.recoveryProbability ===
                    "number"
            )
            .map(item => item.recoveryProbability * 100);

        const averageRecoveryProbability =
            probabilityValues.length > 0
                ? probabilityValues.reduce(
                      (sum, value) => sum + value,
                      0
                  ) / probabilityValues.length
                : 0;

        res.status(200).json({
            success: true,

            data: {
                totalCases,

                totalRevenueAtRisk:
                    Number(
                        totalRevenueAtRisk.toFixed(2)
                    ),

                recoveredRevenue:
                    Number(
                        recoveredRevenue.toFixed(2)
                    ),

                recoveredCases:
                    recoveredCases.length,

                failedCases,

                escalatedCases,

                stoppedCases,

                processingCases,

                recoveryRate:
                    Number(
                        recoveryRate.toFixed(2)
                    ),

                averageRecoveryTime:
                    Number(
                        averageRecoveryTime.toFixed(2)
                    ),

                averageRecoveryProbability:
                    Number(
                        averageRecoveryProbability.toFixed(2)
                    ),

                actionCounts,

                failureReasonCounts
            }
        });

    } catch (error) {

        console.error(
            "Dashboard Stats Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch dashboard statistics",
            error:
                error.message
        });
    }
});

module.exports = router;