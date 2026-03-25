const paymentService = require('../../services/user/payment.service');

class PaymentController {
    async getBalance(req, res, next) {
        try {
            const playerId = req.params.playerId || req.user.id;
            const balanceData = await paymentService.getWalletBalance(playerId);
            res.status(200).json({ success: true, data: balanceData });
        } catch (error) {
            next(error);
        }
    }

    // Explicit manual payment processing if requested
    async addPayment(req, res, next) {
        try {
            const { bookingId, amount, paymentMethod } = req.body;
            const playerId = req.user.id;

            // This is just a mockup for adding funds vs paying for booking
            // Usually transaction comes via the overarching booking service.
            const record = await paymentService.processPayment({
                BookingId: bookingId,
                PlayerId: playerId,
                PaymentMethod: paymentMethod,
                Amount: amount,
                TransactionId: `TXN-MANUAL-${Date.now()}`
            });

            res.status(201).json({ success: true, message: 'Payment recorded', data: record });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PaymentController();
