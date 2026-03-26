const arenaAmenityRepository = require('../../repositories/admin/arena-amenity.repository');
const Arena = require('../../models/Arena'); // For ownership check if needed

class ArenaAmenityService {
    async addAmenity(arenaId, amenityId) {
        // Business logic: potentially check if amenityId is a valid global amenity
        return await arenaAmenityRepository.addAmenityToArena(arenaId, amenityId);
    }

    async removeAmenity(arenaId, amenityId) {
        return await arenaAmenityRepository.removeAmenityFromArena(arenaId, amenityId);
    }

    async getArenaAmenities(arenaId) {
        return await arenaAmenityRepository.getArenaAmenities(arenaId);
    }
}

module.exports = new ArenaAmenityService();
