const arenaService = require('../../services/user/arena.service');

class ArenaController {
    async getArenas(req, res, next) {
        try {
            const arenas = await arenaService.getAllArenas();
            res.status(200).json({ success: true, data: arenas });
        } catch (error) {
            next(error);
        }
    }

    async getArenaDetails(req, res, next) {
        try {
            const arena = await arenaService.getArenaDetails(req.params.arenaId);
            res.status(200).json({ success: true, data: arena });
        } catch (error) {
            next(error);
        }
    }

    async getArenaCourts(req, res, next) {
        try {
            const courts = await arenaService.getArenaCourts(req.params.arenaId);
            res.status(200).json({ success: true, data: courts });
        } catch (error) {
            next(error);
        }
    }

    async searchArenas(req, res, next) {
        try {
            const results = await arenaService.search(req.query);
            res.status(200).json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }

    async getArenaSlots(req, res, next) {
        try {
            const { arenaId } = req.params;
            const { date, sportId, courtId } = req.query;
            const slots = await arenaService.getArenaSlots(arenaId, date, { sportId, courtId });
            res.status(200).json({ success: true, data: slots });
        } catch (error) {
            next(error);
        }
    }

    async getArenaSports(req, res, next) {
        try {
            const { arenaId } = req.params;
            const sports = await arenaService.getSportsByArenaId(arenaId);
            res.status(200).json({ success: true, data: sports });
        } catch (error) {
            next(error);
        }
    }

    async getArenaReviews(req, res, next) {
        try {
            const { arenaId } = req.params;
            const reviews = await arenaService.getArenaReviews(arenaId);
            res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            next(error);
        }
    }

    async addArenaReview(req, res, next) {
        try {
            const { arenaId } = req.params;
            const { rating, reviewText } = req.body;
            const playerId = req.user.id; 
            const review = await arenaService.addArenaReview(arenaId, playerId, rating, reviewText);
            res.status(201).json({ success: true, message: 'Review added successfully', data: review });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ArenaController();
