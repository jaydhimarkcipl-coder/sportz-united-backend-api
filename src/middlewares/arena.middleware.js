const { Arena } = require('../models');

/**
 * Middleware to enforce Arena Ownership.
 * Automatically appends the owner filter if the user is an `arena_owner`.
 * For `super_admin`, skips filtering allowing full access.
 */
const requireArenaOwnership = async (req, res, next) => {
    try {
        if (req.user.role === 'super_admin') {
            req.ownedArenaIds = null; 
            return next(); // Super admins can access everything
        }

        // Must be arena_owner at this point (assuming `allowRoles` ran before)
        const ownerUserId = req.user.id;
        
        // Find arenas owned by this user
        const arenas = await Arena.findAll({ where: { OwnerUserId: ownerUserId } });
        
        if (!arenas || arenas.length === 0) {
            return res.status(403).json({ success: false, message: 'No arenas found for this owner.' });
        }
        
        // Store owned arenas in request context for downstream query filtering
        req.ownedArenaIds = arenas.map(a => a.ArenaId);
        
        next();
    } catch (e) {
        next(e);
    }
};

module.exports = requireArenaOwnership;
