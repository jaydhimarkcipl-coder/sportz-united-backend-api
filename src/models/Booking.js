const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
    BookingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    BookingCode: {
        type: DataTypes.STRING(50)
    },
    PlayerId: {
        type: DataTypes.INTEGER
    },
    CourtId: {
        type: DataTypes.INTEGER
    },
    BookingDate: {
        type: DataTypes.DATEONLY
    },
    StartTime: {
        type: DataTypes.TIME
    },
    EndTime: {
        type: DataTypes.TIME
    },
    TotalAmount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    DiscountAmount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    GSTAmount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    NetAmount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    Status: {
        type: DataTypes.STRING(50)
    },
    Duration: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'tblBooking',
    timestamps: false // No CreatedDate/ModifiedDate in schema
});

module.exports = Booking;
