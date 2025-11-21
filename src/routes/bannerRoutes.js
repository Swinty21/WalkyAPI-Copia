const express = require('express');
const BannerController = require('../controllers/bannerController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de banners requieren autenticación
router.use(authenticateToken);

router.get('/', BannerController.getAllBanners);
router.get('/active', BannerController.getActiveBanners);
router.get('/:id', BannerController.getBannerById);
router.post('/', BannerController.createBanner);
router.put('/:id', BannerController.updateBanner);
router.delete('/:id', BannerController.deleteBanner);

router.patch('/:id/toggle-status', BannerController.toggleBannerStatus);
router.get('/:id/validate', BannerController.validateBanner);
router.get('/status/active-limit', BannerController.checkActiveBannersLimit);

module.exports = router;