const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookingPlayer = sequelize.define('BookingPlayer', {
    BookingPlayerId: {
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
    QRCode: {
        type: DataTypes.STRING(255)
    },
    PlayerType: {
        type: DataTypes.STRING(50)
    }
}, {
    tableName: 'tblBookingPlayer',
    timestamps: false
});

module.exports = BookingPlayer;
