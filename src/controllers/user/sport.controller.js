const superSportService = require('../../services/super-admin/sport.service');
const { getFullUrl } = require('../../utils/url.util');

class SportController {
    async getAll(req, res, next) {
        try {
            const sports = await superSportService.getAllSports();
            // Optional: Filter only active ones for public
            const activeSports = sports.filter(s => s.IsActive).map(sport => {
                const s = sport.toJSON();
                if (s.SportImageUrl) s.SportImageUrl = getFullUrl(s.SportImageUrl);
                return s;
            });
            res.status(200).json({ success: true, data: activeSports });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SportController();
