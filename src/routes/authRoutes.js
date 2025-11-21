const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/check-session', AuthController.checkSession);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-reset-token', AuthController.verifyResetToken);
router.post('/reset-password', AuthController.resetPassword);

// Rutas protegidas
router.get('/verify', authenticateToken, AuthController.verifyToken);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;