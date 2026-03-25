const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sport = sequelize.define('Sport', {
    SportId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING(100)
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
    SportType: {
        type: DataTypes.STRING(50)
    },
    NoOfPerson: {
        type: DataTypes.INTEGER
    },
    SportImageUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'tblSports',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = Sport;
