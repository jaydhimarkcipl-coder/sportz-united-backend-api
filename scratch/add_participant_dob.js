const { sequelize } = require('../src/models');

async function addDOBToParticipant() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const checkColumn = `
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'tblTournamentParticipant' AND COLUMN_NAME = 'DOB'
            )
            BEGIN
                ALTER TABLE [tblTournamentParticipant] ADD [DOB] DATETIME NULL;
                PRINT 'Column DOB added to tblTournamentParticipant';
            END
            ELSE
            BEGIN
                PRINT 'Column DOB already exists in tblTournamentParticipant';
            END
        `;
        await sequelize.query(checkColumn);

        console.log('Database migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error migrating database:', error);
        process.exit(1);
    }
}

addDOBToParticipant();
