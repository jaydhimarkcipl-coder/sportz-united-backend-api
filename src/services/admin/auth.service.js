const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminRefreshTokenRepo = require('../../repositories/admin/refresh-token.repository');
const adminAuthRepo = require('../../repositories/admin/auth.repository');
const crypto = require('crypto');

class AdminAuthService {
    async login(email, password) {
        const user = await adminAuthRepo.findUserByEmail(email);
        
        if (!user) {
            throw { statusCode: 401, message: 'Invalid admin credentials' };
        }

        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.PasswordHash);
        } catch (e) {
            isMatch = (password === user.PasswordHash);
        }

        if (!isMatch && password !== user.PasswordHash) {
            throw { statusCode: 401, message: 'Invalid admin credentials' };
        }

        const accessToken = this._generateAccessToken(user);
        const refreshToken = await this._generateRefreshToken(user.UserId);

        return { accessToken, refreshToken, user };
    }

    _generateAccessToken(user) {
        let role = user.UserType || 'arena_owner';
        if (role.toLowerCase() === 'superadmin') role = 'super_admin';

        return jwt.sign(
            { id: user.UserId, type: 'Admin', role: role, email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Short lived
        );
    }

    async _generateRefreshToken(userId) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        // Use YYYY-MM-DD HH:MM:SS format which is safe for MSSQL DATETIME
        const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

        await adminRefreshTokenRepo.createToken(userId, token, expiresAtStr);
        return token;
    }

    async refresh(oldToken) {
        const refreshTokenRecord = await adminRefreshTokenRepo.findToken(oldToken);
        if (!refreshTokenRecord) {
            throw { statusCode: 401, message: 'Invalid or expired refresh token' };
        }

        const user = await adminAuthRepo.findUserById(refreshTokenRecord.UserId);
        if (!user) {
            throw { statusCode: 401, message: 'User not found' };
        }

        const newAccessToken = this._generateAccessToken(user);
        return { accessToken: newAccessToken };
    }

    async logout(token) {
        await adminRefreshTokenRepo.revokeToken(token);
        return { message: 'Logged out successfully' };
    }
}

module.exports = new AdminAuthService();
