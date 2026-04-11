const { Court, CourtSlot, Sport } = require('../../models');
const { Op } = require('sequelize');

class CourtRepository {
    async findCourtsByArenaId(arenaId) {
        return await Court.findAll({
            where: { ArenaId: arenaId, IsActive: true, IsDelete: false },
            include: [{ model: Sport }]
        });
    }

    async getSlotsByCourtAndDate(courtId, date) {
        return await CourtSlot.findAll({
            where: { CourtId: courtId },
            // In a real app, join with tblBookingDetail to check availability for the date
        });
    }

    async updateSlotStatus(slotId, isActive) {
        return await CourtSlot.update({ IsActive: isActive }, { where: { SlotId: slotId } });
    }

    async findSlotsByCourtIdAndDate(courtId, date) {
        // Here date can be mapped to DayName in tblCourtSlot to find recurring slots.
        // E.g., Sunday, Monday...
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dateObj.getDay()];

        return await CourtSlot.findAll({
            where: { 
                CourtId: courtId,
                DayName: {
                    [Op.like]: `%${dayName}%` // the schema DayName could be e.g. 'Monday', 'Mon-Fri'
                }
            }
        });
    }
    
    async findSlotById(slotId) {
        return await CourtSlot.findByPk(slotId);
    }

    async findCourtById(courtId, transaction = null) {
        return await Court.findByPk(courtId, { transaction });
    }
}

module.exports = new CourtRepository();
