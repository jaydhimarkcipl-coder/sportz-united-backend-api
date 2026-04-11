const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// The filename provided by the user
const serviceAccountFile = 'sportz-united-firebase-adminsdk-fbsvc-85571969f6.json';
const serviceAccountPath = path.join(__dirname, '../../' + serviceAccountFile);

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully');
    } else {
        console.warn(`Firebase service account file not found at ${serviceAccountPath}. Push notifications will not be sent.`);
    }
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
}

module.exports = admin;
