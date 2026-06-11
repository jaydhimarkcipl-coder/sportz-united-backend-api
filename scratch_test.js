const { sequelize } = require('./src/config/database');
const tournamentService = require('./src/services/tournament.service');

async function run() {
    try {
        const res = await tournamentService.createTournament({
            Name: 'Test Tourney',
            SportId: 1,
            StartDate: '2026-06-15T10:00:00Z',
            EndDate: '2026-06-20T10:00:00Z',
            RegistrationStartDate: '2026-06-10T10:00:00Z',
            RegistrationEndDate: '2026-06-14T10:00:00Z',
            MaxParticipants: 100,
            RegistrationFormat: '{"gameType":"team","playersPerTeam":11}'
        }, 1);
        console.log("CREATED WITH FORMAT:", res.RegistrationFormat);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
