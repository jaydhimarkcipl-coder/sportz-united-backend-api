const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Exposes { id, type } to request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // If token is present but invalid, we still treat them as a guest or let them through
        // Depending on requirements, we might want to log this but not block.
        next();
    }
};

module.exports = { verifyToken, optionalVerifyToken };
