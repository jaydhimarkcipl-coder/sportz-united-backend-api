const { Amenity } = require('../../models');

class AmenityRepository {
    async create(data) {
        return await Amenity.create(data);
    }

    async findAll() {
        return await Amenity.findAll({
            where: { isDelete: false },
            order: [['name', 'ASC']]
        });
    }

    async findById(id) {
        return await Amenity.findOne({
            where: { amenityId: id, isDelete: false }
        });
    }

    async update(id, data) {
        const amenity = await this.findById(id);
        if (!amenity) return null;
        return await amenity.update(data);
    }

    async delete(id) {
        const amenity = await this.findById(id);
        if (!amenity) return null;
        // Soft delete
        return await amenity.update({ isDelete: true, isActive: false });
    }
}

module.exports = new AmenityRepository();
