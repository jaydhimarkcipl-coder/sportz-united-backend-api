const arenaAmenityRepository = require('../../repositories/admin/arena-amenity.repository');
const { Arena, User, Sport, Court, CourtSlot } = require('../../models');
const superArenaRepo = require('../../repositories/super-admin/arena.repository');

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

    async getArenas(reqUser, ownedArenaIds) {
        if (reqUser.role === 'super_admin') {
            return await superArenaRepo.findAllArenas();
        }

        let ids = ownedArenaIds;
        if (!ids) {
            const ownedArenas = await Arena.findAll({ where: { OwnerUserId: reqUser.id } });
            ids = ownedArenas.map(a => a.ArenaId);
        }

        if (ids.length === 0) {
            return [];
        }

        const arenas = await Arena.findAll({
            where: { ArenaId: ids },
            include: [
                { model: User, attributes: ['FullName'] },
                {
                    model: Sport,
                    attributes: ['SportId', 'Name', 'SportImageUrl'],
                    through: { attributes: [] }
                },
                {
                    model: Court,
                    attributes: ['CourtId', 'CourtName', 'SportId'],
                    where: { IsDelete: false },
                    required: false,
                    include: [
                        { model: Sport, attributes: ['Name'] },
                        { model: CourtSlot, attributes: ['BasePrice'], required: false }
                    ]
                }
            ]
        });

        return arenas.map(arena => superArenaRepo._aggregateArenaData(arena.toJSON()));
    }

    async getArenaById(reqUser, arenaId, ownedArenaIds) {
        const parsedArenaId = parseInt(arenaId);
        if (reqUser.role !== 'super_admin') {
            let ids = ownedArenaIds;
            if (!ids) {
                const ownedArenas = await Arena.findAll({ where: { OwnerUserId: reqUser.id } });
                ids = ownedArenas.map(a => a.ArenaId);
            }
            if (!ids.includes(parsedArenaId)) {
                throw { statusCode: 403, message: 'Access denied to this arena' };
            }
        }

        const arena = await superArenaRepo.findArenaById(parsedArenaId);
        if (!arena) {
            throw { statusCode: 404, message: 'Arena not found' };
        }
        return arena;
    }
}

module.exports = new ArenaAmenityService();
