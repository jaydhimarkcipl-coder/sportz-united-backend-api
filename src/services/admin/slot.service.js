const adminSlotRepo = require('../../repositories/admin/slot.repository');
const adminCourtRepo = require('../../repositories/admin/court.repository');

class AdminSlotService {
    async blockSlot(slotId, ownedArenaIds) {
        const slot = await adminSlotRepo.findSlotWithCourt(slotId);
        if (!slot || (ownedArenaIds && !ownedArenaIds.includes(slot.Court.ArenaId))) {
            throw { statusCode: 404, message: 'Slot not found or access denied' };
        }
        await adminSlotRepo.updateSlotStatus(slotId, false);
        return { message: 'Slot blocked successfully' };
    }

    async unblockSlot(slotId, ownedArenaIds) {
        const slot = await adminSlotRepo.findSlotWithCourt(slotId);
        if (!slot || (ownedArenaIds && !ownedArenaIds.includes(slot.Court.ArenaId))) {
            throw { statusCode: 404, message: 'Slot not found or access denied' };
        }
        await adminSlotRepo.updateSlotStatus(slotId, true);
        return { message: 'Slot unblocked successfully' };
    }

    async blockFullDay(courtId, dayName, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(courtId);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        const slots = await adminSlotRepo.findSlotsByCourt(courtId);
        const slotsToBlock = slots.filter(s => s.DayName === dayName).map(s => s.SlotId);
        
        if (slotsToBlock.length > 0) {
            await adminSlotRepo.updateMultipleSlotsStatus(slotsToBlock, false);
        }
        return { message: `Blocked all slots for ${dayName}` };
    }

    async getSlots(filters, ownedArenaIds) {
        const queryFilters = { ...filters };
        if (ownedArenaIds) {
            queryFilters['$Court.ArenaId$'] = ownedArenaIds;
        }
        return await adminSlotRepo.findSlots(queryFilters);
    }

    async generateSlots(data, ownedArenaIds) {
        const { courtId, startTime, endTime, slotDuration, basePrice, weekendPrice } = data;

        const court = await adminCourtRepo.findCourtById(courtId);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const slotsToCreate = [];

        for (const day of days) {
            let current = this._parseTime(startTime);
            const end = this._parseTime(endTime);
            const duration = parseInt(slotDuration || court.SlotDurationMin || 60);
            const price = (day === 'Saturday' || day === 'Sunday') ? (weekendPrice || basePrice) : basePrice;

            while (current + duration <= end) {
                slotsToCreate.push({
                    CourtId: courtId,
                    DayName: day,
                    StartTime: this._formatTime(current),
                    EndTime: this._formatTime(current + duration),
                    BasePrice: price,
                    FinalPrice: price,
                    IsActive: true
                });
                current += duration;
            }
        }

        if (slotsToCreate.length === 0) {
            throw { statusCode: 400, message: 'No slots generated with provided times' };
        }

        await adminSlotRepo.bulkCreateSlots(slotsToCreate);
        return { message: `Generated ${slotsToCreate.length} slots for all days.`, count: slotsToCreate.length };
    }

    _parseTime(t) {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    _formatTime(mTotal) {
        const h = Math.floor(mTotal / 60);
        const m = mTotal % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    }

    async deleteAllSlots(courtId, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(courtId);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        const count = await adminSlotRepo.deleteAllByCourt(courtId);
        return { message: `Deleted ${count} slots for court ID ${courtId}`, count };
    }
}

module.exports = new AdminSlotService();
