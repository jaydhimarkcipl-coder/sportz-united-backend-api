const { Transaction, PlayerWallet } = require('../../models');

class PaymentRepository {
    async createPaymentRecord(paymentData, transaction) {
        return await Transaction.create(paymentData, { transaction });
    }

    async getPlayerWallet(playerId) {
        return await PlayerWallet.findOne({
            where: { PlayerId: playerId }
        });
    }

    async deductFromWallet(playerId, amount, transaction) {
        const wallet = await this.getPlayerWallet(playerId);
        if(!wallet) throw new Error("Wallet not found");
        if(wallet.Balance < amount) throw new Error("Insufficient funds in wallet");
        
        wallet.Balance -= amount;
        await wallet.save({ transaction });
        return wallet;
    }
}

module.exports = new PaymentRepository();
