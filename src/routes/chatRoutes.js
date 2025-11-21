const express = require('express');
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de chat requieren autenticación
router.use(authenticateToken);

router.get('/walks/:walkId/messages', ChatController.getChatMessages);
router.post('/walks/:walkId/messages', ChatController.sendMessage);
router.put('/walks/:walkId/messages/read', ChatController.markMessagesAsRead);
router.get('/users/:userId/unread-count', ChatController.getUnreadCount);

module.exports = router;