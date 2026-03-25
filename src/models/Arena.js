const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Arena = sequelize.define('Arena', {
    ArenaId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    OwnerUserId: {
        type: DataTypes.INTEGER
    },
    Name: {
        type: DataTypes.STRING(150)
    },
    LogoUrl: {
        type: DataTypes.STRING(255)
    },
    AddressLine1: {
        type: DataTypes.STRING(255)
    },
    AddressLine2: {
        type: DataTypes.STRING(255)
    },
    City: {
        type: DataTypes.STRING(100)
    },
    State: {
        type: DataTypes.STRING(100)
    },
    PinCode: {
        type: DataTypes.STRING(20)
    },
    Latitude: {
        type: DataTypes.DECIMAL(10, 6)
    },
    Longitude: {
        type: DataTypes.DECIMAL(10, 6)
    },
    Phone: {
        type: DataTypes.STRING(20)
    },
    Email: {
        type: DataTypes.STRING(150)
    },
    OpenTime: {
        type: DataTypes.TIME
    },
    CloseTime: {
        type: DataTypes.TIME
    },
    IsActive: {
        type: DataTypes.BOOLEAN
    },
    IsDelete: {
        type: DataTypes.BOOLEAN
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ModifiedDate: {
        type: DataTypes.DATE
    },
    AverageRating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0
    },
    ReviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'tblArena',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = Arena;
