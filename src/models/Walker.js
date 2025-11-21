const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Walker extends BaseModel {
    constructor() {
        super('users');
    }

    // Obtener todos los paseadores
    async getAllWalkers() {
        try {
            const results = await db.query('CALL sp_walker_get_all()');
            
            if (results && results[0]) {
                return results[0].map(walker => ({
                    id: walker.id,
                    name: walker.name,
                    image: walker.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
                    location: walker.location || '',
                    rating: parseFloat(walker.rating) || 0,
                    experience: walker.experience || '0 years',
                    verified: Boolean(walker.verified),
                    totalWalks: walker.total_walks || 0
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseadores', 500);
        }
    }

    // Obtener paseador por ID
    async getWalkerById(walkerId) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            const results = await db.query('CALL sp_walker_get_by_id(?)', [walkerId]);
            
            if (results && results[0] && results[0].length > 0) {
                const walker = results[0][0];
                return {
                    id: walker.id,
                    name: walker.name,
                    image: walker.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
                    location: walker.location || '',
                    rating: parseFloat(walker.rating) || 0,
                    experience: walker.experience || '0 years',
                    verified: Boolean(walker.verified),
                    totalWalks: walker.total_walks || 0,
                    joinedDate: walker.joined_date
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
            throw new ApiError('Error al obtener paseador', 500);
        }
    }

    // Obtener configuraciones del paseador
    async getWalkerSettings(walkerId) {
        try {
            if (!walkerId) {
                throw new ApiError('Walker ID is required', 400);
            }

            const results = await db.query('CALL sp_walker_get_settings(?)', [walkerId]);
            
            if (results && results[0] && results[0].length > 0) {
                const settings = results[0][0];
                return {
                    walker_id: settings.walker_id,
                    location: settings.location,
                    price_per_pet: settings.pricePerPet,
                    has_gps_tracker: Boolean(settings.hasGPSTracker),
                    has_discount: Boolean(settings.hasDiscount),
                    discount_percentage: settings.discountPercentage,
                    has_mercadopago: Boolean(settings.hasMercadoPago),
                    token_mercadopago: settings.tokenMercadoPago,
                    gps_tracking_enabled: Boolean(settings.gpsTrackingEnabled),
                    gps_tracking_interval: settings.gpsTrackingInterval,
                    updated_at: settings.updatedAt
                };
            }

            return null;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener configuraciones del paseador', 500);
        }
    }

    // Actualizar configuraciones del paseador
    async updateWalkerSettings(walkerId, settingsData) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            if (!settingsData) {
                throw new ApiError('Datos de configuración requeridos', 400);
            }

            const {
                location,
                pricePerPet,
                hasGPSTracker,
                hasDiscount,
                discountPercentage,
                hasMercadoPago,
                tokenMercadoPago
            } = settingsData;

            if (pricePerPet !== undefined && pricePerPet < 0) {
                throw new ApiError('El precio por mascota no puede ser negativo', 400);
            }

            if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
                throw new ApiError('El porcentaje de descuento debe estar entre 0 y 100', 400);
            }

            if (hasDiscount && (!discountPercentage || discountPercentage <= 0)) {
                throw new ApiError('Debe especificar un porcentaje de descuento válido', 400);
            }

            if (hasMercadoPago && (!tokenMercadoPago || tokenMercadoPago.trim() === '')) {
                throw new ApiError('Token de MercadoPago es requerido cuando está habilitado', 400);
            }
            
            const results = await db.query(
                'CALL sp_walker_update_settings(?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    walkerId,
                    location !== undefined ? location : null,
                    pricePerPet !== undefined ? pricePerPet : null,
                    hasGPSTracker !== undefined ? hasGPSTracker : null,
                    hasDiscount !== undefined ? hasDiscount : null,  // ✅ Cambio aquí
                    discountPercentage !== undefined ? discountPercentage : null,  // ✅ Y aquí
                    hasMercadoPago !== undefined ? hasMercadoPago : null,
                    tokenMercadoPago !== undefined ? tokenMercadoPago : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedSettings = results[0][0];
                return {
                    walkerId: updatedSettings.walker_id,
                    location: updatedSettings.location || '',
                    pricePerPet: parseFloat(updatedSettings.pricePerPet) || 15000,
                    hasGPSTracker: Boolean(updatedSettings.hasGPSTracker),
                    hasDiscount: Boolean(updatedSettings.hasDiscount),
                    discountPercentage: parseInt(updatedSettings.discountPercentage) || 0,
                    hasMercadoPago: Boolean(updatedSettings.hasMercadoPago),
                    tokenMercadoPago: updatedSettings.tokenMercadoPago || null,
                    updatedAt: updatedSettings.updatedAt
                };
            }

            throw new ApiError('Error al actualizar configuraciones', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar configuraciones del paseador', 500);
        }
    }

    // Actualizar solo configuración de MercadoPago
    async updateWalkerMercadoPago(walkerId, mercadoPagoData) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            if (!mercadoPagoData) {
                throw new ApiError('Datos de MercadoPago requeridos', 400);
            }

            const { hasMercadoPago, tokenMercadoPago } = mercadoPagoData;

            if (hasMercadoPago && (!tokenMercadoPago || tokenMercadoPago.trim() === '')) {
                throw new ApiError('Token de MercadoPago es requerido cuando está habilitado', 400);
            }

            const results = await db.query(
                'CALL sp_walker_update_mercadopago(?, ?, ?)',
                [
                    walkerId,
                    hasMercadoPago || false,
                    tokenMercadoPago || null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedSettings = results[0][0];
                return {
                    walkerId: updatedSettings.walker_id,
                    location: updatedSettings.location || '',
                    pricePerPet: parseFloat(updatedSettings.pricePerPet) || 15000,
                    hasGPSTracker: Boolean(updatedSettings.hasGPSTracker),
                    hasDiscount: Boolean(updatedSettings.hasDiscount),
                    discountPercentage: parseInt(updatedSettings.discountPercentage) || 0,
                    hasMercadoPago: Boolean(updatedSettings.hasMercadoPago),
                    tokenMercadoPago: updatedSettings.tokenMercadoPago || null,
                    updatedAt: updatedSettings.updatedAt
                };
            }

            throw new ApiError('Error al actualizar configuración de MercadoPago', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar configuración de MercadoPago', 500);
        }
    }

    // Obtener estadísticas de ganancias del paseador
    async getWalkerEarnings(walkerId) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            const results = await db.query('CALL sp_payment_stats_by_walker(?)', [walkerId]);
            
            if (results && results[0] && results[0].length > 0) {
                const stats = results[0][0];
                return {
                    monthly: parseFloat(stats.monthlyEarnings) || 0,
                    total: parseFloat(stats.totalEarnings) || 0,
                    completedWalks: parseInt(stats.totalPayments) || 0
                };
            }

            return {
                monthly: 0,
                total: 0,
                completedWalks: 0
            };
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener estadísticas de ganancias', 500);
        }
    }

    // Actualizar solo la ubicación del paseador
    async updateWalkerLocation(walkerId, location) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            if (!location || location.trim() === '') {
                throw new ApiError('Ubicación requerida', 400);
            }

            return await this.updateWalkerSettings(walkerId, { location: location.trim() });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar ubicación del paseador', 500);
        }
    }

    // Actualizar solo la configuración de precios del paseador
    async updateWalkerPricing(walkerId, pricingData) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            if (!pricingData) {
                throw new ApiError('Datos de precios requeridos', 400);
            }

            const { pricePerPet, hasDiscount, discountPercentage } = pricingData;

            // Validaciones específicas de precios
            if (pricePerPet !== undefined && pricePerPet < 0) {
                throw new ApiError('El precio por mascota no puede ser negativo', 400);
            }

            if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
                throw new ApiError('El porcentaje de descuento debe estar entre 0 y 100', 400);
            }

            if (hasDiscount && (!discountPercentage || discountPercentage <= 0)) {
                throw new ApiError('Debe especificar un porcentaje de descuento válido', 400);
            }

            const settingsToUpdate = {
                pricePerPet,
                hasDiscount,
                discountPercentage: hasDiscount ? discountPercentage : 0
            };

            return await this.updateWalkerSettings(walkerId, settingsToUpdate);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar precios del paseador', 500);
        }
    }

    // Validar que un usuario sea paseador
    async validateWalkerExists(walkerId) {
        try {
            if (!walkerId) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            const result = await db.query(`
                SELECT COUNT(*) as count
                FROM users u
                INNER JOIN user_roles ur ON u.role_id = ur.id
                WHERE u.id = ? AND ur.name = 'walker' AND u.status_id = 1
            `, [walkerId]);

            if (!result || result.length === 0 || result[0].count === 0) {
                throw new ApiError('Paseador no encontrado o inactivo', 404);
            }

            return true;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al validar paseador', 500);
        }
    }
}

module.exports = new Walker();