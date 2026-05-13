const { Tournament, TournamentRegistration, TournamentParticipant, Player, Sport, Arena } = require('../models');

class TournamentRepository {
    async createTournament(tournamentData) {
        return await Tournament.create(tournamentData);
    }

    async findTournamentById(id) {
        return await Tournament.findByPk(id, {
            include: [
                { model: Sport },
                { model: Arena }
            ]
        });
    }

    async findTournamentByIdOrCode(identifier) {
        const isNumeric = !isNaN(identifier) && !isNaN(parseFloat(identifier));
        const query = isNumeric ? { TournamentId: identifier } : { TournamentCode: identifier };

        return await Tournament.findOne({
            where: query,
            include: [
                { model: Sport },
                { model: Arena }
            ]
        });
    }

    async findAllTournaments(filters = {}) {
        return await Tournament.findAll({
            where: filters,
            include: [
                { model: Sport },
                { model: Arena }
            ],
            order: [['StartDate', 'ASC']]
        });
    }

    async createRegistration(registrationData) {
        return await TournamentRegistration.create(registrationData);
    }

    async findRegistration(tournamentId, playerId) {
        return await TournamentRegistration.findOne({
            where: { TournamentId: tournamentId, PlayerId: playerId }
        });
    }

    async countParticipants(tournamentId) {
        // Count total participants across all registrations for this tournament
        const registrations = await TournamentRegistration.findAll({
            where: { TournamentId: tournamentId, Status: 'Registered' },
            attributes: ['RegistrationId']
        });
        const regIds = registrations.map(r => r.RegistrationId);
        if (regIds.length === 0) return 0;
        
        return await TournamentParticipant.count({
            where: { RegistrationId: regIds }
        });
    }

    async createParticipants(participantsData, transaction) {
        return await TournamentParticipant.bulkCreate(participantsData, { transaction });
    }

    async getTournamentWithRegistrations(tournamentId) {
        return await Tournament.findByPk(tournamentId, {
            include: [
                {
                    model: TournamentRegistration,
                    include: [{ model: Player }]
                },
                { model: Sport },
                { model: Arena }
            ]
        });
    }

    async updateTournament(id, updateData) {
        return await Tournament.update(updateData, {
            where: { TournamentId: id }
        });
    }

    async findPlayerRegistrations(playerId) {
        return await TournamentRegistration.findAll({
            where: { PlayerId: playerId },
            include: [
                { model: Tournament, include: [{ model: Sport }, { model: Arena }] },
                { model: TournamentParticipant, as: 'Participants' }
            ],
            order: [['RegistrationDate', 'DESC']]
        });
    }

    async findRegistrationFullDetails(registrationId) {
        return await TournamentRegistration.findByPk(registrationId, {
            include: [
                {
                    model: Tournament,
                    include: [
                        { model: Sport },
                        { model: Arena }
                    ]
                },
                {
                    model: TournamentParticipant,
                    as: 'Participants'
                }
            ]
        });
    }
}

module.exports = new TournamentRepository();
