const express = require('express');
const NotificationController = require('../controllers/notificationController');
const emailTestController = require('../controllers/emailTestController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de notificaciones requieren autenticación
router.use(authenticateToken);

router.get('/', NotificationController.getAllNotificationsByUser);
router.get('/stats', NotificationController.getNotificationStats);
router.get('/:id', NotificationController.getNotificationById);
router.post('/', NotificationController.createNotification);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/mark-all-read', NotificationController.markAllAsRead);
router.post('/test-email', emailTestController.test);

module.exports = router;