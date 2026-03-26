const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Amenity = sequelize.define('Amenity', {
    amenityId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'AmenityId'
    },
    name: {
        type: DataTypes.STRING(100),
        field: 'Name'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        field: 'IsActive',
        defaultValue: true
    },
    isDelete: {
        type: DataTypes.BOOLEAN,
        field: 'IsDelete',
        defaultValue: false
    },
    createdDate: {
        type: DataTypes.DATE,
        field: 'CreatedDate',
        allowNull: true
    },
    modifiedDate: {
        type: DataTypes.DATE,
        field: 'ModifiedDate',
        allowNull: true
    }
}, {
    tableName: 'tblAmenities',
    timestamps: false
});

module.exports = Amenity;
