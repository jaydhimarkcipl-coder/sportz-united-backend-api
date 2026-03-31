const superUserRepo = require('../../repositories/super-admin/user.repository');
const bcrypt = require('bcryptjs');

class SuperUserService {
    async getAllUsers(filters) {
        return await superUserRepo.findAllUsers(filters);
    }

    async getUserById(id, type = 'User') {
        const user = await superUserRepo.findUserById(id, type);
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return user;
    }

    async createUser(data) {
        // Hash password if provided
        if (data.PasswordHash) {
            data.PasswordHash = await bcrypt.hash(data.PasswordHash, 10);
        }
        data.IsActive = true;
        data.IsVerified = true;
        data.CreatedDate = new Date();
        return await superUserRepo.createUser(data);
    }

    async updateUser(id, data, type = 'User') {
        // If password is being reset, hash it
        if (data.PasswordHash) {
            data.PasswordHash = await bcrypt.hash(data.PasswordHash, 10);
        }
        data.ModifiedDate = new Date();
        const updated = await superUserRepo.updateUser(id, data, type);
        if (!updated) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return updated;
    }

    async deleteUser(id, type = 'User') {
        const result = await superUserRepo.deleteUser(id, type);
        if (!result) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return result;
    }

    async hardDeletePlayer(id) {
        const result = await superUserRepo.hardDeleteUser(id, 'Player');
        if (!result) {
            throw { statusCode: 404, message: 'Player not found' };
        }
        return result;
    }
}

module.exports = new SuperUserService();
