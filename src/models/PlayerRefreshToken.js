const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlayerRefreshToken = sequelize.define('PlayerRefreshToken', {
    TokenId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    PlayerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tblPlayer',
            key: 'PlayerId'
        }
    },
    Token: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    ExpiresAt: {
        type: DataTypes.STRING,
        allowNull: false
    },
    CreatedDate: {
        type: DataTypes.STRING,
        defaultValue: () => new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    IsRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tblPlayerRefreshToken',
    timestamps: false
});

module.exports = PlayerRefreshToken;
