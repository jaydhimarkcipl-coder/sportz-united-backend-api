const axios = require('axios');
const { WhatsAppLog } = require('../models');

/**
 * Sends a WhatsApp message using 11Za API and logs it to the database
 * @param {string} phone - Recipient phone number with country code (e.g. 919876543210)
 * @param {string} templateName - Name of the WhatsApp template
 * @param {Array<string>} data - List of variable values for the template
 * @returns {Promise<any>} - API response
 */
const sendWhatsAppMessage = async (phone, templateName, data) => {
    let logEntry;
    try {
        const payload = {
            authToken: process.env.ZA_AUTH_TOKEN,
            name: "Sportz United",
            sendto: phone,
            originWebsite: process.env.ZA_ORIGIN_WEBSITE,
            templateName: templateName,
            language: process.env.ZA_LANGUAGE || "en",
            data: data,
            isTinyURL: "Yes",
            myfile: ""
        };

        const response = await axios.post(process.env.ZA_BASE_URL, payload);
        
        // Log Success
        await WhatsAppLog.create({
            Phone: phone,
            TemplateName: templateName,
            Data: JSON.stringify(data),
            Response: JSON.stringify(response.data),
            Status: 'Success'
        });

        console.log(`WhatsApp sent to ${phone}:`, response.data);
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data || error.message;
        console.error(`Error sending WhatsApp to ${phone}:`, errorMsg);
        
        // Log Error
        try {
            await WhatsAppLog.create({
                Phone: phone,
                TemplateName: templateName,
                Data: JSON.stringify(data),
                Response: JSON.stringify(errorMsg),
                Status: 'Error'
            });
        } catch (dbError) {
            console.error('Failed to save WhatsApp error log to DB:', dbError.message);
        }

        return null;
    }
};

module.exports = { sendWhatsAppMessage };
