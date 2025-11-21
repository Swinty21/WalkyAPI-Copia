const emailService = require('../services/emailService');
const db = require('../config/database');

module.exports = {
    async test(req, res) {
        const { userId } = req.body;
        const [user] = await db.query('SELECT id, email, name FROM users WHERE id = ?', [userId]);

        const result = await emailService.sendNotificationEmail({
            id: null,
            title: "Test de Email",
            content: "Este es un correo de prueba.",
            type: "info"
        }, user);

        res.json(result);
    }
};
