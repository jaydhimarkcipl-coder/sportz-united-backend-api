/**
 * Middleware to restrict access to specific roles.
 * Expects auth middleware to have already verified token
 * and attached `req.user` with `req.user.role`.
 */
const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: insufficient permissions' 
            });
        }
        
        next();
    };
};

module.exports = allowRoles;
