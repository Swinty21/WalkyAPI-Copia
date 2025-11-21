const bcrypt = require('bcryptjs');

class HashUtils {

    static async hashPassword(password) {
        try {
            const saltRounds = 10;
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            throw new Error('Error al hashear la contraseña');
        }
    }

    static async comparePassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            throw new Error('Error al comparar contraseñas');
        }
    }
}

module.exports = HashUtils;