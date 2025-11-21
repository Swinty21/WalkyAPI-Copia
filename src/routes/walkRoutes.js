const express = require('express');
const WalkController = require('../controllers/walkController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de walks requieren autenticación
router.use(authenticateToken);

// Rutas generales
router.get('/', WalkController.getAllWalks);
router.get('/active', WalkController.getActiveWalks);
router.get('/scheduled', WalkController.getScheduledWalks);
router.get('/awaiting-payment', WalkController.getWalksAwaitingPayment);
router.get('/requested', WalkController.getRequestedWalks);

// Rutas de recibos
router.get('/receipts/:userType/:userId', WalkController.getReceiptsByUser);

// Rutas por ID
router.get('/:id', WalkController.getWalkById);
router.get('/:id/receipt', WalkController.getReceiptByWalkId);
router.put('/:id', WalkController.updateWalk);
router.delete('/:id', WalkController.deleteWalk);

// Rutas de cambio de estado
router.patch('/:id/status', WalkController.updateWalkStatus);
router.patch('/:id/accept', WalkController.acceptWalkRequest);
router.patch('/:id/reject', WalkController.rejectWalkRequest);
router.patch('/:id/confirm-payment', WalkController.confirmPayment);
router.patch('/:id/start', WalkController.startWalk);
router.patch('/:id/finish', WalkController.finishWalk);
router.patch('/:id/cancel', WalkController.cancelWalk);

// Rutas de validación
router.get('/:id/validate', WalkController.validateWalk);

// Rutas por estado
router.get('/status/:status', WalkController.getWalksByStatus);

// Rutas por walker/owner
router.get('/walker/:walkerId', WalkController.getWalksByWalker);
router.get('/owner/:ownerId', WalkController.getWalksByOwner);

// Crear nuevo paseo
router.post('/', WalkController.createWalk);

module.exports = router;