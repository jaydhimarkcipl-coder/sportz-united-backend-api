const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ArenaSport = sequelize.define('ArenaSport', {
    arenaSportsId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ArenaSportsId'
    },
    arenaId: {
        type: DataTypes.INTEGER,
        field: 'ArenaId'
    },
    sportId: {
        type: DataTypes.INTEGER,
        field: 'SportId'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        field: 'IsActive',
        defaultValue: true
    }
}, {
    tableName: 'tblArenaSports',
    timestamps: false
});

module.exports = ArenaSport;
