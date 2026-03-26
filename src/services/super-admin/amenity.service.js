const amenityRepository = require('../../repositories/super-admin/amenity.repository');

class AmenityService {
    async createAmenity(data) {
        return await amenityRepository.create(data);
    }

    async getAllAmenities() {
        return await amenityRepository.findAll();
    }

    async getAmenityById(id) {
        const amenity = await amenityRepository.findById(id);
        if (!amenity) {
            throw new Error('Amenity not found');
        }
        return amenity;
    }

    async updateAmenity(id, data) {
        const amenity = await amenityRepository.update(id, data);
        if (!amenity) {
            throw new Error('Amenity not found or could not be updated');
        }
        return amenity;
    }

    async deleteAmenity(id) {
        const result = await amenityRepository.delete(id);
        if (!result) {
            throw new Error('Amenity not found or could not be deleted');
        }
        return result;
    }
}

module.exports = new AmenityService();
