const paymentRepo = require('../../repositories/user/payment.repository');
const deviceRepo = require('../../repositories/user/device.repository');
const fcmUtil = require('../../utils/fcm.util');
const { sequelize } = require('../../models');

class PaymentService {
    async processPayment(paymentData, transaction) {
        // If payment method is wallet, deduct from relevant wallet
        if (paymentData.PaymentMethod === 'Wallet') {
            await paymentRepo.deductFromWallet(paymentData.PlayerId, paymentData.Amount, transaction);
        } else if (paymentData.PaymentMethod === 'ArenaWallet') {
            if (!paymentData.ArenaId) throw new Error("ArenaId is required for ArenaWallet payment");
            await paymentRepo.deductFromWallet(paymentData.PlayerId, paymentData.Amount, transaction, paymentData.ArenaId);
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

    async getArenaWalletBalance(playerId, arenaId) {
        const wallet = await paymentRepo.getArenaWallet(playerId, arenaId);
        if (!wallet) return { balance: 0 };
        return { 
            balance: wallet.Balance, 
            arenaId: wallet.ArenaId,
            arenaName: wallet.Arena ? wallet.Arena.Name : null
        };
    }

    async getAllArenaBalances(playerId) {
        const wallets = await paymentRepo.getAllArenaWallets(playerId);
        return wallets.map(w => ({
            balance: w.Balance,
            arenaId: w.ArenaId,
            arenaName: w.Arena ? w.Arena.Name : null
        }));
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

            // --- Push Notifications ---
            try {
                const playerTokens = await deviceRepo.getTokensByPlayerId(playerId);
                if (playerTokens.length > 0) {
                    await fcmUtil.sendToMultipleDevices(playerTokens, {
                        title: 'Wallet Credited 💰',
                        body: `₹${amount} has been successfully added to your Sportz United wallet.`
                    });
                }
            } catch (notifError) {
                console.error('--- PUSH NOTIFICATION ERROR (WALLET TOPUP) ---', notifError);
            }
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

    async getPlayerTransactions(playerId, limit) {
        return await paymentRepo.findTransactionsByPlayerId(playerId, limit);
    }

    async refundBooking(refundData, transaction) {
        const { BookingId, PlayerId, Amount, Notes } = refundData;

        // 1. Add funds back to wallet
        await paymentRepo.addFundsToWallet(PlayerId, Amount, transaction);

        // 2. Create refund transaction record
        const record = {
            BookingId: BookingId,
            PlayerId: PlayerId,
            PaymentMethod: 'Wallet', // Internal refund always to wallet
            PaymentStatus: 'Success',
            Amount: Amount,
            PaymentType: 'Refund',
            TransactionId: `REF-${Date.now()}`,
            Notes: Notes || `Refund for Booking #${BookingId}`
        };

        const result = await paymentRepo.createPaymentRecord(record, transaction);

        // --- Push Notifications (Handled by caller or added here) ---
        // Since refundBooking is usually called from inside another service (like BookingService),
        // we can either add it here or in the caller. 
        // Adding it here ensures it's always sent.
        // Wait, if it's inside a transaction from another service, we should probably do it after that transaction commits.
        // However, this method takes a 'transaction' parameter, so we MUST call it after that transaction is committed by the CALLER.
        // For now, I'll rely on the BookingService calling it, but if other places call it, I'll add a hook.
        
        // Actually, BookingService already handles the cancellation notification which mentions refund.
        // But for a pure wallet refund (maybe manual), we can add it.
        // I'll skip it here for now to avoid duplicate notifications in Booking cancellation flow.
        
        return result;
    }
}

module.exports = new PaymentService();
