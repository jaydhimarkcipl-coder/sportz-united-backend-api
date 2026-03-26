const arenaAmenityService = require('../../services/admin/arena-amenity.service');

class ArenaAmenityController {
    async add(req, res, next) {
        try {
            const { arenaId } = req.params;
            const { amenityId } = req.body;
            const result = await arenaAmenityService.addAmenity(arenaId, amenityId);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async remove(req, res, next) {
        try {
            const { arenaId, amenityId } = req.params;
            await arenaAmenityService.removeAmenity(arenaId, amenityId);
            res.json({ success: true, message: 'Amenity unlinked successfully' });
        } catch (error) {
            next(error);
        }
    }

    async getArenaAmenities(req, res, next) {
        try {
            const { arenaId } = req.params;
            const amenities = await arenaAmenityService.getArenaAmenities(arenaId);
            res.json({ success: true, data: amenities });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ArenaAmenityController();
