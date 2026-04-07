const superUserService = require('../../services/super-admin/user.service');
const { saveBase64Image, isBase64Image } = require('../../utils/file.util');

// Map camelCase JSON to PascalCase Database fields
const mapToPascal = (data) => {
    const mapping = {
        fullName: 'FullName',
        email: 'Email',
        password: 'PasswordHash',
        roleId: 'RoleId',
        isActive: 'IsActive',
        userType: 'UserType',
        arenaId: 'ArenaId',
        profilePhotoUrl: 'ProfilePhotoUrl',
        isVerified: 'IsVerified',
        phone: 'Phone',
        dateOfBirth: 'DateOfBirth',
        gender: 'Gender',
        city: 'City',
        address: 'Address'
    };
    const mapped = {};
    Object.keys(data).forEach(key => {
        if (key === 'image') return; // Skip temporary fields
        const pascalKey = mapping[key] || key;
        mapped[pascalKey] = data[key];
    });
    return mapped;
};

class SuperUserController {
    async getAll(req, res, next) {
        try {
            const filters = {
                userType: req.query.userType,
                isActive: req.query.isActive,
                search: req.query.search
            };
            const users = await superUserService.getAllUsers(filters);
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const user = await superUserService.getUserById(req.params.id, req.query.userType || 'User');
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const userData = mapToPascal({ ...req.body });

            // Handle Profile Photo Upload (Base64 or Multer)
            // Field name is 'image' in routes
            if (isBase64Image(req.body.image)) {
                userData.ProfilePhotoUrl = saveBase64Image(req.body.image, 'avatar');
            } else if (req.file) {
                userData.ProfilePhotoUrl = `uploads/${req.file.filename}`;
            }

            const result = await superUserService.createUser(userData);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const userData = mapToPascal({ ...req.body });

            // Handle Profile Photo Upload (Base64 or Multer)
            // Field name is 'image' in routes
            if (isBase64Image(req.body.image)) {
                userData.ProfilePhotoUrl = saveBase64Image(req.body.image, 'avatar');
            } else if (req.file) {
                userData.ProfilePhotoUrl = `uploads/${req.file.filename}`;
            }

            const result = await superUserService.updateUser(req.params.id, userData, req.query.userType || 'User');
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const result = await superUserService.deleteUser(req.params.id, req.query.userType || 'User');
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async hardDelete(req, res, next) {
        try {
            const { id } = req.params;
            const result = await superUserService.hardDeletePlayer(id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SuperUserController();
