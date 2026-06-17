require('dotenv').config({ override: true });
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

const { startNotificationJobs } = require('./src/jobs/notification.job');

const startServer = async () => {
    // 1. Connect to database
    await connectDB();
    
    // 2. Start Cron Jobs
    startNotificationJobs();

    app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server is running on port ${PORT}`);
    });
};

startServer();
