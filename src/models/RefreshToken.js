const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
    TokenId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Token: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    ExpiresAt: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'tblRefreshToken',
    timestamps: false
});

module.exports = RefreshToken;
