const admin = require('../config/firebase');

/**
 * Send a push notification to a single FCM token
 * @param {string} token - The recipient's FCM token
 * @param {Object} payload - { title, body, data }
 */
const sendToDevice = async (token, { title, body, data = {} }) => {
    if (!admin.apps.length) return; // SDK not initialized

    const message = {
        notification: {
            title,
            body
        },
        data: data,
        token: token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
};

/**
 * Send a push notification to multiple FCM tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {Object} payload - { title, body, data }
 */
const sendToMultipleDevices = async (tokens, { title, body, data = {} }) => {
    if (!admin.apps.length || !tokens.length) return;

    const message = {
        notification: {
            title,
            body
        },
        data: data,
        tokens: tokens
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);
        return response;
    } catch (error) {
        console.error('Error sending multicast push notifications:', error);
        throw error;
    }
};

module.exports = {
    sendToDevice,
    sendToMultipleDevices
};
