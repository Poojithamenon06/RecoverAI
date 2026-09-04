import joblib
import pandas as pd
import os
from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(
    title="RecoverAI ML Service",
    description="AI-powered revenue recovery prediction service",
    version="1.0.0"
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "random_forest_recovery_model.pkl"
)

model = joblib.load(MODEL_PATH)

print("===================================")
print("RecoverAI ML Model Loaded")
print("Model: Random Forest")
print("===================================")


class PaymentData(BaseModel):

    amount: float

    currency: str

    payment_method: str

    failure_reason: str

    attempt_number: int

    previous_success_count: int

    previous_failure_count: int

    average_transaction_amount: float

    customer_lifetime_value: float

    days_since_last_purchase: int

    purchase_frequency: float

    subscription_status: str

    device_type: str

    country: str

    hour: int

    day_of_week: int


@app.get("/")
def home():

    return {
        "service": "RecoverAI ML Service",
        "status": "online",
        "model": "Random Forest"
    }


@app.post("/predict")
def predict(data: PaymentData):

    input_data = pd.DataFrame([{

        "amount": data.amount,

        "currency": data.currency,

        "payment_method": data.payment_method,

        "failure_reason": data.failure_reason,

        "attempt_number": data.attempt_number,

        "previous_success_count":
            data.previous_success_count,

        "previous_failure_count":
            data.previous_failure_count,

        "average_transaction_amount":
            data.average_transaction_amount,

        "customer_lifetime_value":
            data.customer_lifetime_value,

        "days_since_last_purchase":
            data.days_since_last_purchase,

        "purchase_frequency":
            data.purchase_frequency,

        "subscription_status":
            data.subscription_status,

        "device_type":
            data.device_type,

        "country":
            data.country,

        "hour":
            data.hour,

        "day_of_week":
            data.day_of_week
    }])


    prediction = model.predict(input_data)[0]

    probability = model.predict_proba(
        input_data
    )[0][1]


    return {

        "recovery_probability":
            round(float(probability), 4),

        "recovery_percentage":
            round(float(probability) * 100, 2),

        "prediction":
            "recoverable"
            if prediction == 1
            else "unlikely_to_recover",

        "model":
            "Random Forest"
    }