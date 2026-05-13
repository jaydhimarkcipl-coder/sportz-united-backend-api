const tournamentRepo = require('../repositories/tournament.repository');
const { formatDateTime } = require('../utils/time.util');
const { saveBase64Image, isBase64Image } = require('../utils/file.util');
const { sendWhatsAppMessage } = require('../utils/whatsapp.util');
const { TournamentRegistration, TournamentParticipant, Player, sequelize } = require('../models');
const { Op } = require('sequelize');

const formatForMSSQL = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
};

const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/${cleanPath}`;
};

class TournamentService {
    async createTournament(tournamentData, userId) {
        // Basic validation
        if (new Date(tournamentData.StartDate) > new Date(tournamentData.EndDate)) {
            throw { statusCode: 400, message: 'Start date cannot be after end date' };
        }

        if (new Date(tournamentData.RegistrationStartDate) > new Date(tournamentData.RegistrationEndDate)) {
            throw { statusCode: 400, message: 'Registration start date cannot be after registration end date' };
        }

        const createData = { ...tournamentData };
        if (!createData.ArenaId || createData.ArenaId === '0' || createData.ArenaId === 0) {
            createData.ArenaId = null;
        }

        const tournament = await tournamentRepo.createTournament({
            ...createData,
            StartDate: formatForMSSQL(createData.StartDate),
            EndDate: formatForMSSQL(createData.EndDate),
            RegistrationStartDate: formatForMSSQL(createData.RegistrationStartDate),
            RegistrationEndDate: formatForMSSQL(createData.RegistrationEndDate),
            CreatedBy: userId
        });

        const result = tournament.toJSON();
        result.BannerUrl = getFullUrl(result.BannerUrl);
        result.OrganizerLogoUrl = getFullUrl(result.OrganizerLogoUrl);
        return result;
    }

    async getTournaments(filters = {}, userId = null) {
        const tournaments = await tournamentRepo.findAllTournaments(filters);
        
        if (userId) {
            const registrations = await TournamentRegistration.findAll({
                where: { PlayerId: userId, Status: { [Op.ne]: 'Cancelled' } },
                attributes: ['TournamentId']
            });
            
            const registeredTournamentIds = new Set(registrations.map(r => r.TournamentId));
            
            return tournaments.map(t => {
                const tournament = t.toJSON();
                tournament.IsRegistered = registeredTournamentIds.has(tournament.TournamentId);
                tournament.BannerUrl = getFullUrl(tournament.BannerUrl);
                tournament.OrganizerLogoUrl = getFullUrl(tournament.OrganizerLogoUrl);
                return tournament;
            });
        }
        
        return tournaments.map(t => {
            const tournament = t.toJSON();
            tournament.BannerUrl = getFullUrl(tournament.BannerUrl);
            tournament.OrganizerLogoUrl = getFullUrl(tournament.OrganizerLogoUrl);
            return tournament;
        });
    }

    async getTournamentDetails(tournamentId) {
        const tournament = await tournamentRepo.findTournamentById(tournamentId);
        if (!tournament) {
            throw { statusCode: 404, message: 'Tournament not found' };
        }
        const result = tournament.toJSON();
        result.BannerUrl = getFullUrl(result.BannerUrl);
        result.OrganizerLogoUrl = getFullUrl(result.OrganizerLogoUrl);
        return result;
    }

    async registerForTournament(tournamentId, registrantId, registrationData) {
        const { players } = registrationData;
        
        if (!players || !Array.isArray(players) || players.length === 0) {
            throw { statusCode: 400, message: 'At least one player is required for registration' };
        }

        const tournament = await tournamentRepo.findTournamentById(tournamentId);
        if (!tournament) {
            throw { statusCode: 404, message: 'Tournament not found' };
        }

        // Check if registration is open
        const now = new Date();
        if (now < new Date(tournament.RegistrationStartDate) || now > new Date(tournament.RegistrationEndDate)) {
            throw { statusCode: 400, message: 'Registration is not open for this tournament' };
        }

        // Check capacity
        const currentParticipants = await tournamentRepo.countParticipants(tournamentId);
        if (currentParticipants + players.length > tournament.MaxParticipants) {
            throw { statusCode: 400, message: `Tournament does not have enough slots. Available: ${tournament.MaxParticipants - currentParticipants}` };
        }

        // Check per-player registration limit
        const playerRegCount = await TournamentRegistration.count({
            where: { TournamentId: tournamentId, PlayerId: registrantId, Status: { [Op.ne]: 'Cancelled' } }
        });

        if (playerRegCount >= (tournament.MaxRegistrationsPerPlayer || 1)) {
            throw { statusCode: 400, message: `You have reached the maximum registration limit for this tournament (${tournament.MaxRegistrationsPerPlayer || 1}).` };
        }

        const t = await sequelize.transaction();

        try {
            // 1. Create main registration record
            const registration = await TournamentRegistration.create({
                TournamentId: tournamentId,
                PlayerId: registrantId,
                TeamName: registrationData.TeamName || null,
                Category: registrationData.Category || null,
                PaymentStatus: tournament.EntryFee > 0 ? 'Pending' : 'Paid',
                Status: 'Registered'
            }, { transaction: t });

            // 2. Prepare and create participants
            const participantsData = players.map(p => {
                let photoUrl = p.photoPath || null;
                
                // Fallback to Base64 if photoPath is not provided but photo (base64) is
                if (!photoUrl && isBase64Image(p.photo)) {
                    photoUrl = saveBase64Image(p.photo, 'tournament-player');
                }

                return {
                    RegistrationId: registration.RegistrationId,
                    FullName: p.name,
                    Email: p.email || null,
                    Phone: p.phone || p.mobile || null,
                    DOB: formatForMSSQL(p.dob),
                    Gender: p.gender || null,
                    PhotoUrl: photoUrl
                };
            });

            console.log('--- TOURNAMENT PARTICIPANTS DATA ---', JSON.stringify(participantsData, null, 2));

            await tournamentRepo.createParticipants(participantsData, t);

            await t.commit();
            
            // 3. Send WhatsApp Notifications (Async, don't wait)
            try {
                const startDate = new Date(tournament.StartDate).toLocaleDateString('en-GB'); // DD/MM/YYYY
                const venue = tournament.Venue || (tournament.Arena ? tournament.Arena.Name : 'Tournament Venue');

                participantsData.forEach(p => {
                    if (p.Phone) {
                        // Variables: 1: Name, 2: Tournament Name, 3: Date, 4: Venue
                        const whatsappData = [
                            p.FullName,
                            tournament.Name,
                            startDate,
                            venue
                        ];
                        sendWhatsAppMessage(p.Phone, 'tournament_participate', whatsappData);
                    }
                });
            } catch (notifError) {
                console.error('Error in sending WhatsApp notifications:', notifError);
            }

            // Return registration with participants
            const registrationWithParticipants = await TournamentRegistration.findByPk(registration.RegistrationId, {
                include: ['Participants']
            });

            const result = registrationWithParticipants.toJSON();
            if (result.Participants) {
                result.Participants.forEach(p => {
                    p.PhotoUrl = getFullUrl(p.PhotoUrl);
                });
            }
            return result;
        } catch (error) {
            if (t && !t.finished) {
                try {
                    await t.rollback();
                } catch (rollbackError) {
                    // Ignore rollback errors in MSSQL as they usually mean the DB already rolled it back
                }
            }
            throw error;
        }
    }

    async updateTournament(tournamentId, tournamentData, userId) {
        const tournament = await tournamentRepo.findTournamentById(tournamentId);
        if (!tournament) {
            throw { statusCode: 404, message: 'Tournament not found' };
        }

        const updateData = { ...tournamentData };
        if (updateData.hasOwnProperty('ArenaId')) {
            if (!updateData.ArenaId || updateData.ArenaId === '0' || updateData.ArenaId === 0) {
                updateData.ArenaId = null;
            }
        }

        if (updateData.StartDate) updateData.StartDate = formatForMSSQL(updateData.StartDate);
        if (updateData.EndDate) updateData.EndDate = formatForMSSQL(updateData.EndDate);
        if (updateData.RegistrationStartDate) updateData.RegistrationStartDate = formatForMSSQL(updateData.RegistrationStartDate);
        if (updateData.RegistrationEndDate) updateData.RegistrationEndDate = formatForMSSQL(updateData.RegistrationEndDate);
        
        updateData.ModifiedBy = userId;
        updateData.ModifiedDate = formatForMSSQL(new Date());

        await tournamentRepo.updateTournament(tournamentId, updateData);
        const updated = await tournamentRepo.findTournamentById(tournamentId);
        const result = updated.toJSON();
        result.BannerUrl = getFullUrl(result.BannerUrl);
        result.OrganizerLogoUrl = getFullUrl(result.OrganizerLogoUrl);
        return result;
    }

    async getPlayerRegistrations(playerId) {
        return await tournamentRepo.findPlayerRegistrations(playerId);
    }

    async getTournamentRegistrations(tournamentId) {
        const registrations = await TournamentRegistration.findAll({
            where: { TournamentId: tournamentId },
            include: [
                {
                    model: TournamentParticipant,
                    as: 'Participants'
                },
                {
                    model: Player,
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                }
            ],
            order: [['RegistrationId', 'DESC']]
        });

        // Transform image URLs
        const transformedRegistrations = registrations.map(reg => {
            const result = reg.toJSON();
            if (result.Participants) {
                result.Participants.forEach(p => {
                    p.PhotoUrl = getFullUrl(p.PhotoUrl);
                });
            }
            return result;
        });

        return {
            totalTeams: registrations.length,
            registrations: transformedRegistrations
        };
    }
}

module.exports = new TournamentService();
