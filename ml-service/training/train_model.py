import pandas as pd
import numpy as np
import os
import json
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

INPUT_FILE = "../../data/synthetic/payment_recovery_dataset.csv"

MODEL_DIR = "../models"

LOGISTIC_MODEL_FILE = os.path.join(
    MODEL_DIR,
    "logistic_recovery_model.pkl"
)

RF_MODEL_FILE = os.path.join(
    MODEL_DIR,
    "random_forest_recovery_model.pkl"
)

BEST_MODEL_FILE = os.path.join(
    MODEL_DIR,
    "recovery_model.pkl"
)

METRICS_FILE = os.path.join(
    MODEL_DIR,
    "model_metrics.json"
)

print("=" * 60)
print("RECOVERAI - ML MODEL TRAINING")
print("=" * 60)

print("\nLoading payment recovery dataset...")

df = pd.read_csv(INPUT_FILE)

print("Dataset loaded.")
print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\nDataset columns:")

for column in df.columns:
    print("-", column)


print("\nRecovery distribution:")

print(
    df["recovered"].value_counts()
)


print("\nRecovery percentage:")

print(
    df["recovered"].value_counts(
        normalize=True
    ) * 100
)


TARGET = "recovered"

y = df[TARGET]

# These fields should NOT be used as model inputs.
#
# recovery_probability:
# This was used while generating the synthetic outcome.
#
# recovery_action:
# This is a decision made after prediction.
#
# recovery_time_minutes:
# This is known only after recovery happens.
#
# transaction_id:
# Unique identifier, not useful for prediction.
#
# customer_id:
# Identifier rather than predictive feature.

DROP_COLUMNS = [
    "recovered",
    "recovery_probability",
    "recovery_action",
    "recovery_time_minutes",
    "transaction_id",
    "customer_id"
]


X = df.drop(
    columns=DROP_COLUMNS
)

categorical_features = [
    "currency",
    "payment_method",
    "failure_reason",
    "subscription_status",
    "device_type",
    "country"
]


numerical_features = [
    column
    for column in X.columns
    if column not in categorical_features
]


print("\nNumerical features:")

for column in numerical_features:
    print("-", column)


print("\nCategorical features:")

for column in categorical_features:
    print("-", column)

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        ),
        (
            "scaler",
            StandardScaler()
        )
    ]
)

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            numerical_features
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features
        )
    ]
)


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTrain samples:", len(X_train))
print("Test samples:", len(X_test))

print("\n" + "=" * 60)
print("TRAINING LOGISTIC REGRESSION")
print("=" * 60)


logistic_model = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        )
    ]
)

logistic_model.fit(
    X_train,
    y_train
)

logistic_predictions = logistic_model.predict(
    X_test
)

logistic_probabilities = logistic_model.predict_proba(
    X_test
)[:, 1]

logistic_metrics = {
    "accuracy": accuracy_score(
        y_test,
        logistic_predictions
    ),

    "precision": precision_score(
        y_test,
        logistic_predictions,
        zero_division=0
    ),

    "recall": recall_score(
        y_test,
        logistic_predictions,
        zero_division=0
    ),

    "f1": f1_score(
        y_test,
        logistic_predictions,
        zero_division=0
    ),

    "roc_auc": roc_auc_score(
        y_test,
        logistic_probabilities
    )
}

print("\nLogistic Regression metrics:")

for metric, value in logistic_metrics.items():

    print(
        f"{metric}: {value:.4f}"
    )


print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        logistic_predictions
    )
)

print("\n" + "=" * 60)
print("TRAINING RANDOM FOREST")
print("=" * 60)


random_forest_model = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=300,
                max_depth=12,
                min_samples_split=5,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1
            )
        )
    ]
)


random_forest_model.fit(
    X_train,
    y_train
)

rf_predictions = random_forest_model.predict(
    X_test
)

rf_probabilities = random_forest_model.predict_proba(
    X_test
)[:, 1]

rf_metrics = {
    "accuracy": accuracy_score(
        y_test,
        rf_predictions
    ),

    "precision": precision_score(
        y_test,
        rf_predictions,
        zero_division=0
    ),

    "recall": recall_score(
        y_test,
        rf_predictions,
        zero_division=0
    ),

    "f1": f1_score(
        y_test,
        rf_predictions,
        zero_division=0
    ),

    "roc_auc": roc_auc_score(
        y_test,
        rf_probabilities
    )
}

print("\nRandom Forest metrics:")

for metric, value in rf_metrics.items():

    print(
        f"{metric}: {value:.4f}"
    )


print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        rf_predictions
    )
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


joblib.dump(
    logistic_model,
    LOGISTIC_MODEL_FILE
)


joblib.dump(
    random_forest_model,
    RF_MODEL_FILE
)

if rf_metrics["roc_auc"] >= logistic_metrics["roc_auc"]:

    best_model = random_forest_model
    best_model_name = "Random Forest"
    best_metrics = rf_metrics

else:

    best_model = logistic_model
    best_model_name = "Logistic Regression"
    best_metrics = logistic_metrics


joblib.dump(
    best_model,
    BEST_MODEL_FILE
)

metrics = {

    "best_model": best_model_name,

    "logistic_regression": {
        key: round(value, 4)
        for key, value in logistic_metrics.items()
    },

    "random_forest": {
        key: round(value, 4)
        for key, value in rf_metrics.items()
    },

    "test_samples": len(X_test),

    "train_samples": len(X_train)
}


with open(
    METRICS_FILE,
    "w"
) as file:

    json.dump(
        metrics,
        file,
        indent=4
    )


print("\n" + "=" * 60)
print("MODEL TRAINING COMPLETE")
print("=" * 60)

print(
    "\nBest model:",
    best_model_name
)

print("\nBest model metrics:")

for metric, value in best_metrics.items():

    print(
        f"{metric}: {value:.4f}"
    )


print("\nSaved models:")

print(
    LOGISTIC_MODEL_FILE
)

print(
    RF_MODEL_FILE
)

print(
    BEST_MODEL_FILE
)

print(
    METRICS_FILE
)

print("\nTraining completed successfully!")