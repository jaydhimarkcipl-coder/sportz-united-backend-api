const { Booking, BookingDetail, BookingPlayer, CourtSlot, Player } = require('../../models');
const { Op } = require('sequelize');

class BookingRepository {
    async findOverlappingBookings(courtId, bookingDate, startTime, endTime) {
        return await Booking.findAll({
            where: {
                CourtId: courtId,
                BookingDate: bookingDate,
                Status: {
                    [Op.ne]: 'Cancelled'
                },
                [Op.or]: [
                    {
                        StartTime: { [Op.between]: [startTime, endTime] }
                    },
                    {
                        EndTime: { [Op.between]: [startTime, endTime] }
                    },
                    {
                        [Op.and]: [
                            { StartTime: { [Op.lte]: startTime } },
                            { EndTime: { [Op.gte]: endTime } }
                        ]
                    }
                ]
            }
        });
    }

    async createBookingWithDetailsTransaction(bookingData, detailsData, transaction) {
        const booking = await Booking.create(bookingData, { transaction });

        const bookingDetails = detailsData.map(d => ({
            ...d,
            BookingId: booking.BookingId
        }));

        await BookingDetail.bulkCreate(bookingDetails, { transaction });

        // Associate user as the main player
        await BookingPlayer.create({
            BookingId: booking.BookingId,
            PlayerId: bookingData.PlayerId,
            PlayerType: 'Main'
        }, { transaction });

        return booking;
    }

    async findBookingsByPlayerId(playerId) {
        const { BookingDetail, Court, Arena } = require('../../models');
        return await Booking.findAll({
            where: { PlayerId: playerId },
            include: [
                { model: BookingDetail },
                { model: Court, include: [{ model: Arena }] }
            ],
            order: [['BookingDate', 'DESC']]
        });
    }

    async updateBookingStatus(bookingId, status) {
        return await Booking.update({ Status: status }, { where: { BookingId: bookingId } });
    }

    async findBookingById(bookingId) {
        return await Booking.findByPk(bookingId);
    }
}

module.exports = new BookingRepository();
