const tournamentService = require('../../services/tournament.service');

class TournamentController {
    async createTournament(req, res, next) {
        try {
            const tournamentData = { ...req.body };
            
            if (req.files && req.files.length > 0) {
                const bannerFile = req.files.find(f => f.fieldname.toLowerCase() === 'banner');
                const logoFile = req.files.find(f => f.fieldname.toLowerCase() === 'organizerlogo');
                
                if (bannerFile) tournamentData.BannerUrl = `uploads/${bannerFile.filename}`;
                if (logoFile) tournamentData.OrganizerLogoUrl = `uploads/${logoFile.filename}`;
            }

            let regFormat = req.body.RegistrationFormat || req.body.registrationFormat;
            let parsedRegFormat = {};
            if (typeof regFormat === 'string') {
                try { parsedRegFormat = JSON.parse(regFormat); } catch(e) {}
            } else if (typeof regFormat === 'object' && regFormat !== null) {
                parsedRegFormat = regFormat;
            } else {
                const qs = require('qs');
                const parsedBody = qs.parse(qs.stringify(req.body));
                parsedRegFormat = parsedBody.RegistrationFormat || parsedBody.registrationFormat || {};
            }

            const playersPerTeam = req.body.playersPerTeam || req.body.PlayersPerTeam || req.body['Players per team *'] || req.body['Players per team'];
            const minAge = req.body.minAge || req.body.MinAge || req.body.minimumAge || req.body.MinimumAge || req.body['Minimum age (optional)'] || req.body['Minimum age'];
            const maxAge = req.body.maxAge || req.body.MaxAge || req.body.maximumAge || req.body.MaximumAge || req.body['Maximum age (optional)'] || req.body['Maximum age'];
            const gameType = req.body.gameType || req.body.GameType;

            if (playersPerTeam !== undefined) parsedRegFormat.playersPerTeam = playersPerTeam;
            if (minAge !== undefined) parsedRegFormat.minAge = minAge;
            if (maxAge !== undefined) parsedRegFormat.maxAge = maxAge;
            if (gameType !== undefined) parsedRegFormat.gameType = gameType;

            if (Object.keys(parsedRegFormat).length > 0) {
                tournamentData.RegistrationFormat = JSON.stringify(parsedRegFormat);
            }

            // Handle base64 case-insensitive banner
            if (req.body.Banner && !req.body.banner) {
                tournamentData.banner = req.body.Banner;
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
            
            const fs = require('fs');
            const path = require('path');
            fs.appendFileSync(path.join(__dirname, '../../../../logs/update-payload.log'), JSON.stringify({ body: req.body, files: req.files ? req.files.map(f => f.fieldname) : [] }, null, 2) + '\n');

            if (req.files && req.files.length > 0) {
                const logoFile = req.files.find(f => f.fieldname.toLowerCase().includes('logo'));
                let bannerFile = req.files.find(f => f.fieldname.toLowerCase().includes('banner'));
                if (!bannerFile) {
                    bannerFile = req.files.find(f => f !== logoFile && f.mimetype && f.mimetype.startsWith('image/'));
                }
                
                if (bannerFile) tournamentData.BannerUrl = `uploads/${bannerFile.filename}`;
                if (logoFile) tournamentData.OrganizerLogoUrl = `uploads/${logoFile.filename}`;
            }

            let regFormat = req.body.RegistrationFormat || req.body.registrationFormat;
            let parsedRegFormat = {};
            if (typeof regFormat === 'string') {
                try { parsedRegFormat = JSON.parse(regFormat); } catch(e) {}
            } else if (typeof regFormat === 'object' && regFormat !== null) {
                parsedRegFormat = regFormat;
            } else {
                const qs = require('qs');
                const parsedBody = qs.parse(qs.stringify(req.body));
                parsedRegFormat = parsedBody.RegistrationFormat || parsedBody.registrationFormat || {};
            }

            const playersPerTeam = req.body.playersPerTeam || req.body.PlayersPerTeam || req.body['Players per team *'] || req.body['Players per team'];
            const minAge = req.body.minAge || req.body.MinAge || req.body.minimumAge || req.body.MinimumAge || req.body['Minimum age (optional)'] || req.body['Minimum age'];
            const maxAge = req.body.maxAge || req.body.MaxAge || req.body.maximumAge || req.body.MaximumAge || req.body['Maximum age (optional)'] || req.body['Maximum age'];
            const gameType = req.body.gameType || req.body.GameType;

            if (playersPerTeam !== undefined) parsedRegFormat.playersPerTeam = playersPerTeam;
            if (minAge !== undefined) parsedRegFormat.minAge = minAge;
            if (maxAge !== undefined) parsedRegFormat.maxAge = maxAge;
            if (gameType !== undefined) parsedRegFormat.gameType = gameType;

            if (Object.keys(parsedRegFormat).length > 0) {
                tournamentData.RegistrationFormat = JSON.stringify(parsedRegFormat);
            }

            // Handle base64 case-insensitive banner
            if (req.body.Banner && !req.body.banner) {
                tournamentData.banner = req.body.Banner;
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
            const { page = 1, limit = 10 } = req.query;
            const registrations = await tournamentService.getTournamentRegistrations(req.params.id, page, limit);
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
