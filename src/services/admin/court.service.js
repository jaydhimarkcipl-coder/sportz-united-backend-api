const adminCourtRepo = require('../../repositories/admin/court.repository');
const adminSlotService = require('./slot.service');
const { sequelize } = require('../../config/database');

class AdminCourtService {
    async createCourt(data, ownedArenaIds) {
        const { slots, ...courtData } = data;

        // Validate that the ArenaId they want to add a court to belongs to them
        if (ownedArenaIds && !ownedArenaIds.includes(data.arenaId || data.ArenaId)) {
            throw { statusCode: 403, message: 'You do not own this Arena' };
        }

        return await sequelize.transaction(async (t) => {
            const court = await adminCourtRepo.createCourt({
                ...courtData,
                IsActive: true,
                IsDelete: false
            }, t);

            if (slots) {
                await adminSlotService.syncCourtSlots(court.CourtId, slots, ownedArenaIds, t);
            }

            return court;
        });
    }

    async getCourts(ownedArenaIds) {
        return await adminCourtRepo.findCourts(ownedArenaIds);
    }

    async getCourtById(id, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(id);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }
        
        const courtJson = court.toJSON();
        if (courtJson.CourtSlots) {
            courtJson.slots = {
                slotDurationMin: court.SlotDurationMin,
                days: adminSlotService.formatSlotsToWeeklyView(courtJson.CourtSlots)
            };
            delete courtJson.CourtSlots;
        }

        return courtJson;
    }

    async updateCourt(id, data, ownedArenaIds) {
        const { slots, ...courtData } = data;

        // Ensure court exists and belongs to owner
        const court = await adminCourtRepo.findCourtById(id);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        return await sequelize.transaction(async (t) => {
            if (Object.keys(courtData).length > 0) {
                await adminCourtRepo.updateCourt(id, courtData, t);
            }

            if (slots) {
                await adminSlotService.syncCourtSlots(id, slots, ownedArenaIds, t);
            }

            return { message: 'Court updated successfully' };
        });
    }

    async deleteCourt(id, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(id);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        await adminCourtRepo.deleteCourt(id);
        return { message: 'Court deleted successfully' };
    }
}

module.exports = new AdminCourtService();
