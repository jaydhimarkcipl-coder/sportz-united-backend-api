const tournamentService = require('../../services/tournament.service');

class TournamentController {
    async createTournament(req, res, next) {
        try {
            const tournamentData = { ...req.body };
            
            if (req.files && req.files.length > 0) {
                const bannerFile = req.files.find(f => f.fieldname === 'banner');
                const logoFile = req.files.find(f => f.fieldname === 'organizerLogo');
                
                if (bannerFile) tournamentData.BannerUrl = `uploads/${bannerFile.filename}`;
                if (logoFile) tournamentData.OrganizerLogoUrl = `uploads/${logoFile.filename}`;
            }

            const tournament = await tournamentService.createTournament(tournamentData, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Tournament created successfully',
                data: tournament
            });
        } catch (error) {
            next(error);
        }
    }

    async getTournaments(req, res, next) {
        try {
            const tournaments = await tournamentService.getTournaments();
            res.status(200).json({
                success: true,
                data: tournaments
            });
        } catch (error) {
            next(error);
        }
    }

    async getTournamentDetails(req, res, next) {
        try {
            const tournament = await tournamentService.getTournamentDetails(req.params.id);
            res.status(200).json({
                success: true,
                data: tournament
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTournament(req, res, next) {
        try {
            const tournamentData = { ...req.body };
            
            if (req.files && req.files.length > 0) {
                const bannerFile = req.files.find(f => f.fieldname === 'banner');
                const logoFile = req.files.find(f => f.fieldname === 'organizerLogo');
                
                if (bannerFile) tournamentData.BannerUrl = `uploads/${bannerFile.filename}`;
                if (logoFile) tournamentData.OrganizerLogoUrl = `uploads/${logoFile.filename}`;
            }

            const tournament = await tournamentService.updateTournament(req.params.id, tournamentData, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Tournament updated successfully',
                data: tournament
            });
        } catch (error) {
            next(error);
        }
    }

    async getTournamentRegistrations(req, res, next) {
        try {
            const registrations = await tournamentService.getTournamentRegistrations(req.params.id);
            res.status(200).json({
                success: true,
                data: registrations
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TournamentController();
