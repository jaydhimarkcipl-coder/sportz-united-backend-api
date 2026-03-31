const { Booking, BookingDetail, BookingPlayer, CourtSlot, Player, Transaction } = require('../../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

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

        // --- QR Code Generation ---
        const qrContent = booking.BookingCode;
        const qrDir = path.join(__dirname, '../../../uploads/qrcodes');
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
        }

        const qrFilename = `qr-${booking.BookingCode}.png`;
        const qrPath = path.join(qrDir, qrFilename);
        const dbPath = `uploads/qrcodes/${qrFilename}`;

        try {
            // Using toFileSync if available or just toFile
            await QRCode.toFile(qrPath, qrContent);
            console.log(`QR code generated for ${booking.BookingCode}`);
        } catch (err) {
            console.error('Failed to generate QR code:', err);
        }

        // Associate user as the main player with the QR code
        await BookingPlayer.create({
            BookingId: booking.BookingId,
            PlayerId: bookingData.PlayerId,
            PlayerType: 'Main',
            QRCode: dbPath
        }, { transaction });

        return booking;
    }

    async findBookingsByPlayerId(playerId) {
        const { BookingDetail, BookingPlayer, Court, Arena } = require('../../models');
        return await Booking.findAll({
            where: { PlayerId: playerId },
            include: [
                { model: BookingDetail },
                { model: BookingPlayer },
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

    async clearAllBookings() {
        // Force delete child records first due to foreign keys
        await BookingPlayer.destroy({ where: {}, force: true });
        await BookingDetail.destroy({ where: {}, force: true });
        
        // Only delete transactions related to bookings, not wallet topups
        await Transaction.destroy({ 
            where: { 
                BookingId: { [Op.ne]: null } 
            },
            force: true
        });
        
        await Booking.destroy({ where: {}, force: true });
    }
}

module.exports = new BookingRepository();
