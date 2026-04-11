const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepo = require('../../repositories/user/auth.repository');
const refreshTokenRepo = require('../../repositories/user/refresh-token.repository');
const { getFullUrl } = require('../../utils/url.util');
const crypto = require('crypto');

class AuthService {
    async register(playerData) {
        const existing = await authRepo.findPlayerByEmail(playerData.Email);
        if (existing) {
            throw { statusCode: 400, message: 'Email already registered' };
        }

        // In a real app, hash password here if tblPlayer had a password field.
        // For now, mapping registration to tblPlayer.
        const player = await authRepo.createPlayer({
            ...playerData,
            IsActive: true,
            IsVerified: false
        });

        const accessToken = this._generateAccessToken(player);
        const refreshToken = await this._generateRefreshToken(player.PlayerId);

        return { accessToken, refreshToken, player };
    }

    async login(email, password) {
        const player = await authRepo.findPlayerByEmail(email);

        if (!player) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        const accessToken = this._generateAccessToken(player);
        const refreshToken = await this._generateRefreshToken(player.PlayerId);

        return { accessToken, refreshToken, player };
    }

    async getMe(userId, type) {
        // Implementation depends on user type (Player vs User)
        if (type === 'Player') {
            const player = await authRepo.findPlayerById(userId);
            if (player) {
                const p = player.toJSON();
                if (p.ProfilePhotoUrl) p.ProfilePhotoUrl = getFullUrl(p.ProfilePhotoUrl);
                return p;
            }
            return null;
        }
        // ... handle tblUser if needed
    }

    async sendOtp(phone) {
        let isNewUser = false;
        // Check if player exists
        let player = await authRepo.findPlayerByPhone(phone);
        if (!player) {
            isNewUser = true;
            // Auto-register if doesn't exist? For now, let's assume they must register first or we create a stub
            player = await authRepo.createPlayer({
                Phone: phone,
                FullName: 'New Player',
                IsActive: true,
                IsVerified: false
            });
        }

        // Using fixed OTP for now
        const otp = '123456';

        // In a real app, send via SMS (AWS SNS, Twilio, etc.)
        console.log(`OTP for ${phone}: ${otp}`);

        // Save OTP to some store (Redis or Memory) with expiry. 
        // For simplicity, I'll use a global map (NOT FOR PRODUCTION)
        global.otpStore = global.otpStore || {};
        global.otpStore[phone] = { otp, expires: Date.now() + 300000, isNewUser }; // 5 mins

        return { message: 'OTP sent successfully', otp }; // Returning OTP for testing convenience
    }

    async loginWithOtp(phone, otp) {
        const stored = global.otpStore ? global.otpStore[phone] : null;

        if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
            throw { statusCode: 401, message: 'Invalid or expired OTP' };
        }

        const isNewUser = stored.isNewUser;
        delete global.otpStore[phone];

        const player = await authRepo.findPlayerByPhone(phone);
        const accessToken = this._generateAccessToken(player);
        const refreshToken = await this._generateRefreshToken(player.PlayerId);

        return { accessToken, refreshToken, player, isNewUser };
    }

    _generateAccessToken(player) {
        return jwt.sign(
            { id: player.PlayerId, type: 'Player', email: player.Email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
    }

    async _generateRefreshToken(playerId) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

        await refreshTokenRepo.createToken(playerId, token, expiresAtStr);
        return token;
    }

    async refresh(oldToken) {
        const refreshTokenRecord = await refreshTokenRepo.findToken(oldToken);
        if (!refreshTokenRecord) {
            throw { statusCode: 401, message: 'Invalid or expired refresh token' };
        }

        const player = await authRepo.findPlayerById(refreshTokenRecord.PlayerId);
        if (!player) {
            throw { statusCode: 401, message: 'Player not found' };
        }

        const newAccessToken = this._generateAccessToken(player);
        return { accessToken: newAccessToken };
    }
}

module.exports = new AuthService();
