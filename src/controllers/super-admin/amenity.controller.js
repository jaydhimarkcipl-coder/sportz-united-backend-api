const amenityService = require('../../services/super-admin/amenity.service');

class AmenityController {
    async create(req, res, next) {
        try {
            const amenity = await amenityService.createAmenity(req.body);
            res.status(201).json({ success: true, data: amenity });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const amenities = await amenityService.getAllAmenities();
            res.json({ success: true, data: amenities });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const amenity = await amenityService.getAmenityById(req.params.id);
            res.json({ success: true, data: amenity });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const amenity = await amenityService.updateAmenity(req.params.id, req.body);
            res.json({ success: true, data: amenity });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await amenityService.deleteAmenity(req.params.id);
            res.json({ success: true, message: 'Amenity deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AmenityController();
