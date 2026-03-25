const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    UserId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    FullName: {
        type: DataTypes.STRING(150)
    },
    Email: {
        type: DataTypes.STRING(150)
    },
    PasswordHash: {
        type: DataTypes.STRING(255)
    },
    RoleId: {
        type: DataTypes.INTEGER
    },
    IsActive: {
        type: DataTypes.BOOLEAN
    },
    UserType: {
        type: DataTypes.STRING(50)
    },
    LastLoginAt: {
        type: DataTypes.DATE
    },
    PasswordResetToken: {
        type: DataTypes.STRING(255)
    },
    CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ModifiedDate: {
        type: DataTypes.DATE
    },
    CreatedBy: {
        type: DataTypes.INTEGER
    },
    ModifiedBy: {
        type: DataTypes.INTEGER
    },
    IsVerified: {
        type: DataTypes.BOOLEAN
    },
    ProfilePhotoUrl: {
        type: DataTypes.STRING(255)
    },
    ArenaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tblArena',
            key: 'ArenaId'
        }
    }
}, {
    tableName: 'tblUser',
    timestamps: true,
    createdAt: 'CreatedDate',
    updatedAt: 'ModifiedDate'
});

module.exports = User;
