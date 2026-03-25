const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Court = sequelize.define('Court', {
    CourtId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ArenaId: {
        type: DataTypes.INTEGER
    },
    SportId: {
        type: DataTypes.INTEGER
    },
    CourtName: {
        type: DataTypes.STRING(100)
    },
    CategoryId: {
        type: DataTypes.INTEGER
    },
    SlotDurationMin: {
        type: DataTypes.INTEGER
    },
    Description: {
        type: DataTypes.STRING(255)
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
    }
}, {
    tableName: 'tblCourt',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = Court;
