const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepo = require('../../repositories/user/auth.repository');

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

        const token = this._generateToken(player);
        return { token, player };
    }

    async login(email, password) {
        const player = await authRepo.findPlayerByEmail(email);
        
        if (!player) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        const token = this._generateToken(player);
        return { token, player };
    }

    async getMe(userId, type) {
        // Implementation depends on user type (Player vs User)
        if (type === 'Player') {
            return await authRepo.findPlayerById(userId);
        }
        // ... handle tblUser if needed
    }

    async sendOtp(phone) {
        // Check if player exists
        let player = await authRepo.findPlayerByPhone(phone);
        if (!player) {
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
        global.otpStore[phone] = { otp, expires: Date.now() + 300000 }; // 5 mins

        return { message: 'OTP sent successfully', otp }; // Returning OTP for testing convenience
    }

    async loginWithOtp(phone, otp) {
        const stored = global.otpStore ? global.otpStore[phone] : null;
        
        if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
            throw { statusCode: 401, message: 'Invalid or expired OTP' };
        }

        delete global.otpStore[phone];

        const player = await authRepo.findPlayerByPhone(phone);
        const token = this._generateToken(player);
        
        return { token, player };
    }

    _generateToken(player) {
        return jwt.sign(
            { id: player.PlayerId, type: 'Player', email: player.Email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
    }
}

module.exports = new AuthService();
