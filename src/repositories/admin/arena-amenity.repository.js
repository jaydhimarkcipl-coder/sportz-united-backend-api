const { ArenaAmenity, Amenity } = require('../../models');

class ArenaAmenityRepository {
    async addAmenityToArena(arenaId, amenityId) {
        // Check if already exists
        const existing = await ArenaAmenity.findOne({
            where: { arenaId: arenaId, amenityId: amenityId }
        });
        
        if (existing) {
            // If it exists but was inactive, reactivate it
            if (!existing.isActive) {
                return await existing.update({ isActive: true });
            }
            return existing;
        }

        return await ArenaAmenity.create({
            arenaId: arenaId,
            amenityId: amenityId,
            isActive: true
        });
    }

    async removeAmenityFromArena(arenaId, amenityId) {
        return await ArenaAmenity.update(
            { isActive: false },
            { where: { arenaId: arenaId, amenityId: amenityId } }
        );
    }

    async getArenaAmenities(arenaId) {
        return await ArenaAmenity.findAll({
            where: { arenaId: arenaId, isActive: true },
            include: [{ model: Amenity }]
        });
    }
}

module.exports = new ArenaAmenityRepository();
