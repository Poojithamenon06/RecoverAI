import pandas as pd
import numpy as np
import os

np.random.seed(42)

NUM_RECORDS = 20000

print("Generating synthetic payment recovery dataset...")

failure_reasons = [
    "network_error",
    "issuer_decline",
    "insufficient_funds",
    "expired_card",
    "incorrect_otp",
    "bank_timeout"
]

payment_methods = [
    "card",
    "upi",
    "netbanking",
    "wallet"
]

subscription_statuses = [
    "active",
    "inactive",
    "trial"
]

device_types = [
    "mobile",
    "desktop",
    "tablet"
]

countries = [
    "India",
    "USA",
    "UK",
    "Singapore",
    "UAE"
]

data = []

for i in range(NUM_RECORDS):

    transaction_id = f"TXN{i+1:06d}"
    customer_id = f"CUST{np.random.randint(1, 5001):05d}"

    amount = round(np.random.lognormal(mean=8.2, sigma=1.0), 2)
    amount = min(amount, 100000)

    payment_method = np.random.choice(
        payment_methods,
        p=[0.45, 0.30, 0.15, 0.10]
    )

    failure_reason = np.random.choice(
        failure_reasons,
        p=[0.20, 0.20, 0.18, 0.12, 0.12, 0.18]
    )

    attempt_number = np.random.choice(
        [1, 2, 3, 4],
        p=[0.60, 0.25, 0.10, 0.05]
    )

    previous_success_count = np.random.poisson(8)
    previous_failure_count = np.random.poisson(2)

    previous_success_count = min(previous_success_count, 50)
    previous_failure_count = min(previous_failure_count, 20)

    average_transaction_amount = round(
        np.random.lognormal(mean=8.0, sigma=0.7), 2
    )

    customer_lifetime_value = round(
        average_transaction_amount *
        max(previous_success_count, 1) *
        np.random.uniform(0.8, 2.0),
        2
    )

    days_since_last_purchase = np.random.randint(1, 181)

    purchase_frequency = round(
        np.random.uniform(0.01, 2.0),
        3
    )

    subscription_status = np.random.choice(
        subscription_statuses,
        p=[0.55, 0.30, 0.15]
    )

    device_type = np.random.choice(
        device_types,
        p=[0.60, 0.30, 0.10]
    )

    country = np.random.choice(countries)

    hour = np.random.randint(0, 24)

    day_of_week = np.random.randint(0, 7)

    score = 0.0

    # Strong customer history
    score += previous_success_count * 0.12

    # Previous failures reduce recovery
    score -= previous_failure_count * 0.25

    # More attempts reduce recovery
    score -= (attempt_number - 1) * 0.9

    # Recent customers recover better
    if days_since_last_purchase <= 7:
        score += 1.8
    elif days_since_last_purchase <= 30:
        score += 1.0
    elif days_since_last_purchase <= 90:
        score += 0.2
    else:
        score -= 1.0

    # Purchase frequency
    score += purchase_frequency * 1.2

    # Subscription customers are more valuable / engaged
    if subscription_status == "active":
        score += 1.5
    elif subscription_status == "trial":
        score += 0.4
    else:
        score -= 0.5

    # Failure reason
    failure_effect = {
        "network_error": 1.5,
        "bank_timeout": 1.2,
        "issuer_decline": 0.5,
        "incorrect_otp": 0.2,
        "insufficient_funds": -1.0,
        "expired_card": -1.5
    }

    score += failure_effect[failure_reason]

    # Payment method
    method_effect = {
        "upi": 0.5,
        "card": 0.2,
        "netbanking": 0.0,
        "wallet": 0.3
    }

    score += method_effect[payment_method]

    # High-value transactions are harder to recover
    if amount > 50000:
        score -= 1.5
    elif amount > 20000:
        score -= 0.7
    elif amount < 2000:
        score += 0.3

    # Customer lifetime value
    if customer_lifetime_value > 100000:
        score += 1.0
    elif customer_lifetime_value > 50000:
        score += 0.5

    # Slight time effects
    if 9 <= hour <= 21:
        score += 0.2

    # Convert score into probability
    recovery_probability = 1 / (1 + np.exp(-score))

    # Add small realistic noise
    recovery_probability += np.random.normal(0, 0.03)

    recovery_probability = np.clip(
        recovery_probability,
        0.03,
        0.97
    )

    

    recovered = np.random.binomial(
        1,
        recovery_probability
    )

    if recovered == 1:

        recovery_time_minutes = int(
            np.random.normal(
                loc=max(15, 100 - recovery_probability * 80),
                scale=15
            )
        )

        recovery_time_minutes = max(
            5,
            recovery_time_minutes
        )

    else:

        recovery_time_minutes = 0

    data.append({

        "transaction_id": transaction_id,

        "customer_id": customer_id,

        "amount": amount,

        "currency": "INR",

        "payment_method": payment_method,

        "failure_reason": failure_reason,

        "attempt_number": attempt_number,

        "previous_success_count": previous_success_count,

        "previous_failure_count": previous_failure_count,

        "average_transaction_amount": average_transaction_amount,

        "customer_lifetime_value": customer_lifetime_value,

        "days_since_last_purchase": days_since_last_purchase,

        "purchase_frequency": purchase_frequency,

        "subscription_status": subscription_status,

        "device_type": device_type,

        "country": country,

        "hour": hour,

        "day_of_week": day_of_week,

        "recovery_probability": round(
            recovery_probability,
            4
        ),

        "recovered": recovered,

        "recovery_time_minutes": recovery_time_minutes
    })


df = pd.DataFrame(data)

def choose_action(row):

    p = row["recovery_probability"]

    if p >= 0.75:

        if row["failure_reason"] in [
            "network_error",
            "bank_timeout",
            "issuer_decline"
        ]:
            return "payment_link"

        return "retry"

    elif p >= 0.45:

        return "reminder"

    else:

        return "escalate"


df["recovery_action"] = df.apply(
    choose_action,
    axis=1
)

output_path = "../data/synthetic/payment_recovery_dataset.csv"

os.makedirs(
    "../data/synthetic",
    exist_ok=True
)

df.to_csv(
    output_path,
    index=False
)

print("\nDataset generated successfully!")

print("Rows:", len(df))

print("\nRecovery distribution:")
print(df["recovered"].value_counts())

print("\nRecovery percentage:")
print(
    df["recovered"].value_counts(normalize=True)
)

print("\nSample:")
print(df.head())

print("\nSaved to:")
print(output_path)