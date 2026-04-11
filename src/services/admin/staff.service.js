const adminStaffRepo = require('../../repositories/admin/staff.repository');
const deviceRepo = require('../../repositories/user/device.repository');
const fcmUtil = require('../../utils/fcm.util');
const { Arena } = require('../../models');
const bcrypt = require('bcrypt');

class AdminStaffService {
    async createStaff(data, currentUserId) {
        // Hash password if provided, otherwise set default or throw
        let hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : '';

        const staffData = {
            FullName: data.fullName,
            Email: data.email,
            PasswordHash: hashedPassword,
            PlainTextPassword: data.password,
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
        
        // Handle password update
        if (data.password) {
            updateData.PasswordHash = await bcrypt.hash(data.password, 10);
            updateData.PlainTextPassword = data.password;
        }

        await adminStaffRepo.updateStaff(staffId, currentUserId, updateData);

        // --- Push Notifications ---
        try {
            if (typeof data.isActive === 'boolean') {
                const staffTokens = await deviceRepo.getTokensByUserId(staffId);
                if (staffTokens.length > 0) {
                    const arena = await Arena.findByPk(staff.ArenaId);
                    const status = data.isActive ? 'Activated' : 'Deactivated';
                    await fcmUtil.sendToMultipleDevices(staffTokens, {
                        title: 'Account Status Updated 🔐',
                        body: `Your staff account for ${arena ? arena.Name : 'the arena'} has been ${status}.`
                    });
                }
            }
        } catch (notifError) {
            console.error('--- PUSH NOTIFICATION ERROR (STAFF UPDATE) ---', notifError);
        }

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
