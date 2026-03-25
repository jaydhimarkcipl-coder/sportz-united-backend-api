const { PlayerWallet, Transaction, Booking, Court, Player } = require('../../models');
const { Op } = require('sequelize');

class AdminWalletRepository {
    async getWalletByPlayerAndArena(playerId, arenaIds) {
        const where = { PlayerId: playerId };
        if (arenaIds) where.ArenaId = arenaIds;
        return await PlayerWallet.findAll({ where });
    }

    async topUpWallet(playerId, amount, arenaId, adminUserId, t) {
        let wallet = await PlayerWallet.findOne({
            where: { PlayerId: playerId, ArenaId: arenaId },
            transaction: t
        });

        if (wallet) {
            wallet.Balance = parseFloat(wallet.Balance) + parseFloat(amount);
            await wallet.save({ transaction: t });
        } else {
            wallet = await PlayerWallet.create({
                PlayerId: playerId,
                ArenaId: arenaId,
                Balance: amount,
                WalletType: 'Arena Specific'
            }, { transaction: t });
        }

        const transactionRecord = await Transaction.create({
            PlayerId: playerId,
            Amount: amount,
            PaymentType: 'Credit',
            PaymentMethod: 'Offline/Admin',
            PaymentStatus: 'Success',
            Notes: 'Offline Wallet Top-Up via Admin',
            TopUpByArenaUserId: adminUserId
        }, { transaction: t });

        return { wallet, transactionRecord };
    }

    async getTransactions(arenaIds, adminUserId) {
        const orConditions = [{ TopUpByArenaUserId: adminUserId }];
        if (arenaIds) {
            orConditions.push({ '$Booking.Court.ArenaId$': { [Op.in]: arenaIds } });
        } else {
            // If super_admin, just see all transactions
            return await Transaction.findAll({
                include: [
                    {
                        model: Booking,
                        as: 'Booking',
                        required: false,
                        include: [{ model: Court, as: 'Court', required: false }]
                    },
                    {
                        model: Player,
                        as: 'Player',
                        attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                    }
                ],
                order: [['CreatedDate', 'DESC']]
            });
        }

        return await Transaction.findAll({
            where: { [Op.or]: orConditions },
            include: [
                {
                    model: Booking,
                    as: 'Booking',
                    required: false,
                    include: [{ model: Court, as: 'Court', required: false }]
                },
                {
                    model: Player,
                    as: 'Player',
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                }
            ],
            order: [['CreatedDate', 'DESC']]
        });
    }
}

module.exports = new AdminWalletRepository();
