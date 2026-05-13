const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TournamentParticipant = sequelize.define('TournamentParticipant', {
    ParticipantId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    RegistrationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tblTournamentRegistration',
            key: 'RegistrationId'
        }
    },
    PlayerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tblPlayer',
            key: 'PlayerId'
        }
    },
    FullName: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    Phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    PhotoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    DOB: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    Gender: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    tableName: 'tblTournamentParticipant',
    timestamps: false
});

module.exports = TournamentParticipant;
