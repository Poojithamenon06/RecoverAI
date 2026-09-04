# RecoverAI — Intelligent Revenue Recovery Agent

> **AI-powered payment recovery that predicts recoverability, diagnoses payment failures, applies safety policies, executes permitted recovery actions, and verifies successful recovery through Razorpay webhooks.**

---

## 🚀 Overview

Payment failures create direct revenue leakage for businesses.

**RecoverAI** is an intelligent revenue recovery system designed to identify failed or at-risk payments, understand why they failed, predict the probability of successful recovery, recommend an appropriate recovery action, and execute that action within deterministic safety boundaries.

The system combines:

- 🤖 Machine Learning for recovery prediction
- 🧠 AI-driven payment-failure diagnosis
- 🛡️ Deterministic policy and safety controls
- 💳 Razorpay Test Mode integration
- 🔔 Razorpay webhook processing
- 🗄️ MongoDB persistence
- 📊 React monitoring dashboard
- 🧾 Complete recovery and audit trail

The core principle of RecoverAI is:

> **AI recommends. Policy controls. Systems execute. Webhooks verify. Data records.**

Built for the **Razorpay AI Buildathon 2026 — Track 3: AI Revenue Recovery**.

---

## 🎯 Problem Statement

Payment failures can occur due to several reasons, including:

- Network errors
- Bank timeouts
- Incorrect OTP
- Expired cards
- Insufficient funds
- Issuer declines
- Other transaction-related failures

A simple payment-failure system can identify that a payment failed, but it does not answer the more important questions:

1. **Is this payment worth recovering?**
2. **What caused the failure?**
3. **What recovery action should be attempted?**
4. **Should the system be allowed to perform that action automatically?**
5. **Did the recovery actually succeed?**
6. **How much revenue was recovered?**

RecoverAI addresses this entire workflow instead of stopping at prediction.

---

## 💡 Solution

RecoverAI treats every failed payment as a **recovery case**.

```text
Failed Payment
      ↓
Customer + Transaction Context
      ↓
ML Recovery Prediction
      ↓
AI Diagnosis
      ↓
Recovery Action Recommendation
      ↓
Policy / Safety Validation
      ↓
Permitted Action
      ↓
Razorpay Payment Link / Recovery Action
      ↓
Razorpay Webhook
      ↓
Signature Verification
      ↓
Recovery Case Updated
      ↓
MongoDB + Audit Log
      ↓
Dashboard Analytics
```

This creates an end-to-end recovery lifecycle rather than an isolated ML prediction.

---

## ✨ Key Features

### 🤖 1. Recovery Probability Prediction

A trained machine-learning model estimates whether a failed payment is recoverable.

```json
{
  "recoveryProbability": 0.8736,
  "recoveryPrediction": "recoverable"
}
```

### 🧠 2. Payment Failure Diagnosis

Converts the payment failure information into a human-readable diagnosis, e.g. `Payment failure caused by network_error`.

### 🎯 3. Intelligent Recovery Actions

RecoverAI can recommend different recovery strategies:

```text
retry | payment_link | reminder | escalate
```

The recommended action depends on the recovery probability and payment-failure context.

### 🛡️ 4. Deterministic Policy & Safety Engine

AI recommendations are **not executed blindly**. A deterministic policy layer sits between the AI recommendation and the actual action.

| Policy                       |                                   Value |
| ----------------------------- | ---------------------------------------: |
| Maximum attempts              |                                        3 |
| High-value threshold          |                                  ₹50,000 |
| Minimum recovery probability  |                                     0.45 |
| Allowed actions                | retry, payment_link, reminder, escalate |

The policy engine also handles already-recovered cases, stale recovery cases, invalid actions, high-value transactions, low-probability recoveries, and attempt limits.

**Example — allowed recovery:** a ₹15,000 `network_error` case with high recovery probability → `payment_link` recommended → policy **ALLOW** → Razorpay Payment Link created.

**Example — high-value escalation:** a ₹75,000 case exceeds the high-value threshold, so even a high-probability `payment_link` recommendation is routed to policy **ESCALATE** rather than executed automatically.

### 💳 5. Razorpay Integration

Integrates with **Razorpay Test Mode** to execute recovery actions, creating a Payment Link when the policy engine allows it.

### 🔔 6. Razorpay Webhook Integration

Receives Razorpay webhook events at `POST /api/webhooks/razorpay`. The primary event currently processed is `payment_link.paid`.

The webhook handler:

1. Receives the raw Razorpay request body
2. Reads the Razorpay signature
3. Verifies the signature using HMAC SHA-256
4. Parses the event payload
5. Identifies the Payment Link
6. Finds the corresponding RecoverAI recovery case
7. Prevents duplicate recovery processing
8. Updates the recovery case
9. Stores payment information
10. Creates an audit log
11. Persists the webhook event
12. Updates the dashboard

### 🔐 7. Webhook Security

Requests are verified using **HMAC SHA-256** against a webhook secret stored in the backend environment configuration.

> **Never commit your actual Razorpay secret, webhook secret, or MongoDB credentials to GitHub.**

### 🧾 8. Persistent Webhook Event History

Webhook events are stored in MongoDB (`WebhookEvent` model) and retrievable via `GET /api/webhooks/events`, giving visibility into the external payment-event lifecycle.

### 📋 9. Audit Logging

An audit trail (e.g. `recovery_payment_received`) records case ID, Razorpay event ID, payment link ID, payment ID, order ID, amount, currency, payment method, system actor, and reason — making the process traceable end to end.

### 📊 10. Recovery Dashboard

A React dashboard providing:

- **Revenue metrics** — revenue at risk, recovered revenue, recovery rate, average recovery time
- **Recovery cases** — open, processing, recovered, failed, escalated, stopped
- **Customer analytics** — per-customer cases, revenue at risk/recovered, recovery rate, average probability, latest status
- **Webhook monitoring** — latest events, payment/link IDs, case association, signature verification, processing status
- **Policy monitoring** — policy decisions, allowed actions, escalations

---

## 🧠 Machine Learning Pipeline

### Data Sources

**UCI Online Retail Dataset** — used to derive customer-behavior features (`InvoiceNo`, `StockCode`, `Description`, `Quantity`, `InvoiceDate`, `UnitPrice`, `CustomerID`, `Country`), including transaction history and purchasing patterns.

**Synthetic Payment Recovery Dataset** — purpose-built for the recovery-prediction problem: **20,000 rows × 22 columns** spanning payment, customer, transaction, and recovery-related features.

### Features

Transaction amount · payment method · failure reason · attempt number · previous success/failure counts · average transaction amount · customer lifetime value · days since last purchase · purchase frequency · subscription status · device type · country · hour · day of week.

### Model Evaluation

Evaluated **Logistic Regression** and **Random Forest**; the deployed flow uses **Random Forest** based on stronger recorded performance:

| Metric    |      Score |
| --------- | ---------: |
| Accuracy  | **81.57%** |
| Precision | **91.33%** |
| Recall    | **85.46%** |
| F1 Score  | **88.30%** |
| ROC-AUC   | **83.38%** |

### ML Service

Exposed through a **FastAPI** service (`Python`, `FastAPI`, `scikit-learn`).

- Prediction endpoint: `POST /predict`
- API docs: `http://127.0.0.1:8000/docs`

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │  Razorpay Test Mode  │
                         └──────────┬───────────┘
                                    │
                                    │ Payment / Webhook
                                    ▼
                    ┌───────────────────────────────┐
                    │       Node.js + Express       │
                    │          Backend              │
                    └──────────────┬────────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
      Recovery APIs         Razorpay Webhook       Dashboard APIs
             │                     │                     │
             ▼                     ▼                     │
      ┌─────────────┐       ┌───────────────┐            │
      │ ML Service  │       │   Signature   │            │
      │   FastAPI   │       │ Verification  │            │
      └──────┬──────┘       └───────┬───────┘            │
             │                       │                    │
             ▼                       ▼                    │
      Recovery Model          Recovery Update            │
             │                       │                    │
             └───────────┬───────────┘                    │
                         ▼                                │
                  ┌───────────────┐                       │
                  │    MongoDB    │◄──────────────────────┘
                  │               │
                  │ RecoveryCases │
                  │ WebhookEvents │
                  │ AuditLogs     │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ React Frontend│
                  │   Dashboard   │
                  └───────────────┘
```

---

## 🔄 End-to-End Recovery Flow

```text
1. Failed / At-Risk Payment
2. Recovery Case Created
3. Customer + Transaction Context Collected
4. ML Recovery Probability Prediction
5. Payment Failure Diagnosis
6. Recovery Action Recommendation
7. Deterministic Policy Validation
8. Action Allowed / Escalated
9. Razorpay Payment Link Created
10. Customer Completes Test Payment
11. Razorpay payment_link.paid Event
12. Webhook Signature Verification
13. RecoveryCase Updated
14. WebhookEvent Persisted
15. AuditLog Created
16. Dashboard Updated
17. Recovered Revenue Recorded
```

---

## 🗄️ Database Design (MongoDB)

**Collections:** `recoverycases`, `webhookevents`, `auditlogs`

### RecoveryCase — business state of a recovery attempt
```text
caseId, transactionId, customerId, razorpayPaymentId, razorpayOrderId,
paymentLinkId, paymentLinkUrl, amount, currency, paymentMethod,
failureReason, attemptNumber, status, recoveryProbability,
recoveryPrediction, aiDiagnosis, recommendedAction, aiConfidence,
actionExecuted, recoveredAmount, recoveryTimeMinutes, attemptsMade,
lastActionAt
```
Possible statuses: `open`, `processing`, `recovered`, `failed`, `escalated`, `stopped`

### WebhookEvent — external Razorpay event history
```text
eventId, event, status, signatureVerified, caseId, transactionId,
customerId, paymentLinkId, paymentId, orderId, amount, currency,
message, receivedAt
```

### AuditLog — system decision and action history
```text
recovery_case_created
recovery_prediction_generated
recovery_action_recommended
recovery_payment_received
```

---

## 🔌 API Reference

**Health Check**
```http
GET /
```

**Recovery**
```http
POST /api/recovery/test      # Create / test a recovery case
GET  /api/recovery/cases     # List recovery cases
```

**Dashboard**
```http
GET /api/dashboard/stats
```
Returns total cases, revenue at risk/recovered, case counts by status, recovery rate, average recovery time/probability, action counts, and failure-reason counts.

**Customers**
```http
GET /api/customers
```
Returns per-customer recovery summaries: total cases, revenue at risk/recovered, case counts by status, recovery rate, average probability, and latest status/reason/action.

**Razorpay Webhook**
```http
POST /api/webhooks/razorpay   # Handles payment_link.paid
GET  /api/webhooks/events     # List persisted webhook events
```

---

## 📁 Project Structure

```text
recover-ai/
│
├── .gitignore
├── README.md
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   │   ├── RecoveryCase.js
│   │   ├── AuditLog.js
│   │   └── WebhookEvent.js
│   ├── routes/
│   │   ├── recoveryRoutes.js
│   │   ├── razorpayWebhook.js
│   │   ├── webhookEvents.js
│   │   ├── dashboardRoutes.js
│   │   └── customerRoutes.js
│   ├── services/
│   │   ├── mlService.js
│   │   ├── recoveryAgent.js
│   │   ├── policyEngine.js
│   │   └── razorpayService.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
└── ml-service/
    ├── app/
    │   └── predict.py
    ├── models/
    │   ├── logistic_recovery_model.pkl
    │   ├── random_forest_recovery_model.pkl
    │   ├── recovery_model.pkl
    │   └── model_metrics.json
    ├── .venv/
    └── ...
```

---

## ⚙️ Technology Stack

| Layer                 | Technology         |
| ---------------------- | ------------------- |
| Frontend               | React               |
| Backend                | Node.js             |
| API Framework          | Express.js          |
| ML API                 | FastAPI             |
| Programming Languages  | JavaScript, Python  |
| Machine Learning       | scikit-learn        |
| ML Model               | Random Forest       |
| Database               | MongoDB             |
| Payment Gateway        | Razorpay            |
| Payment Environment    | Razorpay Test Mode  |
| Webhooks               | Razorpay Webhooks   |
| Public Tunnel          | zrok                |
| API Testing            | Thunder Client      |
| Development            | VS Code             |

---

## 🛠️ Installation

### Prerequisites

- Node.js and npm
- Python
- MongoDB
- Razorpay Test Mode account
- zrok

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd recover-ai
```

### 2. Configure Backend Environment

Create `backend/.env`:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

ML_SERVICE_URL=http://127.0.0.1:8000
```

Create a matching `backend/.env.example` with the same keys but no real values, so other developers know what to configure. **Never commit the real `.env`.**

The root `.gitignore` should contain:

```gitignore
# Environment
.env
.env.*
!.env.example

# Node
node_modules/

# Python
.venv/
venv/
__pycache__/
*.pyc

# IDE
.idea/
.vscode/

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

### 3. Install and Start the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at `http://localhost:5000`. Verify with the health check:

```json
{
  "service": "RecoverAI Backend",
  "status": "online"
}
```

### 4. Start the ML Service

```bash
cd ml-service
# activate your virtual environment, e.g.:
# source .venv/bin/activate        (macOS/Linux)
# .venv\Scripts\Activate.ps1       (Windows)
cd app
uvicorn predict:app --reload --port 8000
```

ML service: `http://127.0.0.1:8000`
Swagger docs: `http://127.0.0.1:8000/docs`

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by the dev server.

---

## 🔔 Razorpay Webhook Setup

Razorpay needs to reach your locally running backend. With the backend running on `localhost:5000`, expose it publicly using zrok:

```bash
zrok share public 5000
```

zrok provides a public URL, e.g. `https://<generated-subdomain>.shares.zrok.io`.

Configure the Razorpay webhook URL as:

```text
https://<generated-subdomain>.shares.zrok.io/api/webhooks/razorpay
```

Enable the `payment_link.paid` event, and make sure the webhook secret configured in Razorpay matches `RAZORPAY_WEBHOOK_SECRET` in your `.env`.

> zrok public URLs can change when a new tunnel is created. If the URL changes, update the Razorpay webhook configuration accordingly.

---

## 🧪 Testing

RecoverAI has been tested end to end using Razorpay Test Mode.

### Scenario 1 — Successful Recovery

Input: ₹15,000, `netbanking`, `network_error`, attempt 1.

```text
Recovery Case Created → ML Prediction (High) → AI Diagnosis →
Recommended Action: payment_link → Policy Decision: ALLOW →
Razorpay Payment Link Created → Test Payment Completed →
payment_link.paid Webhook → Signature Verified →
RecoveryCase → recovered → Recovered Revenue: ₹15,000 → Dashboard Updated
```

The system recorded the payment ID, order ID, Payment Link ID, recovery case, webhook event, and audit event for this successful live Test Mode recovery.

### Scenario 2 — Policy Escalation

Input: ₹75,000, `network_error`, high recovery probability.

Even though the AI recommends `payment_link`, the policy engine flags the transaction as high-value (₹75,000 > ₹50,000 threshold) and routes it to **ESCALATE** instead of executing automatically.

---

## 📈 Example API Response

```json
{
  "caseId": "RC-XXXXXXXX",
  "recoveryProbability": 0.8736,
  "recoveryPrediction": "recoverable",
  "aiDiagnosis": "Payment failure caused by network_error",
  "recommendedAction": "payment_link",
  "policyDecision": "ALLOW"
}
```

Exact case IDs and probabilities vary between requests.

---

## 🔍 Observability

RecoverAI separates its important records into three concepts:

| Concept        | Represents                          |
| --------------- | ------------------------------------ |
| `RecoveryCase`  | Business state of the recovery       |
| `WebhookEvent`  | External Razorpay event history      |
| `AuditLog`      | System decision and action history   |

This makes it possible to trace a transaction all the way from **Payment → Recovery Case → ML Prediction → AI Recommendation → Policy Decision → Razorpay Action → Webhook → Recovery Result**.

---

## 🔐 Security

- Razorpay webhook signature verification (HMAC-SHA256)
- Secrets kept in environment variables, never in source
- `.gitignore` protection for `.env` and credentials
- Helmet middleware and CORS configuration
- Request validation / rate-limiting support
- Deterministic policy controls on all AI-recommended actions
- Duplicate recovery protection
- Full audit logging

**Never commit** `backend/.env` or any file containing `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, or `MONGO_URI`.

---

## 📦 Environment Variables

| Variable                  | Description                          |
| -------------------------- | -------------------------------------- |
| `PORT`                     | Backend server port                    |
| `MONGO_URI`                 | MongoDB connection string              |
| `RAZORPAY_KEY_ID`           | Razorpay Test Mode key ID              |
| `RAZORPAY_KEY_SECRET`       | Razorpay Test Mode key secret          |
| `RAZORPAY_WEBHOOK_SECRET`   | Razorpay webhook verification secret   |
| `ML_SERVICE_URL`            | URL of the FastAPI ML service          |

---

## 🚧 Future Enhancements

- **AI:** more advanced LLM-based failure explanations, personalized recovery strategies, learning from intervention outcomes
- **Payments:** additional payment providers, more recovery mechanisms, automated retry scheduling, method-specific strategies
- **Analytics:** recovery-strategy effectiveness, revenue recovered by failure reason, CLV impact, A/B testing, funnel analytics
- **Safety:** human approval workflows for high-value transactions, more granular policies, role-based authorization, advanced fraud/risk checks
- **Infrastructure:** message queues, background workers, real-time event streaming, distributed processing, production-grade monitoring, model drift detection

---

## 🏆 Why RecoverAI?

RecoverAI is designed as more than a payment-failure prediction model — it combines **prediction + reasoning + policy + action + verification + audit + analytics** into one workflow, demonstrating how AI can be integrated into a real business process while keeping automated actions bounded by deterministic safety rules.

```text
ML Model      → Predicts
AI Agent      → Recommends
Policy Engine → Controls
Backend       → Executes
Razorpay      → Processes
Webhook       → Verifies
MongoDB       → Records
Dashboard     → Visualizes
```

---

## 📌 Project Highlights

- ✅ End-to-end AI-powered revenue recovery
- ✅ Random Forest recovery model
- ✅ FastAPI ML inference service
- ✅ Node.js + Express backend
- ✅ MongoDB persistence
- ✅ Razorpay Test Mode integration with Payment Link creation
- ✅ `payment_link.paid` webhook integration with HMAC-SHA256 verification
- ✅ Deterministic policy/safety engine with high-value escalation
- ✅ Customer-level recovery analytics
- ✅ Persistent webhook event history and full audit trail
- ✅ React monitoring dashboard
- ✅ Successful live Test Mode recovery, reflected in the dashboard

---

## 🧪 Demo Flow

1. Create a recovery case
2. Show ML recovery probability
3. Show AI diagnosis
4. Show recommended recovery action
5. Show policy decision
6. Create Razorpay Payment Link
7. Complete Test Mode payment
8. Show Razorpay webhook event
9. Show webhook signature verification
10. Show MongoDB recovery record
11. Show audit log
12. Show recovered revenue on dashboard

---

## 📚 Documentation

For implementation details, refer to the official Razorpay documentation for the Razorpay API, Payment Links, Test Mode, Webhooks, and webhook signature validation.

---

## 👩‍💻 Project Information

**RecoverAI — Intelligent Revenue Recovery Agent**
An AI-powered revenue recovery system built for the **Razorpay AI Buildathon 2026 (Track 3 — AI Revenue Recovery)**.

**Core technologies:** React · Node.js · Express · Python · FastAPI · scikit-learn · MongoDB · Razorpay · zrok

