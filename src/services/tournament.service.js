const tournamentRepo = require('../repositories/tournament.repository');
const { formatDateTime } = require('../utils/time.util');
const { saveBase64Image, isBase64Image } = require('../utils/file.util');
const { sendWhatsAppMessage } = require('../utils/whatsapp.util');
const { generateTournamentCode } = require('../utils/code.util');
const { TournamentRegistration, TournamentParticipant, Player, Tournament, sequelize } = require('../models');
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
    const baseUrl = process.env.BASE_URL || 'https://api.sportzunited.com';
    return `${baseUrl}/${cleanPath}`;
};

const fixRegistrationFormat = (tournament) => {
    if (!tournament.RegistrationFormat) return tournament;
    try {
        let parsed = JSON.parse(tournament.RegistrationFormat);
        if (Array.isArray(parsed)) {
            let temp = {};
            parsed.forEach(item => {
                const label = String(item.label || '').toLowerCase();
                const value = item.value;
                if (label.includes('players per team')) temp.playersPerTeam = value;
                else if (label.includes('minimum age')) temp.minAge = value;
                else if (label.includes('maximum age')) temp.maxAge = value;
                else if (label.includes('game type')) temp.gameType = value;
            });
            tournament.RegistrationFormat = JSON.stringify(temp);
        }
    } catch (e) { }
    return tournament;
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
        if (createData.RegistrationFormat != null && typeof createData.RegistrationFormat === 'object') {
            createData.RegistrationFormat = JSON.stringify(createData.RegistrationFormat);
        }

        // Handle Base64 images if files weren't uploaded via multipart
        if (!createData.BannerUrl && isBase64Image(createData.banner)) {
            createData.BannerUrl = saveBase64Image(createData.banner, 'tournament-banner');
        }
        if (!createData.OrganizerLogoUrl && isBase64Image(createData.organizerLogo)) {
            createData.OrganizerLogoUrl = saveBase64Image(createData.organizerLogo, 'organizer-logo');
        }

        // Generate Unique Tournament Code
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateTournamentCode();
            const existing = await Tournament.findOne({ where: { TournamentCode: code } });
            if (!existing) isUnique = true;
        }
        createData.TournamentCode = code;

        const tournament = await tournamentRepo.createTournament({
            ...createData,
            StartDate: formatForMSSQL(createData.StartDate),
            EndDate: formatForMSSQL(createData.EndDate),
            RegistrationStartDate: formatForMSSQL(createData.RegistrationStartDate),
            RegistrationEndDate: formatForMSSQL(createData.RegistrationEndDate),
            CreatedBy: userId,
            CreatedDate: formatForMSSQL(new Date())
        });

        const result = tournament.toJSON();
        result.BannerUrl = getFullUrl(result.BannerUrl);
        result.OrganizerLogoUrl = getFullUrl(result.OrganizerLogoUrl);
        return fixRegistrationFormat(result);
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
                return fixRegistrationFormat(tournament);
            });
        }

        return tournaments.map(t => {
            const tournament = t.toJSON();
            tournament.BannerUrl = getFullUrl(tournament.BannerUrl);
            tournament.OrganizerLogoUrl = getFullUrl(tournament.OrganizerLogoUrl);
            return fixRegistrationFormat(tournament);
        });
    }

    async getTournamentDetails(identifier) {
        const tournament = await tournamentRepo.findTournamentByIdOrCode(identifier);
        if (!tournament) {
            throw { statusCode: 404, message: 'Tournament not found' };
        }
        const result = tournament.toJSON();
        result.BannerUrl = getFullUrl(result.BannerUrl);
        result.OrganizerLogoUrl = getFullUrl(result.OrganizerLogoUrl);
        return fixRegistrationFormat(result);
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

        // Check per-player registration limit (only for authenticated users)
        if (registrantId) {
            const playerRegCount = await TournamentRegistration.count({
                where: { TournamentId: tournamentId, PlayerId: registrantId, Status: { [Op.ne]: 'Cancelled' } }
            });

            if (playerRegCount >= (tournament.MaxRegistrationsPerPlayer || 1)) {
                throw { statusCode: 400, message: `You have reached the maximum registration limit for this tournament (${tournament.MaxRegistrationsPerPlayer || 1}).` };
            }
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

                // Handle Base64 photo if no file path provided
                if (!photoUrl && isBase64Image(p.photo)) {
                    photoUrl = saveBase64Image(p.photo, 'player-photo');
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
        if (updateData.RegistrationFormat != null && typeof updateData.RegistrationFormat === 'object') {
            updateData.RegistrationFormat = JSON.stringify(updateData.RegistrationFormat);
        }
        if (updateData.hasOwnProperty('ArenaId')) {
            if (!updateData.ArenaId || updateData.ArenaId === '0' || updateData.ArenaId === 0) {
                updateData.ArenaId = null;
            }
        }

        // Handle Base64 images
        if (!updateData.BannerUrl && isBase64Image(updateData.banner)) {
            updateData.BannerUrl = saveBase64Image(updateData.banner, 'tournament-banner');
        }
        if (!updateData.OrganizerLogoUrl && isBase64Image(updateData.organizerLogo)) {
            updateData.OrganizerLogoUrl = saveBase64Image(updateData.organizerLogo, 'organizer-logo');
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
        return fixRegistrationFormat(result);
    }

    async getPlayerRegistrations(playerId) {
        return await tournamentRepo.findPlayerRegistrations(playerId);
    }

    async getTournamentRegistrations(tournamentId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const { count, rows } = await TournamentRegistration.findAndCountAll({
            where: { TournamentId: tournamentId },
            distinct: true,
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
            order: [['RegistrationId', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Transform image URLs
        const transformedRegistrations = rows.map(reg => {
            const result = reg.toJSON();
            if (result.Participants) {
                result.Participants.forEach(p => {
                    p.PhotoUrl = getFullUrl(p.PhotoUrl);
                });
            }
            return result;
        });

        return {
            totalRegistrations: count,
            totalTeams: count, // Alias for backward compatibility
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
            registrations: transformedRegistrations
        };
    }

    async getFullTournamentDetailsByRegistrationId(registrationId) {
        const registration = await tournamentRepo.findRegistrationFullDetails(registrationId);
        if (!registration) {
            throw { statusCode: 404, message: 'Registration not found' };
        }

        const regData = registration.toJSON();
        const tournament = regData.Tournament || {};
        const sport = tournament.Sport || {};
        const sportDetails = { ...sport };
        if (sportDetails.NoOfPerson) {
            sportDetails.NoOfPerson = Math.floor(sportDetails.NoOfPerson / 2);
            sportDetails.PlayersPerTeam = sportDetails.NoOfPerson;
        }
        const arena = tournament.Arena || {};
        const participants = regData.Participants || [];

        // Format Image URLs
        if (tournament.BannerUrl) tournament.BannerUrl = getFullUrl(tournament.BannerUrl);
        if (tournament.OrganizerLogoUrl) tournament.OrganizerLogoUrl = getFullUrl(tournament.OrganizerLogoUrl);
        participants.forEach(p => {
            if (p.PhotoUrl) p.PhotoUrl = getFullUrl(p.PhotoUrl);
        });

        return {
            registration: {
                RegistrationId: regData.RegistrationId,
                Status: regData.Status,
                RegistrationDate: regData.RegistrationDate,
                PaymentStatus: regData.PaymentStatus,
                Category: regData.Category,
                PaymentTransactionId: regData.PaymentTransactionId
            },
            tournament: {
                TournamentId: tournament.TournamentId,
                TournamentCode: tournament.TournamentCode,
                Name: tournament.Name,
                Description: tournament.Description,
                Sport: sport.Name || null,
                StartDate: tournament.StartDate,
                EndDate: tournament.EndDate,
                RegistrationStartDate: tournament.RegistrationStartDate,
                RegistrationEndDate: tournament.RegistrationEndDate,
                Status: tournament.Status,
                EntryFee: tournament.EntryFee,
                MaxParticipants: tournament.MaxParticipants,
                Rules: "Check tournament description for rules and regulations.", // Placeholder as not in DB
                Prizes: "Check tournament description for prize information.",   // Placeholder as not in DB
                Venue: tournament.Venue || null,
                PlayersPerTeam: tournament.PlayersPerTeam || null,
                GameType: tournament.GameType || null,
                MinAge: tournament.MinAge || null,
                MaxAge: tournament.MaxAge || null,
                RegistrationFormat: tournament.RegistrationFormat || null
            },
            team: {
                TeamId: regData.RegistrationId,
                TeamName: regData.TeamName || 'Unnamed Team'
            },
            players: participants,
            matches: [], // Model currently not in database
            standings: [], // Model currently not in database
            venue: {
                Name: tournament.Venue || arena.Name || 'TBA',
                Address: arena.AddressLine1 ? (arena.AddressLine2 ? `${arena.AddressLine1}, ${arena.AddressLine2}` : arena.AddressLine1) : null,
                City: arena.City || null,
                State: arena.State || null
            },
            organizer: {
                Name: tournament.OrganizerName || 'Tournament Organizer',
                ContactName: tournament.ContactName,
                ContactMobile: tournament.ContactMobile,
                ContactEmail: tournament.ContactEmail,
                LogoUrl: tournament.OrganizerLogoUrl
            },
            payment: {
                Status: regData.PaymentStatus,
                TransactionId: regData.PaymentTransactionId,
                Amount: tournament.EntryFee
            },
            additionalDetails: {
                SportDetails: sportDetails,
                ArenaDetails: arena
            }
        };
    }
}

module.exports = new TournamentService();
