import pandas as pd
import os

INPUT_FILE = "../data/raw/Online Retail.xlsx"
OUTPUT_FILE = "../data/processed/customer_features.csv"

print("Loading Online Retail dataset...")

df = pd.read_excel(INPUT_FILE)

print("Dataset loaded successfully!")
print("Rows:", len(df))
print("Columns:", list(df.columns))

print("\nCleaning data...")


df = df.dropna(subset=["CustomerID"])
df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]
df = df[df["Quantity"] > 0]
df = df[df["UnitPrice"] > 0]
df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])

df["TotalAmount"] = df["Quantity"] * df["UnitPrice"]


print("Creating customer features...")

customer_features = df.groupby("CustomerID").agg(
    total_transactions=("InvoiceNo", "nunique"),
    total_items=("Quantity", "sum"),
    total_spend=("TotalAmount", "sum"),
    average_order_value=("TotalAmount", "mean"),
    first_purchase=("InvoiceDate", "min"),
    last_purchase=("InvoiceDate", "max")
).reset_index()


reference_date = df["InvoiceDate"].max()

customer_features["days_since_last_purchase"] = (
    reference_date -
    customer_features["last_purchase"]
).dt.days


customer_features["customer_lifetime_days"] = (
    customer_features["last_purchase"] -
    customer_features["first_purchase"]
).dt.days


customer_features["customer_lifetime_days"] = (
    customer_features["customer_lifetime_days"].clip(lower=1)
)


customer_features["purchase_frequency"] = (
    customer_features["total_transactions"] /
    customer_features["customer_lifetime_days"]
)


customer_features["customer_value"] = (
    customer_features["total_spend"] *
    customer_features["purchase_frequency"]
)


os.makedirs("../data/processed", exist_ok=True)

customer_features.to_csv(
    OUTPUT_FILE,
    index=False
)


print("\nCustomer feature generation completed!")

print(
    "Number of customers:",
    len(customer_features)
)

print("\nGenerated columns:")

for column in customer_features.columns:
    print("-", column)

print("\nSample customers:")

print(customer_features.head())

print("\nSaved to:")
print(OUTPUT_FILE)