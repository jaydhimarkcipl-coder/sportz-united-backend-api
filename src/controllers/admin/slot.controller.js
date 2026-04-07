const adminSlotService = require('../../services/admin/slot.service');

class AdminSlotController {
    async block(req, res, next) {
        try {
            const { slotId, courtId, dayName } = req.body;
            let result;

            if (slotId) {
                result = await adminSlotService.blockSlot(slotId, req.ownedArenaIds);
            } else if (courtId && dayName) {
                result = await adminSlotService.blockFullDay(courtId, dayName, req.ownedArenaIds);
            } else {
                throw { statusCode: 400, message: 'Provide either slotId OR (courtId and dayName)' };
            }

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async unblock(req, res, next) {
        try {
            const { slotId } = req.body;
            if (!slotId) throw { statusCode: 400, message: 'slotId is required' };

            const result = await adminSlotService.unblockSlot(slotId, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async sync(req, res, next) {
        try {
            const { courtId } = req.body;
            const result = await adminSlotService.syncCourtSlots(courtId, req.body, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async getSlotsByCourt(req, res, next) {
        try {
            const { courtId } = req.params;
            const slots = await adminSlotService.getSlots({ CourtId: courtId }, req.ownedArenaIds);
            const formatted = adminSlotService.formatSlotsToWeeklyView(slots);

            res.status(200).json({ success: true, data: { courtId, days: formatted } });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await adminSlotService.getSlots(req.query, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteAll(req, res, next) {
        try {
            const { courtId } = req.params;
            const result = await adminSlotService.deleteAllSlots(courtId, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminSlotController();
