const axios = require("axios");

const predictRecovery = async (paymentData) => {

    try {

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/predict`,
            paymentData
        );

        return response.data;

    } catch (error) {

        console.error(
            "ML Service Error:",
            error.response?.data || error.message
        );

        throw new Error(
            "Unable to get recovery prediction"
        );
    }
};


module.exports = {
    predictRecovery
};