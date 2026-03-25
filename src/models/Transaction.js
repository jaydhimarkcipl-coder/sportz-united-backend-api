const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    PaymentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    BookingId: {
        type: DataTypes.INTEGER
    },
    PlayerId: {
        type: DataTypes.INTEGER
    },
    PaymentMethod: {
        type: DataTypes.STRING(50)
    },
    PaymentStatus: {
        type: DataTypes.STRING(50)
    },
    Amount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    PaymentType: {
        type: DataTypes.STRING(50)
    },
    TransactionId: {
        type: DataTypes.STRING(100)
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    Notes: {
        type: DataTypes.STRING(255)
    },
    TopUpByArenaUserId: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'tblTransaction',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: false
});

module.exports = Transaction;
