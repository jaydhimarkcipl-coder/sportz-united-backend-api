const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ArenaReview = sequelize.define('ArenaReview', {
    ReviewId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ArenaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    PlayerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false
    },
    ReviewText: {
        type: DataTypes.STRING,
        allowNull: true
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('GETDATE()')
    },
    ModifiedDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'tblArenaReview',
    timestamps: false
});

module.exports = ArenaReview;
