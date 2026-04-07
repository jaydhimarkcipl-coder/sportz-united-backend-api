const superSportService = require('../../services/super-admin/sport.service');
const { getFullUrl } = require('../../utils/url.util');
const { saveBase64Image, isBase64Image } = require('../../utils/file.util');

// Map camelCase JSON to PascalCase Database fields
const mapToPascal = (data) => {
    const mapping = {
        name: 'Name',
        sportType: 'SportType',
        noOfPerson: 'NoOfPerson',
        isActive: 'IsActive'
    };
    const mapped = {};
    Object.keys(data).forEach(key => {
        const pascalKey = mapping[key] || key;
        mapped[pascalKey] = data[key];
    });
    return mapped;
};

class SuperSportController {
    async create(req, res, next) {
        try {
            const sportData = mapToPascal({ ...req.body });
            
            // Handle Sport Image Upload (Base64 or Multer)
            // Field name is 'image' in routes
            if (isBase64Image(req.body.image)) {
                sportData.SportImageUrl = saveBase64Image(req.body.image, 'sport');
            } else if (req.file) {
                sportData.SportImageUrl = `uploads/${req.file.filename}`;
            }

            const result = await superSportService.createSport(sportData);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await superSportService.getAllSports();
            const formatted = result.map(sport => {
                const s = sport.toJSON();
                if (s.SportImageUrl) s.SportImageUrl = getFullUrl(s.SportImageUrl);
                return s;
            });
            res.status(200).json({ success: true, data: formatted });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const result = await superSportService.getSportById(req.params.id);
            const s = result.toJSON();
            if (s.SportImageUrl) s.SportImageUrl = getFullUrl(s.SportImageUrl);
            res.status(200).json({ success: true, data: s });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const sportData = mapToPascal({ ...req.body });
            
            // Handle Sport Image Upload (Base64 or Multer)
            // Field name is 'image' in routes
            if (isBase64Image(req.body.image)) {
                sportData.SportImageUrl = saveBase64Image(req.body.image, 'sport');
            } else if (req.file) {
                sportData.SportImageUrl = `uploads/${req.file.filename}`;
            }

            const result = await superSportService.updateSport(req.params.id, sportData);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const result = await superSportService.deleteSport(req.params.id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SuperSportController();
