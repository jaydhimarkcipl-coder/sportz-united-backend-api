const paymentRepo = require('../../repositories/user/payment.repository');

class PaymentService {
    async processPayment(paymentData, transaction) {
        // If payment method is wallet, deduct from player wallet
        if (paymentData.PaymentMethod === 'Wallet') {
            await paymentRepo.deductFromWallet(paymentData.PlayerId, paymentData.Amount, transaction);
        }

        const record = {
            BookingId: paymentData.BookingId,
            PlayerId: paymentData.PlayerId,
            PaymentMethod: paymentData.PaymentMethod,
            PaymentStatus: 'Success',
            Amount: paymentData.Amount,
            PaymentType: 'Booking',
            TransactionId: paymentData.TransactionId,
            Notes: 'Booking Payment'
        };

        return await paymentRepo.createPaymentRecord(record, transaction);
    }

    async getWalletBalance(playerId) {
        const wallet = await paymentRepo.getPlayerWallet(playerId);
        if (!wallet) return { balance: 0 };
        return { balance: wallet.Balance };
    }
}

module.exports = new PaymentService();
