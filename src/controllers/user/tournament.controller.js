const tournamentService = require('../../services/tournament.service');

class TournamentController {
    async getTournaments(req, res, next) {
        try {
            const userId = req.user ? req.user.id : null;
            const tournaments = await tournamentService.getTournaments({ Status: 'Upcoming' }, userId);
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

    async register(req, res, next) {
        try {
            let playersData = req.body.players;
            
            // 1. Parse players metadata
            if (typeof playersData === 'string') {
                try {
                    playersData = JSON.parse(playersData);
                } catch (e) {
                    throw { statusCode: 400, message: 'Invalid format for players. Expected a JSON stringified array.' };
                }
            }

            if (!Array.isArray(playersData)) {
                throw { statusCode: 400, message: 'Players must be an array.' };
            }

            // 2. Map photos to players
            if (req.files && req.files.length > 0) {
                playersData.forEach((player, index) => {
                    const file = req.files.find(f => {
                        if (player.photoIndex !== undefined && player.photoIndex !== null) {
                            return req.files.indexOf(f) === parseInt(player.photoIndex);
                        }
                        return f.fieldname === `photo_${index}` || 
                               f.fieldname === `players[${index}][photo]` ||
                               (f.fieldname === 'photos' && req.files.indexOf(f) === index);
                    });
                    
                    if (file) {
                        player.photoPath = `uploads/${file.filename}`;
                    }
                });
            }

            const registrationData = {
                players: playersData,
                TeamName: req.body.TeamName,
                Category: req.body.Category
            };

            const registration = await tournamentService.registerForTournament(
                req.params.tournamentId,
                req.user.id,
                registrationData
            );

            res.status(201).json({
                success: true,
                message: 'Successfully registered for the tournament',
                data: registration
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyRegistrations(req, res, next) {
        try {
            const registrations = await tournamentService.getPlayerRegistrations(req.user.id);
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
