const Review = require('../models/Review');
const { ApiError } = require('../middleware/errorHandler');

class ReviewController {
    static async getAllReviews(req, res, next) {
        try {
            const reviews = await Review.getAllReviews();

            res.status(200).json({
                status: 'success',
                data: {
                    reviews
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getReviewById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de reseña inválido', 400);
            }

            const review = await Review.getReviewById(parseInt(id));

            if (!review) {
                throw new ApiError('Reseña no encontrada', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    review
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getReviewsByUser(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const reviews = await Review.getReviewsByUser(parseInt(userId));

            res.status(200).json({
                status: 'success',
                data: {
                    reviews
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getReviewsByWalker(req, res, next) {
        try {
            const { walkerId } = req.params;

            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const reviews = await Review.getReviewsByWalker(parseInt(walkerId));

            res.status(200).json({
                status: 'success',
                data: {
                    reviews
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getReviewByWalkId(req, res, next) {
        try {
            const { walkId } = req.params;

            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const review = await Review.getReviewByWalkId(parseInt(walkId));

            if (!review) {
                return res.status(404).json({
                    status: 'success',
                    data: {
                        review: null
                    }
                });
            }

            res.status(200).json({
                status: 'success',
                data: {
                    review
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async createReview(req, res, next) {
        try {
            const reviewData = req.body;
            const userId = req.tokenData.id;

            if (!reviewData || Object.keys(reviewData).length === 0) {
                throw new ApiError('Datos de reseña requeridos', 400);
            }

            const { walkId, walkerId, rating, content } = reviewData;

            // Validaciones básicas
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
                throw new ApiError('La calificación debe ser un número entre 1 y 5', 400);
            }

            if (!content || typeof content !== 'string' || content.trim() === '') {
                throw new ApiError('El contenido de la reseña es requerido', 400);
            }

            if (content.length > 1000) {
                throw new ApiError('El contenido no puede exceder 1000 caracteres', 400);
            }

            const newReview = await Review.createReview({
                walkId: parseInt(walkId),
                reviewerId: userId,
                reviewedId: parseInt(walkerId),
                rating: parseInt(rating),
                content: content.trim()
            });

            res.status(201).json({
                status: 'success',
                message: 'Reseña creada exitosamente',
                data: {
                    review: newReview
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateReview(req, res, next) {
        try {
            const { id } = req.params;
            const reviewData = req.body;
            const userId = req.tokenData.id;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de reseña inválido', 400);
            }

            if (!reviewData || Object.keys(reviewData).length === 0) {
                throw new ApiError('Datos de reseña requeridos', 400);
            }

            const { rating, content } = reviewData;

            // Validaciones
            if (rating !== undefined) {
                if (isNaN(rating) || rating < 1 || rating > 5) {
                    throw new ApiError('La calificación debe ser un número entre 1 y 5', 400);
                }
            }

            if (content !== undefined) {
                if (typeof content !== 'string') {
                    throw new ApiError('El contenido debe ser texto válido', 400);
                }
                if (content.trim() === '') {
                    throw new ApiError('El contenido no puede estar vacío', 400);
                }
                if (content.length > 1000) {
                    throw new ApiError('El contenido no puede exceder 1000 caracteres', 400);
                }
            }

            const updateData = {};
            if (rating !== undefined) updateData.rating = parseInt(rating);
            if (content !== undefined) updateData.content = content.trim();

            const updatedReview = await Review.updateReview(parseInt(id), userId, updateData);

            res.status(200).json({
                status: 'success',
                message: 'Reseña actualizada exitosamente',
                data: {
                    review: updatedReview
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteReview(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.tokenData.id;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de reseña inválido', 400);
            }

            const result = await Review.deleteReview(parseInt(id), userId);

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    reviewId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método adicional para validar que una reseña existe
    static async validateReview(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de reseña inválido', 400);
            }

            const review = await Review.getReviewById(parseInt(id));
            const isValid = review !== null;

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    reviewId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener estadísticas básicas de reseñas
    static async getReviewStats(req, res, next) {
        try {
            const allReviews = await Review.getAllReviews();
            
            const stats = {
                total: allReviews.length,
                averageRating: 0,
                ratingDistribution: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0
                }
            };

            if (allReviews.length > 0) {
                let totalRating = 0;
                
                allReviews.forEach(review => {
                    totalRating += review.rating;
                    stats.ratingDistribution[review.rating]++;
                });

                stats.averageRating = parseFloat((totalRating / allReviews.length).toFixed(2));
            }

            res.status(200).json({
                status: 'success',
                data: {
                    stats
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener estadísticas de un paseador específico
    static async getWalkerReviewStats(req, res, next) {
        try {
            const { walkerId } = req.params;

            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const walkerReviews = await Review.getReviewsByWalker(parseInt(walkerId));
            
            const stats = {
                total: walkerReviews.length,
                averageRating: 0,
                ratingDistribution: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0
                }
            };

            if (walkerReviews.length > 0) {
                let totalRating = 0;
                
                walkerReviews.forEach(review => {
                    totalRating += review.rating;
                    stats.ratingDistribution[review.rating]++;
                });

                stats.averageRating = parseFloat((totalRating / walkerReviews.length).toFixed(2));
            }

            res.status(200).json({
                status: 'success',
                data: {
                    walkerId: parseInt(walkerId),
                    stats
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ReviewController;