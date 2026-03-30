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

        console.log('Database sync complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
}

syncDB();
