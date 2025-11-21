const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Review extends BaseModel {
    constructor() {
        super('reviews');
    }

    // Obtener todas las reseñas
    async getAllReviews() {
        try {
            const results = await db.query('CALL sp_review_get_all()');
            
            if (results && results[0]) {
                return results[0].map(review => ({
                    id: review.id,
                    userId: review.reviewer_id,
                    walkerId: review.reviewed_id,
                    walkerName: review.walkerName,
                    walkerImage: review.walkerImage,
                    ownerName: review.ownerName,
                    ownerImage: review.ownerImage,
                    walkId: review.walk_id,
                    rating: review.rating,
                    content: review.content,
                    date: review.date,
                    petName: review.petName
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener reseñas', 500);
        }
    }

    // Obtener reseña por ID
    async getReviewById(reviewId) {
        try {
            if (!reviewId) {
                throw new ApiError('ID de reseña requerido', 400);
            }

            const results = await db.query('CALL sp_review_get_by_id(?)', [reviewId]);
            
            if (results && results[0] && results[0].length > 0) {
                const review = results[0][0];
                return {
                    id: review.id,
                    userId: review.reviewer_id,
                    walkerId: review.reviewed_id,
                    walkerName: review.walkerName,
                    walkerImage: review.walkerImage,
                    ownerName: review.ownerName,
                    ownerImage: review.ownerImage,
                    walkId: review.walk_id,
                    rating: review.rating,
                    content: review.content,
                    date: review.date,
                    petName: review.petName
                };
            }
            return null;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener reseña', 500);
        }
    }

    // Obtener reseñas por usuario (dueño)
    async getReviewsByUser(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_review_get_by_user(?)', [userId]);
            
            if (results && results[0]) {
                return results[0].map(review => ({
                    id: review.id,
                    userId: review.userId,
                    walkerId: review.walkerId,
                    walkerName: review.walkerName,
                    walkerImage: review.walkerImage,
                    ownerName: review.ownerName,
                    ownerImage: review.ownerImage,
                    walkId: review.walk_id,
                    rating: review.rating,
                    content: review.content,
                    date: review.date,
                    petName: review.petName
                }));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener reseñas del usuario', 500);
        }
    }

    // Obtener reseñas por paseador
    async getReviewsByWalker(walkerId) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            const results = await db.query('CALL sp_review_get_by_walker(?)', [walkerId]);
            
            if (results && results[0]) {
                return results[0].map(review => ({
                    id: review.id,
                    userId: review.userId,
                    walkerId: review.walkerId,
                    walkerName: review.walkerName,
                    walkerImage: review.walkerImage,
                    ownerName: review.ownerName,
                    ownerImage: review.ownerImage,
                    walkId: review.walk_id,
                    rating: review.rating,
                    content: review.content,
                    date: review.date,
                    petName: review.petName
                }));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener reseñas del paseador', 500);
        }
    }

    // Obtener reseña por ID de paseo (Walk ID)
    async getReviewByWalkId(walkId) {
        try {
            if (!walkId) {
                throw new ApiError('ID de paseo requerido', 400);
            }

            const results = await db.query('CALL sp_review_get_by_walk_id(?)', [walkId]);
            
            if (results && results[0] && results[0].length > 0) {
                const review = results[0][0];
                return {
                    id: review.id,
                    userId: review.reviewer_id,
                    walkerId: review.reviewed_id,
                    walkerName: review.walkerName,
                    walkerImage: review.walkerImage,
                    ownerName: review.ownerName,
                    ownerImage: review.ownerImage,
                    walkId: review.walk_id,
                    rating: review.rating,
                    content: review.content,
                    date: review.date,
                    petName: review.petName
                };
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener reseña del paseo', 500);
        }
    }

    // Crear nueva reseña
    async createReview(reviewData) {
        try {
            if (!reviewData) {
                throw new ApiError('Datos de reseña requeridos', 400);
            }

            const { walkId, reviewerId, reviewedId, rating, content } = reviewData;

            // Validaciones básicas
            if (!walkId || !reviewerId || !reviewedId) {
                throw new ApiError('walkId, reviewerId y reviewedId son requeridos', 400);
            }

            if (!rating || rating < 1 || rating > 5) {
                throw new ApiError('La calificación debe estar entre 1 y 5', 400);
            }

            if (!content || content.trim() === '') {
                throw new ApiError('El contenido de la reseña es requerido', 400);
            }

            const results = await db.query(
                'CALL sp_review_create(?, ?, ?, ?, ?)',
                [walkId, reviewerId, reviewedId, rating, content.trim()]
            );

            if (results && results[0] && results[0].length > 0) {
                const createdReview = results[0][0];
                return {
                    id: createdReview.id,
                    userId: createdReview.reviewer_id,
                    walkerId: createdReview.reviewed_id,
                    walkerName: createdReview.walkerName,
                    walkerImage: createdReview.walkerImage,
                    ownerName: createdReview.ownerName,
                    ownerImage: createdReview.ownerImage,
                    walkId: createdReview.walk_id,
                    rating: createdReview.rating,
                    content: createdReview.content,
                    date: createdReview.date,
                    petName: createdReview.petName
                };
            }

            throw new ApiError('Error al crear reseña', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear reseña', 500);
        }
    }

    // Actualizar reseña existente
    async updateReview(reviewId, userId, reviewData) {
        try {
            if (!reviewId) {
                throw new ApiError('ID de reseña requerido', 400);
            }

            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            if (!reviewData || Object.keys(reviewData).length === 0) {
                throw new ApiError('Datos de reseña requeridos', 400);
            }

            const { rating, content } = reviewData;

            if (rating !== undefined && (rating < 1 || rating > 5)) {
                throw new ApiError('La calificación debe estar entre 1 y 5', 400);
            }

            if (content !== undefined && content.trim() === '') {
                throw new ApiError('El contenido no puede estar vacío', 400);
            }

            const results = await db.query(
                'CALL sp_review_update(?, ?, ?, ?)',
                [reviewId, userId, rating, content ? content.trim() : null]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedReview = results[0][0];
                return {
                    id: updatedReview.id,
                    userId: updatedReview.reviewer_id,
                    walkerId: updatedReview.reviewed_id,
                    walkerName: updatedReview.walkerName,
                    walkerImage: updatedReview.walkerImage,
                    ownerName: updatedReview.ownerName,
                    ownerImage: updatedReview.ownerImage,
                    walkId: updatedReview.walk_id,
                    rating: updatedReview.rating,
                    content: updatedReview.content,
                    date: updatedReview.date,
                    petName: updatedReview.petName,
                    updatedAt: updatedReview.updated_at
                };
            }

            throw new ApiError('Error al actualizar reseña', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar reseña', 500);
        }
    }

    // Eliminar reseña
    async deleteReview(reviewId, userId) {
        try {
            if (!reviewId) {
                throw new ApiError('ID de reseña requerido', 400);
            }

            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_review_delete(?, ?)', [reviewId, userId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.affected_rows > 0) {
                    return { message: 'Reseña eliminada exitosamente' };
                }
            }

            throw new ApiError('Error al eliminar reseña', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al eliminar reseña', 500);
        }
    }
}

module.exports = new Review();