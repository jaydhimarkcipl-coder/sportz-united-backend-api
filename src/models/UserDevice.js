const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserDevice = sequelize.define('UserDevice', {
    DeviceId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tblUser',
            key: 'UserId'
        }
    },
    PlayerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tblPlayer',
            key: 'PlayerId'
        }
    },
    FCMToken: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true
    },
    DeviceType: {
        type: DataTypes.STRING(50)
    },
    CreatedDate: {
        type: DataTypes.STRING,
        defaultValue: () => new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
}, {
    tableName: 'tblUserDevice',
    timestamps: false
});

module.exports = UserDevice;
