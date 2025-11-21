const express = require('express');
const ReviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de reviews requieren autenticación
router.use(authenticateToken);

router.get('/', ReviewController.getAllReviews);
router.get('/stats', ReviewController.getReviewStats);
router.get('/:id', ReviewController.getReviewById);
router.post('/', ReviewController.createReview);
router.put('/:id', ReviewController.updateReview);
router.delete('/:id', ReviewController.deleteReview);

router.get('/user/:userId', ReviewController.getReviewsByUser);
router.get('/walker/:walkerId', ReviewController.getReviewsByWalker);
router.get('/walker/:walkerId/stats', ReviewController.getWalkerReviewStats);
router.get('/walk/:walkId', ReviewController.getReviewByWalkId);

router.get('/:id/validate', ReviewController.validateReview);

module.exports = router;