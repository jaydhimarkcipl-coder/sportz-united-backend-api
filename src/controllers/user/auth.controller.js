const authService = require('../../services/user/auth.service');

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await authService.getMe(req.user.id, req.user.type);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refresh(refreshToken);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        res.status(200).json({ success: true, message: 'Reset link sent if email exists' });
    }

    async resetPassword(req, res, next) {
        res.status(200).json({ success: true, message: 'Password reset successful' });
    }

    async sendOtp(req, res, next) {
        try {
            const { phone } = req.body;
            const result = await authService.sendOtp(phone);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async loginWithOtp(req, res, next) {
        try {
            const { phone, otp } = req.body;
            const result = await authService.loginWithOtp(phone, otp);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
