const courtRepo = require('../../repositories/user/court.repository');

class CourtController {
    async getCourts(req, res, next) {
        try {
            const courts = await courtRepo.findCourtsByArenaId(req.params.arenaId);
            res.status(200).json({ success: true, data: courts });
        } catch (error) {
            next(error);
        }
    }

    async getSlots(req, res, next) {
        try {
            const { courtId, date } = req.query;
            const slots = await courtRepo.findSlotsByCourtIdAndDate(courtId, date);
            res.status(200).json({ success: true, data: slots });
        } catch (error) {
            next(error);
        }
    }

    async blockSlot(req, res, next) {
        try {
            await courtRepo.updateSlotStatus(req.body.slotId, false);
            res.status(200).json({ success: true, message: 'Slot blocked' });
        } catch (error) {
            next(error);
        }
    }

    async unblockSlot(req, res, next) {
        try {
            await courtRepo.updateSlotStatus(req.body.slotId, true);
            res.status(200).json({ success: true, message: 'Slot unblocked' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CourtController();
