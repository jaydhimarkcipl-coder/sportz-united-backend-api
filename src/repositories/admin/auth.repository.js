const { User } = require('../../models');

class AdminAuthRepository {
    async findUserByEmail(email) {
        return await User.findOne({ where: { Email: email } });
    }

    async findUserById(id) {
        return await User.findByPk(id);
    }
}

module.exports = new AdminAuthRepository();
