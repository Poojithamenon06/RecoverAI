const MAX_ATTEMPTS = 3;

const HIGH_VALUE_LIMIT = 50000;

const MIN_RECOVERY_PROBABILITY = 0.45;


const evaluatePolicy = ({
    recoveryCase,
    proposedAction
}) => {

    const checks = [];

    let allowed = true;

    let decision = "ALLOW";

    let reason = "All policy checks passed";


    if (
        recoveryCase.status !== "open" &&
        recoveryCase.status !== "processing"
    ) {

        allowed = false;

        decision = "STOP";

        reason =
            "Recovery case is no longer active";

    }

    checks.push({

        rule: "case_active",

        passed:
            recoveryCase.status === "open" ||
            recoveryCase.status === "processing"

    });


    const attemptsAllowed =
        recoveryCase.attemptsMade < MAX_ATTEMPTS;


    if (!attemptsAllowed) {

        allowed = false;

        decision = "STOP";

        reason =
            "Maximum recovery attempts reached";

    }


    checks.push({

        rule: "maximum_attempts",

        passed: attemptsAllowed,

        limit: MAX_ATTEMPTS,

        current:
            recoveryCase.attemptsMade

    });


    const notRecovered =
        recoveryCase.status !== "recovered";


    if (!notRecovered) {

        allowed = false;

        decision = "STOP";

        reason =
            "Payment has already been recovered";

    }


    checks.push({

        rule: "not_already_recovered",

        passed: notRecovered

    });


    const probability =
        recoveryCase.recoveryProbability || 0;


    const probabilityPassed =
        probability >= MIN_RECOVERY_PROBABILITY ||
        proposedAction === "escalate";


    if (!probabilityPassed) {

        allowed = false;

        decision = "STOP";

        reason =
            "Recovery probability below policy threshold";

    }


    checks.push({

        rule: "minimum_recovery_probability",

        passed: probabilityPassed,

        threshold:
            MIN_RECOVERY_PROBABILITY,

        probability

    });


    const isHighValue =
        recoveryCase.amount >= HIGH_VALUE_LIMIT;


    if (
        isHighValue &&
        proposedAction !== "escalate"
    ) {

        allowed = false;

        decision = "ESCALATE";

        reason =
            "High-value recovery requires human review";

    }


    checks.push({

        rule: "high_value_transaction",

        passed:
            !isHighValue ||
            proposedAction === "escalate",

        threshold:
            HIGH_VALUE_LIMIT,

        amount:
            recoveryCase.amount

    });


    const validActions = [

        "retry",

        "payment_link",

        "reminder",

        "escalate"

    ];


    const validAction =
        validActions.includes(proposedAction);


    if (!validAction) {

        allowed = false;

        decision = "STOP";

        reason =
            "Invalid recovery action";

    }


    checks.push({

        rule: "valid_action",

        passed: validAction,

        action:
            proposedAction

    });


    return {

        allowed,

        decision,

        reason,

        checks

    };

};

module.exports = {
    evaluatePolicy
};