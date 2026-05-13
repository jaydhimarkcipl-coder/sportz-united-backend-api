require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    // 1. Connect to database
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server is running on port ${PORT}`);
    });
};

startServer();
