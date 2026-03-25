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
}

module.exports = new ArenaController();
