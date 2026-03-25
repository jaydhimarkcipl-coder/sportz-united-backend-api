const superSportService = require('../../services/super-admin/sport.service');

class SportController {
    async getAll(req, res, next) {
        try {
            const sports = await superSportService.getAllSports();
            // Optional: Filter only active ones for public
            const activeSports = sports.filter(s => s.IsActive);
            res.status(200).json({ success: true, data: activeSports });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SportController();
