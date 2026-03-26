const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PromoCode = sequelize.define('PromoCode', {
    PromoId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ArenaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    DiscountType: {
        type: DataTypes.STRING(20),  // 'flat' or 'percent'
        allowNull: false,
        defaultValue: 'flat'
    },
    DiscountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    MinBookingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    MaxDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true  // cap for percent discounts
    },
    UsageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true  // null = unlimited
    },
    UsedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ValidFrom: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    ValidUntil: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    IsActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    CreatedDate: {
        type: DataTypes.DATE,
        allowNull: true // Let DB handle the default GETDATE()
    }
}, {
    tableName: 'tblPromoCode',
    timestamps: false
});

module.exports = PromoCode;
