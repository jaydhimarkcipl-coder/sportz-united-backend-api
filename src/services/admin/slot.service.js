const adminSlotRepo = require('../../repositories/admin/slot.repository');
const adminCourtRepo = require('../../repositories/admin/court.repository');
const { sequelize } = require('../../config/database');
const { CourtSlot, BookingDetail } = require('../../models');
const { Op } = require('sequelize');

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

    /**
     * Synchronize a court's weekly schedule.
     * Replaces the old generateSlots functionality.
     */
    async syncCourtSlots(courtId, data, ownedArenaIds, t = null) {
        const { days, slotDurationMin } = data;

        const court = await adminCourtRepo.findCourtById(courtId);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        const existingSlots = await adminSlotRepo.findSlotsByCourt(courtId);
        const handledSlotIds = new Set();
        const slotsToCreate = [];
        const slotsToUpdate = [];

        for (const day of days) {
            const { dayName, slots, isActive: dayActive } = day;
            
            for (const slotItem of slots) {
                const { startTime, endTime, basePrice, isActive: slotActive } = slotItem;
                
                // Format times to HH:mm:ss for consistent comparison
                const sTime = startTime.includes(':') && startTime.split(':').length === 2 ? startTime + ':00' : startTime;
                const eTime = endTime.includes(':') && endTime.split(':').length === 2 ? endTime + ':00' : endTime;

                // Find matching existing slot
                const existing = existingSlots.find(s => 
                    s.DayName === dayName && 
                    s.StartTime === sTime && 
                    s.EndTime === eTime
                );

                const finalActive = dayActive && slotActive;

                if (existing) {
                    handledSlotIds.add(existing.SlotId);
                    slotsToUpdate.push({
                        id: existing.SlotId,
                        data: {
                            BasePrice: basePrice,
                            FinalPrice: basePrice,
                            IsActive: finalActive,
                            DurationMin: slotDurationMin || court.SlotDurationMin || 60
                        }
                    });
                } else {
                    slotsToCreate.push({
                        CourtId: courtId,
                        DayName: dayName,
                        StartTime: sTime,
                        EndTime: eTime,
                        BasePrice: basePrice,
                        FinalPrice: basePrice,
                        IsActive: finalActive,
                        DurationMin: slotDurationMin || court.SlotDurationMin || 60
                    });
                }
            }
        }

        const useTransaction = async (work) => {
            if (t) return await work(t);
            return await sequelize.transaction(async (transaction) => await work(transaction));
        };

        return await useTransaction(async (transaction) => {
            // 1. Bulk Update existing
            for (const item of slotsToUpdate) {
                await CourtSlot.update(item.data, { where: { SlotId: item.id }, transaction });
            }

            // 2. Bulk Create new
            if (slotsToCreate.length > 0) {
                await CourtSlot.bulkCreate(slotsToCreate, { transaction });
            }

            // 3. Deactivate old slots that were not mentioned in the new config
            const unhandledSlotIds = existingSlots
                .filter(s => !handledSlotIds.has(s.SlotId))
                .map(s => s.SlotId);

            if (unhandledSlotIds.length > 0) {
                // If a slot is unhandled, it means it's removed from the UI.
                // We deactivate it instead of deleting to preserve booking history.
                await CourtSlot.update({ IsActive: false }, { 
                    where: { SlotId: unhandledSlotIds }, 
                    transaction 
                });
            }

            // Optional: Update the court's slot duration if changed
            if (slotDurationMin) {
                await court.update({ SlotDurationMin: slotDurationMin }, { transaction });
            }

            return { 
                message: 'Slots synchronized successfully', 
                created: slotsToCreate.length, 
                updated: slotsToUpdate.length,
                deactivated: unhandledSlotIds.length
            };
        });
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

    formatSlotsToWeeklyView(slots) {
        const { formatTimeToHHMMSS } = require('../../utils/time.util');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => {
            const daySlots = slots
                .filter(s => s.DayName === day)
                .map(s => {
                    const sTime = formatTimeToHHMMSS(s.StartTime);
                    const eTime = formatTimeToHHMMSS(s.EndTime);
                    return {
                        slotId: s.SlotId,
                        startTime: sTime ? sTime.substring(0, 5) : null,
                        endTime: eTime ? eTime.substring(0, 5) : null,
                        basePrice: s.BasePrice,
                        isActive: s.IsActive
                    };
                });
            
            return {
                dayName: day,
                isActive: daySlots.some(s => s.isActive),
                slots: daySlots
            };
        });
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
