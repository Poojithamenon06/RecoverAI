require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");

const recoveryRoutes =
    require("./routes/recoveryRoutes");

const razorpayWebhook =
    require("./routes/razorpayWebhook");
const webhookEventsRoutes = require("./routes/webhookEvents");

const dashboardRoutes =
    require("./routes/dashboardRoutes");

const customerRoutes =
    require("./routes/customerRoutes");
const app = express();

connectDB();


// Security
app.use(helmet());

app.use(cors());

// Razorpay webhook must receive RAW body
// before express.json()
app.use(
    "/api/webhooks/razorpay",
    express.raw({
        type: "application/json"
    }),
    razorpayWebhook
);

app.use("/api/webhooks", webhookEventsRoutes);
app.get("/test-webhook-route", (req, res) => {
    res.json({
        success: true,
        message: "Webhook routes are loaded"
    });
});
// Normal JSON requests
app.use(express.json());

app.use(morgan("dev"));


// Recovery routes
app.use(
    "/api/recovery",
    recoveryRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);
app.use(
    "/api/customers",
    customerRoutes
);
// Health check
app.get("/", (req, res) => {

    res.json({

        service:
            "RecoverAI Backend",

        status:
            "online"

    });

});


const PORT =
    process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(
        `RecoverAI Backend running on port ${PORT}`
    );

});