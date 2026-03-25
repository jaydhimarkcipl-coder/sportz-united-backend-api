const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Player = sequelize.define('Player', {
    PlayerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    FullName: {
        type: DataTypes.STRING(150)
    },
    Phone: {
        type: DataTypes.STRING(20)
    },
    Email: {
        type: DataTypes.STRING(150)
    },
    ProfilePhotoUrl: {
        type: DataTypes.STRING(255)
    },
    DateOfBirth: {
        type: DataTypes.DATEONLY
    },
    Gender: {
        type: DataTypes.STRING(10)
    },
    City: {
        type: DataTypes.STRING(100)
    },
    Address: {
        type: DataTypes.STRING(255)
    },
    RegisteredViaGuestInvite: {
        type: DataTypes.BOOLEAN
    },
    IsActive: {
        type: DataTypes.BOOLEAN
    },
    IsVerified: {
        type: DataTypes.BOOLEAN
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ModifiedDate: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'tblPlayer',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = Player;
