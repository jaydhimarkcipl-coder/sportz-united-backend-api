const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlayerWallet = sequelize.define('PlayerWallet', {
    WalletId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    WalletType: {
        type: DataTypes.STRING(50)
    },
    PlayerId: {
        type: DataTypes.INTEGER
    },
    Balance: {
        type: DataTypes.DECIMAL(10, 2)
    },
    ArenaId: {
        type: DataTypes.INTEGER
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ModifiedDate: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'tblPlayerWallet',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = PlayerWallet;
