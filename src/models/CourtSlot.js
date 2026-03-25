const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourtSlot = sequelize.define('CourtSlot', {
    SlotId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    CourtId: {
        type: DataTypes.INTEGER
    },
    StartTime: {
        type: DataTypes.TIME
    },
    EndTime: {
        type: DataTypes.TIME
    },
    DurationMin: {
        type: DataTypes.INTEGER
    },
    BasePrice: {
        type: DataTypes.DECIMAL(10, 2)
    },
    FinalPrice: {
        type: DataTypes.DECIMAL(10, 2)
    },
    PricingRuleId: {
        type: DataTypes.INTEGER
    },
    DayName: {
        type: DataTypes.STRING(20)
    },
    SlotType: {
        type: DataTypes.STRING(50)
    },
    IsHalfSlot: {
        type: DataTypes.BOOLEAN
    },
    ParentSlotId: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'tblCourtSlot',
    timestamps: false // No CreatedDate/ModifiedDate in schema
});

module.exports = CourtSlot;
