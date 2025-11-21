const Walker = require('../models/Walker');
const { ApiError } = require('../middleware/errorHandler');

class WalkerController {
    static async getAllWalkers(req, res, next) {
        try {
            const walkers = await Walker.getAllWalkers();

            // Obtener configuraciones para cada paseador
            const walkersWithSettings = await Promise.all(
                walkers.map(async (walker) => {
                    try {
                        const settings = await Walker.getWalkerSettings(walker.id);
                        return {
                            ...walker,
                            hasGPSTracker: settings.hasGPSTracker || false,
                            pricePerPet: settings.pricePerPet || 15000,
                            hasDiscount: settings.hasDiscount || false,
                            discountPercentage: settings.discountPercentage || 0,
                            hasMercadoPago: settings.hasMercadoPago || false,
                            location: settings.location || walker.location || ''
                        };
                    } catch (error) {
                        // Si hay error obteniendo settings, usar valores por defecto
                        console.warn(`Error loading settings for walker ${walker.id}:`, error.message);
                        return {
                            ...walker,
                            hasGPSTracker: false,
                            pricePerPet: 15000,
                            hasDiscount: false,
                            discountPercentage: 0,
                            hasMercadoPago: false
                        };
                    }
                })
            );

            const walkerPlaceholder = {
                id: 0,
                isPlaceholder: true,
                title: "¿Eres paseador?",
                subtitle: "¡Únete a nosotros!",
                description: "Esperamos tu gran servicio para completar nuestro equipo",
                image: "https://images.unsplash.com/photo-1560807707-8cc77767d783"
            };

            const responseData = [...walkersWithSettings, walkerPlaceholder];

            res.status(200).json({
                status: 'success',
                data: {
                    walkers: responseData,
                    total: walkersWithSettings.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getWalkerById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const walker = await Walker.getWalkerById(parseInt(id));

            if (!walker) {
                throw new ApiError('Paseador no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    walker
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getWalkerSettings(req, res, next) {
        try {
            const id = req.tokenData.id;
            
            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const settings = await Walker.getWalkerSettings(parseInt(id));

            res.status(200).json({
                status: 'success',
                data: {
                    settings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateWalkerSettings(req, res, next) {
        try {
            
            const { id } = req.params;
            const settingsData = req.body;
            

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!settingsData || Object.keys(settingsData).length === 0) {
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

            // Validaciones
            if (location !== undefined && typeof location !== 'string') {
                throw new ApiError('La ubicación debe ser un texto', 400);
            }

            if (pricePerPet !== undefined && (typeof pricePerPet !== 'number' || pricePerPet < 0)) {
                throw new ApiError('El precio por mascota debe ser un número positivo', 400);
            }

            if (hasGPSTracker !== undefined && typeof hasGPSTracker !== 'boolean') {
                throw new ApiError('El estado del GPS debe ser verdadero o falso', 400);
            }

            if (hasDiscount !== undefined && typeof hasDiscount !== 'boolean') {
                throw new ApiError('El estado del descuento debe ser verdadero o falso', 400);
            }

            if (discountPercentage !== undefined && hasDiscount &&
                (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100)) {
                throw new ApiError('El porcentaje de descuento debe ser un número entre 0 y 100', 400);
            }

            if (hasMercadoPago !== undefined && typeof hasMercadoPago !== 'boolean') {
                throw new ApiError('El estado de MercadoPago debe ser verdadero o falso', 400);
            }

            if (tokenMercadoPago !== undefined && tokenMercadoPago !== null && typeof tokenMercadoPago !== 'string') {
                throw new ApiError('El token de MercadoPago debe ser un texto', 400);
            }

            const updatedSettings = await Walker.updateWalkerSettings(parseInt(id), settingsData);

            res.status(200).json({
                status: 'success',
                message: 'Configuraciones actualizadas exitosamente',
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar solo configuración de MercadoPago
    static async updateWalkerMercadoPago(req, res, next) {
        try {
            const { id } = req.params;
            const mercadoPagoData = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!mercadoPagoData || Object.keys(mercadoPagoData).length === 0) {
                throw new ApiError('Datos de MercadoPago requeridos', 400);
            }

            const { hasMercadoPago, tokenMercadoPago } = mercadoPagoData;

            if (hasMercadoPago !== undefined && typeof hasMercadoPago !== 'boolean') {
                throw new ApiError('El estado de MercadoPago debe ser verdadero o falso', 400);
            }

            if (tokenMercadoPago !== undefined && tokenMercadoPago !== null && typeof tokenMercadoPago !== 'string') {
                throw new ApiError('El token de MercadoPago debe ser un texto', 400);
            }

            if (hasMercadoPago && (!tokenMercadoPago || tokenMercadoPago.trim() === '')) {
                throw new ApiError('Token de MercadoPago es requerido cuando está habilitado', 400);
            }

            const updatedSettings = await Walker.updateWalkerMercadoPago(parseInt(id), mercadoPagoData);

            res.status(200).json({
                status: 'success',
                message: 'Configuración de MercadoPago actualizada exitosamente',
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getWalkerEarnings(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const earnings = await Walker.getWalkerEarnings(parseInt(id));

            res.status(200).json({
                status: 'success',
                data: {
                    earnings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateWalkerLocation(req, res, next) {
        try {
            const { id } = req.params;
            const { location } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!location || typeof location !== 'string' || location.trim() === '') {
                throw new ApiError('Ubicación requerida', 400);
            }

            const updatedSettings = await Walker.updateWalkerLocation(parseInt(id), location.trim());

            res.status(200).json({
                status: 'success',
                message: 'Ubicación actualizada exitosamente',
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateWalkerPricing(req, res, next) {
        try {
            const { id } = req.params;
            const pricingData = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!pricingData || Object.keys(pricingData).length === 0) {
                throw new ApiError('Datos de precios requeridos', 400);
            }

            const { pricePerPet, hasDiscount, discountPercentage } = pricingData;

            if (pricePerPet !== undefined && (typeof pricePerPet !== 'number' || pricePerPet < 0)) {
                throw new ApiError('El precio por mascota debe ser un número positivo', 400);
            }

            if (hasDiscount !== undefined && typeof hasDiscount !== 'boolean') {
                throw new ApiError('El estado del descuento debe ser verdadero o falso', 400);
            }

            if (discountPercentage !== undefined && 
                (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100)) {
                throw new ApiError('El porcentaje de descuento debe ser un número entre 0 y 100', 400);
            }

            if (hasDiscount && (!discountPercentage || discountPercentage <= 0)) {
                throw new ApiError('Debe especificar un porcentaje de descuento válido cuando el descuento está activo', 400);
            }

            const updatedSettings = await Walker.updateWalkerPricing(parseInt(id), pricingData);

            res.status(200).json({
                status: 'success',
                message: 'Precios actualizados exitosamente',
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getWalkersStats(req, res, next) {
        try {
            // Verificar que el usuario sea admin
            if (req.tokenData.role !== 'admin') {
                throw new ApiError('Acceso denegado. Solo administradores pueden ver estadísticas generales', 403);
            }

            const stats = await Walker.getWalkersStats();

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

    static async validateWalker(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const isValid = await Walker.validateWalkerExists(parseInt(id));

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    walkerId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para buscar paseadores
    static async searchWalkers(req, res, next) {
        try {
            const { query = '', location = '', minRating = 0, limit = 10 } = req.query;

            if (limit > 100) {
                throw new ApiError('El límite máximo es 100 registros', 400);
            }

            if (minRating < 0 || minRating > 5) {
                throw new ApiError('La calificación mínima debe estar entre 0 y 5', 400);
            }

            let walkers = await Walker.getAllWalkers();

            // Obtener configuraciones para cada paseador (igual que getAllWalkers)
            const walkersWithSettings = await Promise.all(
                walkers.map(async (walker) => {
                    try {
                        const settings = await Walker.getWalkerSettings(walker.id);
                        return {
                            ...walker,
                            hasGPSTracker: settings.hasGPSTracker || false,
                            pricePerPet: settings.pricePerPet || 15000,
                            hasDiscount: settings.hasDiscount || false,
                            discountPercentage: settings.discountPercentage || 0,
                            hasMercadoPago: settings.hasMercadoPago || false,
                            location: settings.location || walker.location || ''
                        };
                    } catch (error) {
                        console.warn(`Error loading settings for walker ${walker.id}:`, error.message);
                        return {
                            ...walker,
                            hasGPSTracker: false,
                            pricePerPet: 15000,
                            hasDiscount: false,
                            discountPercentage: 0,
                            hasMercadoPago: false
                        };
                    }
                })
            );

            // Aplicar filtros
            let filteredWalkers = walkersWithSettings;
            
            if (query && query.trim()) {
                const searchTerm = query.toLowerCase().trim();
                filteredWalkers = walkersWithSettings.filter(walker => 
                    walker.name.toLowerCase().includes(searchTerm) ||
                    (walker.location && walker.location.toLowerCase().includes(searchTerm))
                );
            }

            if (location && location.trim()) {
                const locationTerm = location.toLowerCase().trim();
                filteredWalkers = filteredWalkers.filter(walker => 
                    walker.location && walker.location.toLowerCase().includes(locationTerm)
                );
            }

            if (minRating > 0) {
                filteredWalkers = filteredWalkers.filter(walker => walker.rating >= parseFloat(minRating));
            }

            // Aplicar límite
            const limitNumber = parseInt(limit);
            const limitedWalkers = filteredWalkers.slice(0, limitNumber);

            res.status(200).json({
                status: 'success',
                data: {
                    walkers: limitedWalkers,
                    total: limitedWalkers.length,
                    totalFound: filteredWalkers.length,
                    filters: {
                        query: query || null,
                        location: location || null,
                        minRating: parseFloat(minRating),
                        limit: limitNumber
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = WalkerController;