const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ArenaAmenity = sequelize.define('ArenaAmenity', {
    ArenaAmenitiesId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ArenaId: {
        type: DataTypes.INTEGER
    },
    AmenityId: {
        type: DataTypes.INTEGER
    },
    IsActive: {
        type: DataTypes.BOOLEAN
    }
}, {
    tableName: 'tblArenaAmenities',
    timestamps: false
});

module.exports = ArenaAmenity;
