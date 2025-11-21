const express = require('express');
const WalkerController = require('../controllers/walkerController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de walkers requieren autenticación
router.use(authenticateToken);

router.get('/', WalkerController.getAllWalkers);
router.get('/search', WalkerController.searchWalkers);
router.get('/:id', WalkerController.getWalkerById);
router.get('/:id/validate', WalkerController.validateWalker);
router.get('/:id/settings', WalkerController.getWalkerSettings);
router.get('/:id/earnings', WalkerController.getWalkerEarnings);
router.put('/:id/settings', WalkerController.updateWalkerSettings);
router.patch('/:id/location', WalkerController.updateWalkerLocation);
router.patch('/:id/pricing', WalkerController.updateWalkerPricing);
router.patch('/:id/mercadopago', WalkerController.updateWalkerMercadoPago);

module.exports = router;