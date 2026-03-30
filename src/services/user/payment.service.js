const paymentRepo = require('../../repositories/user/payment.repository');
const { sequelize } = require('../../models');

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

    async addWalletBalance(playerId, amount, paymentId, orderId) {
        const transaction = await sequelize.transaction();
        try {
            // 1. Add funds to wallet
            await paymentRepo.addFundsToWallet(playerId, amount, transaction);
            
            // 2. Create transaction record
            const record = {
                PlayerId: playerId,
                PaymentMethod: 'Razorpay',
                PaymentStatus: 'Success',
                Amount: amount,
                PaymentType: 'Deposit',
                TransactionId: paymentId,
                Notes: `Wallet Topup - OrderID: ${orderId}`
            };
            await paymentRepo.createPaymentRecord(record, transaction);
            
            await transaction.commit();
        } catch (error) {
            console.error('--- WALLET TOPUP ERROR ---', error);
            // In MSSQL, if the error is severe, the transaction is already rolled back.
            // Check if transaction is still valid before calling rollback.
            if (transaction && !transaction.finished) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Rollback failed (already rolled back by DB?):', rollbackError.message);
                }
            }
            throw error;
        }
    }
}

module.exports = new PaymentService();
