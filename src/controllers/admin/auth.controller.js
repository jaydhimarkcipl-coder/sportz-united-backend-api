const adminAuthService = require('../../services/admin/auth.service');

class AdminAuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await adminAuthService.login(email, password);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await adminAuthService.refresh(refreshToken);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await adminAuthService.logout(refreshToken);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminAuthController();
