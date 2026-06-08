const { Court, CourtSlot, Sport, Booking, BookingDetail } = require('../../models');
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

        const slots = await CourtSlot.findAll({
            where: { 
                CourtId: courtId,
                DayName: {
                    [Op.like]: `%${dayName}%` // the schema DayName could be e.g. 'Monday', 'Mon-Fri'
                }
            }
        });

        const bookings = await Booking.findAll({
            where: {
                CourtId: courtId,
                BookingDate: date,
                Status: {
                    [Op.ne]: 'Cancelled'
                }
            },
            include: [{
                model: BookingDetail
            }]
        });

        const bookedSlotIds = new Set();
        bookings.forEach(booking => {
            booking.BookingDetails.forEach(detail => {
                bookedSlotIds.add(detail.SlotId);
            });
        });

        return slots.map(slot => {
            const slotData = slot.toJSON();
            const booked = bookedSlotIds.has(slot.SlotId);
            slotData.isBooked = booked;
            slotData.IsBooked = booked;
            return slotData;
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
