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

    async addFundsToWallet(playerId, amount, transaction) {
        let wallet = await this.getPlayerWallet(playerId);
        
        // Ensure amount is a number
        const numAmount = parseFloat(amount) || 0;
        console.log(`--- addFundsToWallet: PlayerId=${playerId}, Amount=${numAmount} ---`);

        if (!wallet) {
            const createData = {
                PlayerId: playerId,
                Balance: numAmount,
                WalletType: 'Player',
                ArenaId: null
            };
            console.log('Creating wallet with data:', JSON.stringify(createData, null, 2));
            wallet = await PlayerWallet.create(createData, { transaction });
        } else {
            const currentBalance = parseFloat(wallet.Balance) || 0;
            wallet.Balance = currentBalance + numAmount;
            await wallet.save({ transaction });
        }
        
        return wallet;
    }

    async findTransactionsByPlayerId(playerId, limit) {
        return await Transaction.findAll({
            where: { PlayerId: playerId },
            order: [['CreatedDate', 'DESC']],
            limit: limit ? parseInt(limit) : undefined
        });
    }
}

module.exports = new PaymentRepository();
