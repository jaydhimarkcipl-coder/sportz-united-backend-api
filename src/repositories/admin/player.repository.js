const { Player, Booking, Court, PlayerWallet } = require('../../models');
const { Op, sequelize } = require('sequelize');

class AdminPlayerRepository {
    async findPlayersByArena(arenaIds) {
        // Fetch players who have booked at these arenas
        const bookingPlayers = await Player.findAll({
            attributes: ['PlayerId', 'FullName', 'Phone', 'Email', 'ProfilePhotoUrl', 'CreatedDate'],
            include: [{
                model: Booking,
                required: true,
                include: [{
                    model: Court,
                    where: { ArenaId: arenaIds },
                    attributes: []
                }],
                attributes: []
            }],
            group: ['Player.PlayerId', 'Player.FullName', 'Player.Phone', 'Player.Email', 'Player.ProfilePhotoUrl', 'Player.CreatedDate'],
            order: [['FullName', 'ASC']]
        });

        // Also fetch players who have arena-specific wallets for these arenas (even if no bookings yet)
        const walletPlayers = await Player.findAll({
            attributes: ['PlayerId', 'FullName', 'Phone', 'Email', 'ProfilePhotoUrl', 'CreatedDate'],
            include: [{
                model: PlayerWallet,
                required: true,
                where: { ArenaId: arenaIds },
                attributes: []
            }],
            group: ['Player.PlayerId', 'Player.FullName', 'Player.Phone', 'Player.Email', 'Player.ProfilePhotoUrl', 'Player.CreatedDate'],
            order: [['FullName', 'ASC']]
        });

        // Combine and unique by PlayerId
        const combined = [...bookingPlayers, ...walletPlayers];
        const uniquePlayers = Array.from(new Map(combined.map(p => [p.PlayerId, p])).values());

        return uniquePlayers;
    }

    async findAllPlayers(search) {
        const where = {};
        if (search) {
            where[Op.or] = [
                { FullName: { [Op.like]: `%${search}%` } },
                { Email: { [Op.like]: `%${search}%` } },
                { Phone: { [Op.like]: `%${search}%` } }
            ];
        }
        return await Player.findAll({
            where,
            attributes: ['PlayerId', 'FullName', 'Phone', 'Email', 'ProfilePhotoUrl', 'CreatedDate'],
            order: [['FullName', 'ASC']],
            limit: 100 // Protection for large datasets
        });
    }
}

module.exports = new AdminPlayerRepository();
