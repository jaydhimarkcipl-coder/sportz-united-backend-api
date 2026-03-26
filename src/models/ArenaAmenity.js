const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ArenaAmenity = sequelize.define('ArenaAmenity', {
    arenaAmenitiesId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ArenaAmenitiesId'
    },
    arenaId: {
        type: DataTypes.INTEGER,
        field: 'ArenaId'
    },
    amenityId: {
        type: DataTypes.INTEGER,
        field: 'AmenityId'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        field: 'IsActive',
        defaultValue: true
    }
}, {
    tableName: 'tblArenaAmenities',
    timestamps: false
});

module.exports = ArenaAmenity;
