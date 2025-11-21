const Banner = require('../models/Banner');
const { ApiError } = require('../middleware/errorHandler');

class BannerController {
    static async getAllBanners(req, res, next) {
        try {
            const banners = await Banner.getAllBanners();

            res.status(200).json({
                status: 'success',
                data: {
                    banners
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getActiveBanners(req, res, next) {
        try {
            const banners = await Banner.getActiveBanners();

            res.status(200).json({
                status: 'success',
                data: {
                    banners
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getBannerById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de banner inválido', 400);
            }

            const banner = await Banner.getBannerById(parseInt(id));

            if (!banner) {
                throw new ApiError('Banner no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    banner
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async createBanner(req, res, next) {
        try {
            const bannerData = req.body;

            if (!bannerData || Object.keys(bannerData).length === 0) {
                throw new ApiError('Datos de banner requeridos', 400);
            }

            const { title, description, image, isActive, order } = bannerData;

            if (!title || typeof title !== 'string' || title.trim() === '') {
                throw new ApiError('Título es requerido', 400);
            }

            if (!description || typeof description !== 'string' || description.trim() === '') {
                throw new ApiError('Descripción es requerida', 400);
            }

            if (!image || typeof image !== 'string' || image.trim() === '') {
                throw new ApiError('Imagen es requerida', 400);
            }

            if (title.length > 255) {
                throw new ApiError('El título no puede tener más de 255 caracteres', 400);
            }

            if (description.length > 500) {
                throw new ApiError('La descripción no puede tener más de 500 caracteres', 400);
            }

            if (isActive !== undefined && typeof isActive !== 'boolean') {
                throw new ApiError('El estado activo debe ser verdadero o falso', 400);
            }

            if (order !== undefined && (typeof order !== 'number' || order < 0)) {
                throw new ApiError('El orden debe ser un número positivo', 400);
            }

            const newBanner = await Banner.createBanner(bannerData);

            res.status(201).json({
                status: 'success',
                message: 'Banner creado exitosamente',
                data: {
                    banner: newBanner
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateBanner(req, res, next) {
        try {
            const { id } = req.params;
            const bannerData = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de banner inválido', 400);
            }

            if (!bannerData || Object.keys(bannerData).length === 0) {
                throw new ApiError('Datos de banner requeridos', 400);
            }

            const { title, description, image, isActive, order } = bannerData;

            if (title !== undefined) {
                if (typeof title !== 'string' || title.trim() === '') {
                    throw new ApiError('El título debe ser un texto válido', 400);
                }
                if (title.length > 255) {
                    throw new ApiError('El título no puede tener más de 255 caracteres', 400);
                }
            }

            if (description !== undefined) {
                if (typeof description !== 'string' || description.trim() === '') {
                    throw new ApiError('La descripción debe ser un texto válido', 400);
                }
                if (description.length > 500) {
                    throw new ApiError('La descripción no puede tener más de 500 caracteres', 400);
                }
            }

            if (image !== undefined) {
                if (typeof image !== 'string' || image.trim() === '') {
                    throw new ApiError('La imagen debe ser una URL válida', 400);
                }
            }

            if (isActive !== undefined && typeof isActive !== 'boolean') {
                throw new ApiError('El estado activo debe ser verdadero o falso', 400);
            }

            if (order !== undefined && (typeof order !== 'number' || order < 0)) {
                throw new ApiError('El orden debe ser un número positivo', 400);
            }

            const updatedBanner = await Banner.updateBanner(parseInt(id), bannerData);

            res.status(200).json({
                status: 'success',
                message: 'Banner actualizado exitosamente',
                data: {
                    banner: updatedBanner
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteBanner(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de banner inválido', 400);
            }

            const result = await Banner.deleteBanner(parseInt(id));

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    bannerId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async toggleBannerStatus(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de banner inválido', 400);
            }

            const updatedBanner = await Banner.toggleBannerStatus(parseInt(id));

            res.status(200).json({
                status: 'success',
                message: `Banner ${updatedBanner.isActive ? 'activado' : 'desactivado'} exitosamente`,
                data: {
                    banner: updatedBanner
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método adicional para verificar el límite de banners activos
    static async checkActiveBannersLimit(req, res, next) {
        try {
            const activeBanners = await Banner.getActiveBanners();
            
            res.status(200).json({
                status: 'success',
                data: {
                    activeBanners: activeBanners.length,
                    maxAllowed: 3,
                    canAddMore: activeBanners.length < 3
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para validar que un banner existe
    static async validateBanner(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de banner inválido', 400);
            }

            const banner = await Banner.getBannerById(parseInt(id));
            const isValid = banner !== null;

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    bannerId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BannerController;