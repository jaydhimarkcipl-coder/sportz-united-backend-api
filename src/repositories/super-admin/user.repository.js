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
}

module.exports = new SuperUserRepository();
