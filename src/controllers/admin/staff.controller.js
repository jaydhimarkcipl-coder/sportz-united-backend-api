const adminStaffService = require('../../services/admin/staff.service');

class AdminStaffController {
    async create(req, res, next) {
        try {
            // Determine ArenaId: 
            // 1. From body (if super_admin)
            // 2. From ownedArenaIds (if owner and body is empty)
            let arenaId = req.body.arenaId;
            if (!arenaId && req.ownedArenaIds && req.ownedArenaIds.length > 0) {
                arenaId = req.ownedArenaIds[0]; // Default to first owned arena
            }

            const result = await adminStaffService.createStaff({ ...req.body, arenaId }, req.user.id);
            const data = result.toJSON();
            delete data.PasswordHash;
            // Access control: only super_admin can see plain-text password
            if (req.user.role !== 'super_admin') {
                delete data.PlainTextPassword;
            }
            data.role = data.UserType; // Map UserType to role as requested
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await adminStaffService.getStaff(req.user.id, req.user.role, req.ownedArenaIds);
            const data = result.map(u => {
                const uData = u.toJSON();
                delete uData.PasswordHash;
                // Access control: only super_admin can see plain-text password
                if (req.user.role !== 'super_admin') {
                    delete uData.PlainTextPassword;
                }
                uData.role = uData.UserType;
                return uData;
            });
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const result = await adminStaffService.getStaffById(req.params.id, req.user.id, req.user.role, req.ownedArenaIds);
            const data = result.toJSON();
            delete data.PasswordHash;
            // Access control: only super_admin can see plain-text password
            if (req.user.role !== 'super_admin') {
                delete data.PlainTextPassword;
            }
            data.role = data.UserType;
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const result = await adminStaffService.updateStaff(req.params.id, req.body, req.user.id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const result = await adminStaffService.deleteStaff(req.params.id, req.user.id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminStaffController();
