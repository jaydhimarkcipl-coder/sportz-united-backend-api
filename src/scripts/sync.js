const { sequelize } = require('../models');
const dotenv = require('dotenv');
dotenv.config();

async function syncDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // 1. Ensure tblTransaction exists (Done earlier but keeping for robustness)
        const checkTransaction = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblTransaction'`;
        const [transactionExists] = await sequelize.query(checkTransaction);
        
        if (transactionExists.length === 0) {
            const createTransaction = `
                CREATE TABLE [tblTransaction] (
                    [PaymentId] INTEGER IDENTITY(1,1) PRIMARY KEY,
                    [BookingId] INTEGER NULL,
                    [PlayerId] INTEGER NULL,
                    [PaymentMethod] NVARCHAR(50) NULL,
                    [PaymentStatus] NVARCHAR(50) NULL,
                    [Amount] DECIMAL(10,2) NULL,
                    [PaymentType] NVARCHAR(50) NULL,
                    [TransactionId] NVARCHAR(100) NULL,
                    [CreatedDate] DATETIME DEFAULT GETDATE(),
                    [Notes] NVARCHAR(255) NULL,
                    [TopUpByArenaUserId] INTEGER NULL,
                    CONSTRAINT [FK_tblTransaction_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [tblBooking] ([BookingId]) ON DELETE NO ACTION,
                    CONSTRAINT [FK_tblTransaction_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [tblPlayer] ([PlayerId]) ON DELETE NO ACTION
                );
            `;
            await sequelize.query(createTransaction);
            console.log('tblTransaction table created.');
        } else {
            console.log('tblTransaction table already exists.');
        }

        // 2. Ensure tblBookingPlayer exists
        const checkBookingPlayer = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblBookingPlayer'`;
        const [bookingPlayerExists] = await sequelize.query(checkBookingPlayer);
        
        if (bookingPlayerExists.length === 0) {
            const createBookingPlayer = `
                CREATE TABLE [tblBookingPlayer] (
                    [BookingPlayerId] INTEGER IDENTITY(1,1) PRIMARY KEY,
                    [BookingId] INTEGER NULL,
                    [PlayerId] INTEGER NULL,
                    [QRCode] NVARCHAR(255) NULL,
                    [PlayerType] NVARCHAR(50) NULL,
                    CONSTRAINT [FK_tblBookingPlayer_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [tblBooking] ([BookingId]) ON DELETE NO ACTION,
                    CONSTRAINT [FK_tblBookingPlayer_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [tblPlayer] ([PlayerId]) ON DELETE NO ACTION
                );
            `;
            await sequelize.query(createBookingPlayer);
            console.log('tblBookingPlayer table created.');
        } else {
            console.log('tblBookingPlayer table already exists.');
        }

        // 3. Ensure tblTournament exists
        const checkTournament = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblTournament'`;
        const [tournamentExists] = await sequelize.query(checkTournament);
        
        if (tournamentExists.length === 0) {
            const createTournament = `
                CREATE TABLE [tblTournament] (
                    [TournamentId] INTEGER IDENTITY(1,1) PRIMARY KEY,
                    [Name] NVARCHAR(150) NOT NULL,
                    [Description] NVARCHAR(MAX) NULL,
                    [SportId] INTEGER NOT NULL,
                    [ArenaId] INTEGER NULL,
                    [StartDate] DATETIME NOT NULL,
                    [EndDate] DATETIME NOT NULL,
                    [RegistrationStartDate] DATETIME NOT NULL,
                    [RegistrationEndDate] DATETIME NOT NULL,
                    [MaxParticipants] INTEGER NOT NULL,
                    [EntryFee] DECIMAL(10,2) DEFAULT 0,
                    [Status] NVARCHAR(50) DEFAULT 'Upcoming',
                    [CreatedBy] INTEGER NULL,
                    [ModifiedBy] INTEGER NULL,
                    [CreatedDate] DATETIME DEFAULT GETDATE(),
                    [ModifiedDate] DATETIME NULL,
                    CONSTRAINT [FK_tblTournament_SportId] FOREIGN KEY ([SportId]) REFERENCES [tblSports] ([SportId]),
                    CONSTRAINT [FK_tblTournament_ArenaId] FOREIGN KEY ([ArenaId]) REFERENCES [tblArena] ([ArenaId])
                );
            `;
            await sequelize.query(createTournament);
            console.log('tblTournament table created.');
        } else {
            console.log('tblTournament table already exists.');
        }

        // 4. Ensure tblTournamentRegistration exists
        const checkReg = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblTournamentRegistration'`;
        const [regExists] = await sequelize.query(checkReg);
        
        if (regExists.length === 0) {
            const createReg = `
                CREATE TABLE [tblTournamentRegistration] (
                    [RegistrationId] INTEGER IDENTITY(1,1) PRIMARY KEY,
                    [TournamentId] INTEGER NOT NULL,
                    [PlayerId] INTEGER NOT NULL,
                    [TeamName] NVARCHAR(150) NULL,
                    [RegistrationDate] DATETIME DEFAULT GETDATE(),
                    [PaymentStatus] NVARCHAR(50) DEFAULT 'Pending',
                    [PaymentTransactionId] NVARCHAR(255) NULL,
                    [Status] NVARCHAR(50) DEFAULT 'Registered',
                    CONSTRAINT [FK_tblTournamentRegistration_TournamentId] FOREIGN KEY ([TournamentId]) REFERENCES [tblTournament] ([TournamentId]),
                    CONSTRAINT [FK_tblTournamentRegistration_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [tblPlayer] ([PlayerId])
                );
            `;
            await sequelize.query(createReg);
            console.log('tblTournamentRegistration table created.');
        } else {
            console.log('tblTournamentRegistration table already exists.');
        }

        // 5. Ensure tblTournamentParticipant exists
        const checkPart = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblTournamentParticipant'`;
        const [partExists] = await sequelize.query(checkPart);
        
        if (partExists.length === 0) {
            const createPart = `
                CREATE TABLE [tblTournamentParticipant] (
                    [ParticipantId] INTEGER IDENTITY(1,1) PRIMARY KEY,
                    [RegistrationId] INTEGER NOT NULL,
                    [PlayerId] INTEGER NULL,
                    [FullName] NVARCHAR(150) NOT NULL,
                    [Email] NVARCHAR(150) NULL,
                    [Phone] NVARCHAR(20) NULL,
                    [PhotoUrl] NVARCHAR(255) NULL,
                    CONSTRAINT [FK_tblTournamentParticipant_RegistrationId] FOREIGN KEY ([RegistrationId]) REFERENCES [tblTournamentRegistration] ([RegistrationId]) ON DELETE CASCADE,
                    CONSTRAINT [FK_tblTournamentParticipant_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [tblPlayer] ([PlayerId])
                );
            `;
            await sequelize.query(createPart);
            console.log('tblTournamentParticipant table created.');
        } else {
            console.log('tblTournamentParticipant table already exists.');
        }

        console.log('Database sync complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
}

syncDB();
