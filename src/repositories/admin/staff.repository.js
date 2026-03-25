const { User, sequelize } = require('../../models');
const { Op } = require('sequelize');

class AdminStaffRepository {
    async createStaff(data) {
        return await User.create(data);
    }

    async findStaffByOwnerId(ownerId, arenaIds = null) {
        const where = {
            UserType: { [Op.ne]: 'super_admin' }
        };
        if (arenaIds && ownerId) {
            where[Op.or] = [
                { ArenaId: arenaIds },
                { CreatedBy: ownerId }
            ];
        } else if (arenaIds) {
            where.ArenaId = arenaIds;
        } else if (ownerId) {
            where.CreatedBy = ownerId;
        }
        return await User.findAll({ where });
    }

    async findStaffByIdAndOwner(staffId, ownerId, arenaIds = null) {
        const where = { 
            UserId: staffId,
            UserType: { [Op.ne]: 'super_admin' }
        };
        if (arenaIds && ownerId) {
            where[Op.or] = [
                { ArenaId: arenaIds },
                { CreatedBy: ownerId }
            ];
        } else if (arenaIds) {
            where.ArenaId = arenaIds;
        } else if (ownerId) {
            where.CreatedBy = ownerId;
        }
        return await User.findOne({ where });
    }

    async updateStaff(staffId, ownerId, data) {
        return await User.update(data, {
            where: { UserId: staffId, CreatedBy: ownerId }
        });
    }

    async terminateStaff(staffId, ownerId) {
        return await User.update({ IsActive: false }, {
            where: { UserId: staffId, CreatedBy: ownerId }
        });
    }
}

module.exports = new AdminStaffRepository();
