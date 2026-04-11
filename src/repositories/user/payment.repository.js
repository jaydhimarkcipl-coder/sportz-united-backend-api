const { Transaction, PlayerWallet } = require('../../models');

class PaymentRepository {
    async createPaymentRecord(paymentData, transaction) {
        return await Transaction.create(paymentData, { transaction });
    }

    async getPlayerWallet(playerId) {
        return await PlayerWallet.findOne({
            where: { PlayerId: playerId, WalletType: 'Player' } // Fetch global wallet
        });
    }

    async getArenaWallet(playerId, arenaId) {
        const { Arena } = require('../../models');
        return await PlayerWallet.findOne({
            where: { PlayerId: playerId, ArenaId: arenaId },
            include: [{
                model: Arena,
                attributes: ['Name']
            }]
        });
    }

    async getAllArenaWallets(playerId) {
        const { Arena } = require('../../models');
        const { Op } = require('sequelize');
        return await PlayerWallet.findAll({
            where: {
                PlayerId: playerId,
                ArenaId: { [Op.ne]: null },
                Balance: { [Op.gt]: 0 }
            },
            include: [{
                model: Arena,
                attributes: ['Name']
            }]
        });
    }

    async deductFromWallet(playerId, amount, transaction, arenaId = null) {
        let wallet;
        if (arenaId) {
            wallet = await this.getArenaWallet(playerId, arenaId);
            console.log(`--- Wallet Deduction (Arena Specific) --- Player: ${playerId}, Arena: ${arenaId}, Required: ${amount}`);
        } else {
            wallet = await this.getPlayerWallet(playerId);
            console.log(`--- Wallet Deduction (Global) --- Player: ${playerId}, Required: ${amount}`);
        }

        if (!wallet) {
            console.error(`Wallet not found for Player: ${playerId}${arenaId ? `, Arena: ${arenaId}` : ''}`);
            throw new Error("Wallet not found for this transaction");
        }

        const currentBalance = parseFloat(wallet.Balance) || 0;
        const requiredAmount = parseFloat(amount) || 0;

        console.log(`Current Balance: ${currentBalance}, Required: ${requiredAmount}`);

        if (currentBalance < requiredAmount) {
            throw new Error(`Insufficient funds in wallet. Required: ${requiredAmount}, Available: ${currentBalance}`);
        }

        wallet.Balance = currentBalance - requiredAmount;
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
