const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WhatsAppLog = sequelize.define('WhatsAppLog', {
    LogId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    TemplateName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Data: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Response: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Status: {
        type: DataTypes.STRING(20),
        allowNull: false // Success, Error
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('GETDATE()')
    }
}, {
    tableName: 'tblWhatsAppLog',
    timestamps: false
});

module.exports = WhatsAppLog;
