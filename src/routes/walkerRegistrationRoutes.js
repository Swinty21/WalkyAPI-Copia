const express = require('express');
const WalkerRegistrationController = require('../controllers/walkerRegistrationController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/', WalkerRegistrationController.createRegistration);
router.get('/', WalkerRegistrationController.getAllRegistrations);
router.get('/statistics', WalkerRegistrationController.getRegistrationStatistics);
router.get('/status/:status', WalkerRegistrationController.getRegistrationsByStatus);
router.get('/user/:userId', WalkerRegistrationController.getApplicationByUserId);
router.get('/:id', WalkerRegistrationController.getRegistrationById);
router.put('/:id', WalkerRegistrationController.updateRegistration);
router.delete('/:id', WalkerRegistrationController.deleteRegistration);
router.post('/:userId/promote', WalkerRegistrationController.promoteUserToWalker);

module.exports = router;