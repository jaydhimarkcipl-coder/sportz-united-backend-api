const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tournament = sequelize.define('Tournament', {
    TournamentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    TournamentCode: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: true // Will be generated on create
    },
    Name: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    Description: {
        type: DataTypes.TEXT
    },
    SportId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ArenaId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    BannerUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    Venue: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    OrganizerName: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    OrganizerLogoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ContactName: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    ContactMobile: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    ContactEmail: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    StartDate: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    EndDate: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    RegistrationStartDate: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    RegistrationEndDate: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    MaxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    MaxRegistrationsPerPlayer: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    EntryFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    Status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Upcoming' // Upcoming, Ongoing, Completed, Cancelled
    },
    RegistrationFormat: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    CreatedBy: {
        type: DataTypes.INTEGER
    },
    ModifiedBy: {
        type: DataTypes.INTEGER
    },
    CreatedDate: {
        type: DataTypes.STRING(50)
    },
    ModifiedDate: {
        type: DataTypes.STRING(50)
    }
}, {
    tableName: 'tblTournament',
    timestamps: false
});

module.exports = Tournament;
