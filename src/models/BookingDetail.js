const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookingDetail = sequelize.define('BookingDetail', {
    BookingDetailId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    BookingId: {
        type: DataTypes.INTEGER
    },
    SlotId: {
        type: DataTypes.INTEGER
    },
    StartTime: {
        type: DataTypes.TIME
    },
    EndTime: {
        type: DataTypes.TIME
    },
    Amount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    IsHalfSlot: {
        type: DataTypes.BOOLEAN
    },
    Duration: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'tblBookingDetail',
    timestamps: false
});

module.exports = BookingDetail;
