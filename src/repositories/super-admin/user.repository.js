const { User, Arena } = require('../../models');
const { Op } = require('sequelize');

class SuperUserRepository {
    async findAllUsers(filters = {}) {
        const { User, Player, Arena } = require('../../models');

        // Handle Player Management (tblPlayer)
        if (filters.userType === 'Player') {
            const playerWhere = {};
            if (filters.isActive !== undefined) playerWhere.IsActive = filters.isActive === 'true';
            if (filters.search) {
                playerWhere[Op.or] = [
                    { FullName: { [Op.like]: `%${filters.search}%` } },
                    { Email: { [Op.like]: `%${filters.search}%` } },
                    { Phone: { [Op.like]: `%${filters.search}%` } }
                ];
            }

            const players = await Player.findAll({
                where: playerWhere,
                order: [['CreatedDate', 'DESC']]
            });

            // Map to look like User for frontend consistency
            return players.map(p => {
                const json = p.toJSON();
                return {
                    id: json.PlayerId,
                    fullName: json.FullName,
                    email: json.Email,
                    phone: json.Phone, // Specific to Player
                    userType: 'Player',
                    isActive: json.IsActive,
                    isVerified: json.IsVerified,
                    createdDate: json.CreatedDate,
                    profilePhotoUrl: json.ProfilePhotoUrl
                };
            });
        }

        // Handle Admin/Staff/Owner Management (tblUser)
        const where = {};

        if (filters.userType) {
            if (filters.userType === 'Admin') {
                where.UserType = 'arena_owner';
            } else if (filters.userType === 'Staff') {
                where.UserType = { [Op.in]: ['cashier', 'receptionist'] };
            } else {
                where.UserType = filters.userType;
            }
        }

        if (filters.isActive !== undefined) where.IsActive = filters.isActive === 'true';
        if (filters.search) {
            where[Op.or] = [
                { FullName: { [Op.like]: `%${filters.search}%` } },
                { Email: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        const users = await User.findAll({
            where,
            attributes: { exclude: ['PasswordHash', 'PasswordResetToken'] },
            include: [{ model: Arena, as: 'Arena', attributes: ['ArenaId', 'Name'], required: false }],
            order: [['CreatedDate', 'DESC']]
        });

        return users.map(u => {
            const json = u.toJSON();
            return {
                id: json.UserId,
                fullName: json.FullName,
                email: json.Email,
                userType: json.UserType,
                isActive: json.IsActive,
                roleId: json.RoleId,
                arenaId: json.ArenaId,
                arenaName: json.Arena ? json.Arena.Name : null,
                createdDate: json.CreatedDate,
                profilePhotoUrl: json.ProfilePhotoUrl
            };
        });
    }

    async findUserById(id, type = 'User') {
        const { User, Player, Arena } = require('../../models');

        if (type === 'Player') {
            const player = await Player.findByPk(id);
            if (!player) return null;
            const json = player.toJSON();
            return {
                id: json.PlayerId,
                fullName: json.FullName,
                email: json.Email,
                phone: json.Phone,
                userType: 'Player',
                isActive: json.IsActive,
                isVerified: json.IsVerified,
                createdDate: json.CreatedDate,
                profilePhotoUrl: json.ProfilePhotoUrl,
                city: json.City,
                address: json.Address,
                gender: json.Gender,
                dateOfBirth: json.DateOfBirth
            };
        }

        const user = await User.findByPk(id, {
            attributes: { exclude: ['PasswordHash', 'PasswordResetToken'] },
            include: [{ model: Arena, as: 'Arena', attributes: ['ArenaId', 'Name'], required: false }]
        });
        if (!user) return null;
        const json = user.toJSON();
        return {
            id: json.UserId,
            fullName: json.FullName,
            email: json.Email,
            userType: json.UserType,
            isActive: json.IsActive,
            roleId: json.RoleId,
            arenaId: json.ArenaId,
            arenaName: json.Arena ? json.Arena.Name : null,
            createdDate: json.CreatedDate,
            profilePhotoUrl: json.ProfilePhotoUrl
        };
    }

    async createUser(data) {
        return await User.create(data);
    }

    async updateUser(id, data, type = 'User') {
        const { User, Player } = require('../../models');
        const model = type === 'Player' ? Player : User;

        const record = await model.findByPk(id);
        if (!record) return null;

        await record.update(data);
        return await this.findUserById(id, type);
    }

    async deleteUser(id, type = 'User') {
        const { User, Player } = require('../../models');
        const model = type === 'Player' ? Player : User;

        const record = await model.findByPk(id);
        if (!record) return null;

        await record.update({ IsActive: false });
        return { message: `${type} deactivated successfully` };
    }

    async hardDeleteUser(id, type = 'User') {
        const { User, Player, Booking, BookingDetail, BookingPlayer, PlayerWallet, Transaction, sequelize } = require('../../models');
        const { Op } = require('sequelize');

        if (type !== 'Player') {
            throw { statusCode: 400, message: 'Hard delete is only supported for Players at this time.' };
        }

        const t = await sequelize.transaction();

        try {
            const player = await Player.findByPk(id);
            if (!player) {
                await t.rollback();
                return null;
            }

            // 1. Get all BookingIds for this player
            const bookings = await Booking.findAll({ where: { PlayerId: id } });
            const bookingIds = bookings.map(b => b.BookingId);

            // 2. Delete data related to bookings
            if (bookingIds.length > 0) {
                // Delete BookingDetails
                await BookingDetail.destroy({ where: { BookingId: { [Op.in]: bookingIds } }, transaction: t });
                // Delete BookingPlayers
                await BookingPlayer.destroy({ where: { BookingId: { [Op.in]: bookingIds } }, transaction: t });
                // Delete Transactions linked to these bookings
                await Transaction.destroy({ where: { BookingId: { [Op.in]: bookingIds } }, transaction: t });
                // Delete Bookings themselves
                await Booking.destroy({ where: { BookingId: { [Op.in]: bookingIds } }, transaction: t });
            }

            // 3. Delete records directly linked to PlayerId that might not be linked to bookings
            await BookingPlayer.destroy({ where: { PlayerId: id }, transaction: t });
            await Transaction.destroy({ where: { PlayerId: id }, transaction: t });
            await PlayerWallet.destroy({ where: { PlayerId: id }, transaction: t });

            // 4. Finally delete the Player
            await Player.destroy({ where: { PlayerId: id }, transaction: t });

            await t.commit();
            return { message: `Player ${id} and all associated data deleted permanently.` };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = new SuperUserRepository();
