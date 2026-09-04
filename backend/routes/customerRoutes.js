const express = require("express");

const router = express.Router();

const RecoveryCase = require("../models/RecoveryCase");

router.get("/", async (req, res) => {
    try {

        // Fetch all recovery cases
        const cases = await RecoveryCase
            .find()
            .sort({ updatedAt: -1 })
            .lean();


        // Group cases by customer
        const customerMap = {};


        cases.forEach((item) => {

            const customerId =
                item.customerId || "Unknown";

            // Create customer object if it doesn't exist
            if (!customerMap[customerId]) {

                customerMap[customerId] = {
                    customerId: customerId,

                    totalCases: 0,

                    totalRevenueAtRisk: 0,

                    recoveredRevenue: 0,

                    recoveredCases: 0,

                    failedCases: 0,

                    escalatedCases: 0,

                    stoppedCases: 0,

                    processingCases: 0,

                    recoveryProbabilities: [],

                    latestStatus: item.status || "open",

                    latestFailureReason:
                        item.failureReason || "unknown",

                    latestAction:
                        item.recommendedAction || "unknown",

                    latestCaseId:
                        item.caseId || "",

                    latestUpdatedAt:
                        item.updatedAt || item.createdAt
                };
            }

            const customer =
                customerMap[customerId];

            // Total cases
            customer.totalCases += 1;

            // Revenue at risk
            customer.totalRevenueAtRisk +=
                Number(item.amount || 0);

            // Recovered revenue
            customer.recoveredRevenue +=
                Number(item.recoveredAmount || 0);

            // Status counts
            if (item.status === "recovered") {

                customer.recoveredCases += 1;

            } else if (item.status === "failed") {

                customer.failedCases += 1;

            } else if (item.status === "escalated") {

                customer.escalatedCases += 1;

            } else if (item.status === "stopped") {

                customer.stoppedCases += 1;

            } else if (item.status === "processing") {

                customer.processingCases += 1;
            }

            // Recovery probability
            if (
                typeof item.recoveryProbability ===
                "number"
            ) {

                customer.recoveryProbabilities.push(
                    item.recoveryProbability
                );
            }


            if (
                customer.totalCases === 1
            ) {

                customer.latestStatus =
                    item.status || "open";

                customer.latestFailureReason =
                    item.failureReason || "unknown";

                customer.latestAction =
                    item.recommendedAction ||
                    "unknown";

                customer.latestCaseId =
                    item.caseId || "";

                customer.latestUpdatedAt =
                    item.updatedAt ||
                    item.createdAt;
            }
        });

        const customers =
            Object.values(customerMap).map(
                (customer) => {

                    const recoveryRate =
                        customer.totalCases > 0
                            ? (
                                customer.recoveredCases /
                                customer.totalCases
                            ) * 100
                            : 0;


                    const averageRecoveryProbability =
                        customer.recoveryProbabilities.length > 0
                            ? (
                                customer.recoveryProbabilities
                                    .reduce(
                                        (sum, value) =>
                                            sum + value,
                                        0
                                    ) /
                                customer.recoveryProbabilities.length
                            ) * 100
                            : 0;


                    return {

                        customerId:
                            customer.customerId,

                        totalCases:
                            customer.totalCases,

                        totalRevenueAtRisk:
                            Number(
                                customer.totalRevenueAtRisk
                                    .toFixed(2)
                            ),

                        recoveredRevenue:
                            Number(
                                customer.recoveredRevenue
                                    .toFixed(2)
                            ),

                        recoveredCases:
                            customer.recoveredCases,

                        failedCases:
                            customer.failedCases,

                        escalatedCases:
                            customer.escalatedCases,

                        stoppedCases:
                            customer.stoppedCases,

                        processingCases:
                            customer.processingCases,

                        recoveryRate:
                            Number(
                                recoveryRate.toFixed(2)
                            ),

                        averageRecoveryProbability:
                            Number(
                                averageRecoveryProbability
                                    .toFixed(2)
                            ),

                        latestStatus:
                            customer.latestStatus,

                        latestFailureReason:
                            customer.latestFailureReason,

                        latestAction:
                            customer.latestAction,

                        latestCaseId:
                            customer.latestCaseId,

                        latestUpdatedAt:
                            customer.latestUpdatedAt
                    };
                }
            );

        // Sort customers by latest activity
        customers.sort(
            (a, b) =>
                new Date(
                    b.latestUpdatedAt || 0
                ) -
                new Date(
                    a.latestUpdatedAt || 0
                )
        );


        // Overall customer statistics
        const totalCustomers =
            customers.length;


        const activeCustomers =
            customers.filter(
                (customer) =>
                    customer.latestStatus !==
                        "recovered" &&
                    customer.latestStatus !==
                        "stopped"
            ).length;


        const recoveredCustomers =
            customers.filter(
                (customer) =>
                    customer.recoveredCases > 0
            ).length;


        res.status(200).json({

            success: true,

            count:
                totalCustomers,

            data: customers,

            summary: {

                totalCustomers:
                    totalCustomers,

                activeCustomers:
                    activeCustomers,

                recoveredCustomers:
                    recoveredCustomers
            }
        });


    } catch (error) {

        console.error(
            "Customers API Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch customer data",

            error:
                error.message
        });
    }
});


module.exports = router;