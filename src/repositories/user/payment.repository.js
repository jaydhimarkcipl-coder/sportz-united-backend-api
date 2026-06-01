const { Transaction, PlayerWallet } = require('../../models');
const { Op } = require('sequelize');

class PaymentRepository {
    async createPaymentRecord(paymentData, transaction) {
        return await Transaction.create(paymentData, { transaction });
    }

    async getPlayerWallet(playerId) {
        let wallet = await PlayerWallet.findOne({
            where: { PlayerId: playerId, WalletType: 'Player' },
        });
        if (!wallet) {
            wallet = await PlayerWallet.findOne({
                where: {
                    PlayerId: playerId,
                    [Op.or]: [
                        { WalletType: { [Op.like]: '%Universal%' } },
                        { WalletType: 'Universal' },
                    ],
                },
                order: [['Balance', 'DESC']],
            });
        }
        if (!wallet) {
            wallet = await PlayerWallet.findOne({
                where: { PlayerId: playerId, ArenaId: null },
                order: [['Balance', 'DESC']],
            });
        }
        return wallet;
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

    /**
     * Pick a wallet row that can pay `amount` — same rows admin GET /wallet returns.
     * Prefer venue wallet when arenaId set; otherwise universal / null-ArenaId; then any funded row.
     */
    async resolveWalletForDeduction(playerId, amount, preferredArenaId = null, transaction = null) {
        const pid = parseInt(String(playerId), 10);
        if (!Number.isFinite(pid) || pid <= 0) return null;

        const queryOpts = {
            where: { PlayerId: pid },
            order: [['Balance', 'DESC']],
        };
        if (transaction) queryOpts.transaction = transaction;

        const wallets = await PlayerWallet.findAll(queryOpts);
        if (!wallets.length) return null;

        const required = parseFloat(amount) || 0;
        const hasFunds = (w) => (parseFloat(w.Balance) || 0) >= required;

        if (preferredArenaId != null && preferredArenaId !== '') {
            const arenaWallet = wallets.find(
                (w) => Number(w.ArenaId) === Number(preferredArenaId),
            );
            if (arenaWallet && hasFunds(arenaWallet)) return arenaWallet;
        }

        for (const w of wallets) {
            const type = String(w.WalletType || '').toLowerCase();
            if (type === 'player' || type.includes('universal')) {
                if (hasFunds(w)) return w;
            }
        }

        const nullArenaWallet = wallets.find(
            (w) => w.ArenaId == null || w.ArenaId === '',
        );
        if (nullArenaWallet && hasFunds(nullArenaWallet)) return nullArenaWallet;

        if (preferredArenaId != null && preferredArenaId !== '') {
            const arenaWallet = wallets.find(
                (w) => Number(w.ArenaId) === Number(preferredArenaId),
            );
            if (arenaWallet) return arenaWallet;
        }

        return wallets.find((w) => (parseFloat(w.Balance) || 0) > 0) || wallets[0];
    }

    async deductFromWallet(playerId, amount, transaction, arenaId = null) {
        const wallet = await this.resolveWalletForDeduction(
            playerId,
            amount,
            arenaId,
            transaction,
        );

        if (!wallet) {
            console.error(
                `Wallet not found for Player: ${playerId}${arenaId ? `, Arena: ${arenaId}` : ''} (no wallet rows)`,
            );
            throw new Error("Wallet not found for this transaction");
        }

        console.log(
            `--- Wallet Deduction --- Player: ${playerId}, ArenaId: ${wallet.ArenaId}, Type: ${wallet.WalletType}, Required: ${amount}`,
        );

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
