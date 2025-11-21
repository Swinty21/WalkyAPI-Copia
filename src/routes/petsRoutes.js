const express = require('express');
const PetsController = require('../controllers/petsController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de mascotas requieren autenticación
router.use(authenticateToken);

router.get('/', PetsController.getAllPets);
router.get('/:id', PetsController.getPetById);
router.get('/owner/:ownerId', PetsController.getPetsByOwner);
router.post('/', PetsController.createPet);
router.put('/:id', PetsController.updatePet);
router.delete('/:id', PetsController.deletePet);

router.get('/:id/validate', PetsController.validatePet);
router.get('/owner/:ownerId/validate', PetsController.validateOwner);

module.exports = router;