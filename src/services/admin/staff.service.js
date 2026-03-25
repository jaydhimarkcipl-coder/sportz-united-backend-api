const adminStaffRepo = require('../../repositories/admin/staff.repository');
const bcrypt = require('bcrypt');

class AdminStaffService {
    async createStaff(data, currentUserId) {
        // Hash password if provided, otherwise set default or throw
        let hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : '';

        const staffData = {
            FullName: data.fullName,
            Email: data.email,
            PasswordHash: hashedPassword,
            UserType: data.role, // receptionist, cashier, coach
            ArenaId: data.arenaId,
            IsActive: true,
            CreatedBy: currentUserId
        };

        return await adminStaffRepo.createStaff(staffData);
    }

    async getStaff(currentUserId, role, arenaIds = null) {
        const filterId = role === 'super_admin' ? null : currentUserId;
        const filterArenaIds = role === 'super_admin' ? null : arenaIds;
        return await adminStaffRepo.findStaffByOwnerId(filterId, filterArenaIds);
    }

    async getStaffById(staffId, currentUserId, role, arenaIds = null) {
        const filterId = role === 'super_admin' ? null : currentUserId;
        const filterArenaIds = role === 'super_admin' ? null : arenaIds;
        const staff = await adminStaffRepo.findStaffByIdAndOwner(staffId, filterId, filterArenaIds);
        if (!staff) {
            throw { statusCode: 404, message: 'Staff member not found or access denied' };
        }
        return staff;
    }

    async updateStaff(staffId, data, currentUserId) {
        const staff = await adminStaffRepo.findStaffByIdAndOwner(staffId, currentUserId);
        if (!staff) {
            throw { statusCode: 404, message: 'Staff member not found or access denied' };
        }

        const updateData = {};
        if (data.fullName) updateData.FullName = data.fullName;
        if (data.email) updateData.Email = data.email;
        if (data.role) updateData.UserType = data.role;
        if (typeof data.isActive === 'boolean') updateData.IsActive = data.isActive;

        await adminStaffRepo.updateStaff(staffId, currentUserId, updateData);
        return { message: 'Staff updated successfully' };
    }

    async deleteStaff(staffId, currentUserId) {
        const staff = await adminStaffRepo.findStaffByIdAndOwner(staffId, currentUserId);
        if (!staff) {
            throw { statusCode: 404, message: 'Staff member not found or access denied' };
        }

        await adminStaffRepo.terminateStaff(staffId, currentUserId);
        return { message: 'Staff deactivated successfully' };
    }
}

module.exports = new AdminStaffService();
