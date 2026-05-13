const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TournamentRegistration = sequelize.define('TournamentRegistration', {
    RegistrationId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    TournamentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    PlayerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    TeamName: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    Category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    RegistrationDate: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('GETDATE()')
    },
    PaymentStatus: {
        type: DataTypes.STRING(50),
        defaultValue: 'Pending' // Pending, Paid, Cancelled
    },
    PaymentTransactionId: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    Status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Registered' // Registered, Waitlisted, Cancelled
    }
}, {
    tableName: 'tblTournamentRegistration',
    timestamps: false
});

module.exports = TournamentRegistration;
