const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Amenity = sequelize.define('Amenity', {
    AmenityId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING(100)
    },
    IconUrl: {
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
    tableName: 'tblAmenities',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = Amenity;
