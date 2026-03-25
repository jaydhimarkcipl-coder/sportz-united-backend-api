const { sequelize } = require('../config/database');

const User = require('./User');
const Player = require('./Player');
const Arena = require('./Arena');
const Sport = require('./Sport');
const Court = require('./Court');
const CourtSlot = require('./CourtSlot');
const Booking = require('./Booking');
const BookingDetail = require('./BookingDetail');
const BookingPlayer = require('./BookingPlayer');
const Amenity = require('./Amenity');
const ArenaAmenity = require('./ArenaAmenity');
const PlayerWallet = require('./PlayerWallet');
const Transaction = require('./Transaction');
const RefreshToken = require('./RefreshToken');

// --- Associations ---

// User & Arena
User.hasMany(Arena, { foreignKey: 'OwnerUserId' });
Arena.belongsTo(User, { foreignKey: 'OwnerUserId' });

// Arena & Court
Arena.hasMany(Court, { foreignKey: 'ArenaId' });
Court.belongsTo(Arena, { foreignKey: 'ArenaId' });

// Sport & Court
Sport.hasMany(Court, { foreignKey: 'SportId' });
Court.belongsTo(Sport, { foreignKey: 'SportId' });

// Court & CourtSlot
Court.hasMany(CourtSlot, { foreignKey: 'CourtId' });
CourtSlot.belongsTo(Court, { foreignKey: 'CourtId' });

// Player & Booking
Player.hasMany(Booking, { foreignKey: 'PlayerId' });
Booking.belongsTo(Player, { foreignKey: 'PlayerId' });

// Court & Booking
Court.hasMany(Booking, { foreignKey: 'CourtId' });
Booking.belongsTo(Court, { foreignKey: 'CourtId' });

// Booking & BookingDetail
Booking.hasMany(BookingDetail, { foreignKey: 'BookingId' });
BookingDetail.belongsTo(Booking, { foreignKey: 'BookingId' });

// CourtSlot & BookingDetail
CourtSlot.hasMany(BookingDetail, { foreignKey: 'SlotId' });
BookingDetail.belongsTo(CourtSlot, { foreignKey: 'SlotId' });

// Booking & BookingPlayer
Booking.hasMany(BookingPlayer, { foreignKey: 'BookingId' });
BookingPlayer.belongsTo(Booking, { foreignKey: 'BookingId' });

// Player & BookingPlayer
Player.hasMany(BookingPlayer, { foreignKey: 'PlayerId' });
BookingPlayer.belongsTo(Player, { foreignKey: 'PlayerId' });

// Arena & ArenaAmenity
Arena.hasMany(ArenaAmenity, { foreignKey: 'ArenaId' });
ArenaAmenity.belongsTo(Arena, { foreignKey: 'ArenaId' });

// Amenity & ArenaAmenity
Amenity.hasMany(ArenaAmenity, { foreignKey: 'AmenityId' });
ArenaAmenity.belongsTo(Amenity, { foreignKey: 'AmenityId' });

// Player & PlayerWallet
Player.hasOne(PlayerWallet, { foreignKey: 'PlayerId' });
PlayerWallet.belongsTo(Player, { foreignKey: 'PlayerId' });

// Booking & Transaction
Booking.hasMany(Transaction, { foreignKey: 'BookingId' });
Transaction.belongsTo(Booking, { foreignKey: 'BookingId' });

// Player & Transaction
Player.hasMany(Transaction, { foreignKey: 'PlayerId' });
Transaction.belongsTo(Player, { foreignKey: 'PlayerId' });

// User & RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'UserId', as: 'RefreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'UserId', as: 'User' });

// User & Arena (Staff context)
User.belongsTo(Arena, { foreignKey: 'ArenaId', as: 'Arena' });
Arena.hasMany(User, { foreignKey: 'ArenaId', as: 'Staff' });


module.exports = {
    sequelize,
    User,
    Player,
    Arena,
    Sport,
    Court,
    CourtSlot,
    Booking,
    BookingDetail,
    BookingPlayer,
    Amenity,
    ArenaAmenity,
    PlayerWallet,
    Transaction,
    RefreshToken
};
