const express = require('express');
const WalkMapController = require('../controllers/walkMapController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de walk maps requieren autenticación
router.use(authenticateToken);

router.get('/walks/:walkId/route', WalkMapController.getWalkRoute);
router.post('/location', WalkMapController.saveLocation);
router.post('/walks/:walkId/location', WalkMapController.saveLocation);
router.get('/walks/:walkId/availability', WalkMapController.checkMapAvailability);

module.exports = router;