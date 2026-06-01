const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    let token = authHeader.split(' ')[1];
    if (token === 'Bearer' && authHeader.split(' ').length > 2) {
        token = authHeader.split(' ').slice(2).join(' ');
    }
    if (token) {
        token = token.replace(/^["']|["']$/g, '').trim();
        if (token.toLowerCase().startsWith('bearer ')) {
            token = token.substring(7).trim();
        }
    }

    const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : null;

    if (!secret) {
        logger.error('ERROR: JWT_SECRET is not defined in environment variables!');
        return res.status(500).json({ message: 'Internal server error: Auth configuration missing' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Exposes { id, type } to request
        next();
    } catch (error) {
        logger.error('--- JWT VERIFICATION FAILURE ---');
        logger.error(`Error: ${error.message}`);
        logger.error(`Token: ${token ? token.substring(0, 15) : 'none'}...`);
        logger.error(`Using Secret: ${secret ? (secret.substring(0, 3) + '***' + secret.substring(secret.length - 3)) : 'none'}`);
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    let token = authHeader.split(' ')[1];
    if (token === 'Bearer' && authHeader.split(' ').length > 2) {
        token = authHeader.split(' ').slice(2).join(' ');
    }
    if (token) {
        token = token.replace(/^["']|["']$/g, '').trim();
        if (token.toLowerCase().startsWith('bearer ')) {
            token = token.substring(7).trim();
        }
    }

    const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : null;
    if (!secret) return next();

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        // If token is present but invalid, we still treat them as a guest or let them through
        // Depending on requirements, we might want to log this but not block.
        next();
    }
};

module.exports = { verifyToken, optionalVerifyToken };
