const { CourtSlot, Court } = require('../../models');

class AdminSlotRepository {
    async findSlotWithCourt(slotId) {
        return await CourtSlot.findByPk(slotId, {
            include: [{ model: Court, as: 'Court' }]
        });
    }

    async findSlotsByCourt(courtId) {
        return await CourtSlot.findAll({
            where: { CourtId: courtId }
        });
    }

    async updateSlotStatus(slotId, isActive) {
        return await CourtSlot.update({ IsActive: isActive }, { where: { SlotId: slotId } });
    }

    async updateMultipleSlotsStatus(slotIds, isActive) {
        return await CourtSlot.update({ IsActive: isActive }, { where: { SlotId: slotIds } });
    }

    async bulkCreateSlots(slots) {
        return await CourtSlot.bulkCreate(slots);
    }

    async findSlots(filters = {}) {
        return await CourtSlot.findAll({
            where: filters,
            include: [{ model: Court, as: 'Court' }]
        });
    }

    async deleteAllByCourt(courtId) {
        return await CourtSlot.destroy({
            where: { CourtId: courtId }
        });
    }
}

module.exports = new AdminSlotRepository();
