const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : null;

    if (!secret) {
        console.error('ERROR: JWT_SECRET is not defined in environment variables!');
        return res.status(500).json({ message: 'Internal server error: Auth configuration missing' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Exposes { id, type } to request
        next();
    } catch (error) {
        console.error('--- JWT VERIFICATION FAILURE ---');
        console.error('Error:', error.message);
        console.error('Token:', token.substring(0, 15) + '...');
        console.error('Using Secret:', secret.substring(0, 3) + '***' + secret.substring(secret.length - 3));
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

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
