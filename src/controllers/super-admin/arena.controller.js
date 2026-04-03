const superArenaService = require('../../services/super-admin/arena.service');
const { saveBase64Image, isBase64Image } = require('../../utils/file.util');

// Map camelCase JSON to PascalCase Database fields
const mapToPascal = (data) => {
    const mapping = {
        name: 'Name',
        city: 'City',
        state: 'State',
        email: 'Email',
        phone: 'Phone',
        ownerUserId: 'OwnerUserId',
        latitude: 'Latitude',
        longitude: 'Longitude',
        openTime: 'OpenTime',
        closeTime: 'CloseTime',
        isActive: 'IsActive',
        logoUrl: 'LogoUrl',
        addressLine1: 'AddressLine1',
        addressLine2: 'AddressLine2',
        pinCode: 'PinCode'
    };
    const mapped = {};
    Object.keys(data).forEach(key => {
        const pascalKey = mapping[key] || key;
        mapped[pascalKey] = data[key];
    });
    return mapped;
};

class SuperArenaController {
    async create(req, res, next) {
        try {
            const arenaData = mapToPascal({
                ...req.body,
                ownerUserId: req.body.ownerUserId || req.user.id
            });

            // Handle Logo Upload (Base64 or Multer)
            if (isBase64Image(req.body.logo)) {
                arenaData.LogoUrl = saveBase64Image(req.body.logo, 'arena');
            } else if (req.file) {
                arenaData.LogoUrl = `uploads/${req.file.filename}`;
            }

            const result = await superArenaService.createArena(arenaData);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await superArenaService.getAllArenas();
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const result = await superArenaService.getArenaById(req.params.id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const arenaData = mapToPascal({ ...req.body });

            // Handle Logo Upload (Base64 or Multer)
            if (isBase64Image(req.body.logo)) {
                arenaData.LogoUrl = saveBase64Image(req.body.logo, 'arena');
            } else if (req.file) {
                arenaData.LogoUrl = `uploads/${req.file.filename}`;
            }

            const result = await superArenaService.updateArena(req.params.id, arenaData);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const result = await superArenaService.deleteArena(req.params.id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SuperArenaController();
