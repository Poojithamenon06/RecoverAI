const express = require("express");
const router = express.Router();

const RecoveryCase = require("../models/RecoveryCase");

const {
    processRecoveryCase
} = require("../services/recoveryAgent");

router.post("/test", async (req, res) => {
    try {
        const result =
            await processRecoveryCase(req.body);
        res.status(201).json({
            success: true,
            message:
                "Recovery case processed successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message:
                "Recovery case processing failed",
            error:
                error.message

        });
    }

});

router.get("/cases", async (req, res) => {
    try {
        const cases =
            await RecoveryCase
                .find()
                .sort({ updatedAt: -1 })
                .lean();

        res.status(200).json({

            success: true,
            count:
                cases.length,
            data:
                cases
        });

    } catch (error) {

        console.error(
            "Recovery Cases Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch recovery cases",
            error:
                error.message
        });
    }

});
module.exports = router;