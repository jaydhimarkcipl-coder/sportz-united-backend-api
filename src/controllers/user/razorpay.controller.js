const Razorpay = require('razorpay');
const crypto = require('crypto');
const paymentService = require('../../services/user/payment.service');

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

class RazorpayController {
    async createOrder(req, res, next) {
        try {
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: 'Valid amount is required' });
            }

            const options = {
                amount: Math.round(amount * 100), // Amount in paise
                currency: 'INR',
                receipt: `receipt_order_${Date.now()}`
            };

            const instance = getRazorpayInstance();

            console.log('--- Razorpay Order Creation ---');
            console.log('Options:', JSON.stringify(options, null, 2));

            const order = await instance.orders.create(options);
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            console.error('RAZORPAY ORDER ERROR:', error);
            next(error);
        }
    }

    async verifyPayment(req, res, next) {
        try {
            console.log('--- Razorpay Verify Diagnostics ---');
            console.log('Body:', JSON.stringify(req.body, null, 2));

            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
            const playerId = req.user.id;

            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            if (expectedSignature === razorpay_signature) {
                // Ensure amount is treated as a number
                const numAmount = parseFloat(amount);
                console.log(`Verified payment. Adding ${numAmount} to wallet for player ${playerId}`);
                
                await paymentService.addWalletBalance(playerId, numAmount, razorpay_payment_id, razorpay_order_id);
                res.status(200).json({ success: true, message: 'Payment verified successfully and wallet updated' });
            } else {
                console.error('Signature Mismatch. Expected:', expectedSignature, 'Received:', razorpay_signature);
                res.status(400).json({ success: false, message: 'Invalid payment signature' });
            }
        } catch (error) {
            console.error('RAZORPAY VERIFY ERROR:', error);
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const playerId = req.user.id;
            const { limit } = req.query;
            const transactions = await paymentService.getPlayerTransactions(playerId, limit);
            res.status(200).json({ success: true, data: transactions });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RazorpayController();
