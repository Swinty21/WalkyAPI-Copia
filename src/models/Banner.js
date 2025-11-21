const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Banner extends BaseModel {
    constructor() {
        super('banners');
    }

    // Obtener todos los banners
    async getAllBanners() {
        try {
            const results = await db.query('CALL sp_banner_get_all()');
            
            if (results && results[0]) {
                return results[0].map(banner => ({
                    id: banner.id,
                    title: banner.title,
                    description: banner.description,
                    image: banner.image,
                    isActive: Boolean(banner.isActive),
                    order: banner.order || 0,
                    createdAt: banner.createdAt,
                    updatedAt: banner.updatedAt
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener banners', 500);
        }
    }

    // Obtener solo banners activos
    async getActiveBanners() {
        try {
            const results = await db.query('CALL sp_banner_get_active()');
            
            if (results && results[0]) {
                return results[0].map(banner => ({
                    id: banner.id,
                    title: banner.title,
                    description: banner.description,
                    image: banner.image,
                    isActive: Boolean(banner.isActive),
                    order: banner.order || 0,
                    createdAt: banner.createdAt,
                    updatedAt: banner.updatedAt
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener banners activos', 500);
        }
    }

    // Obtener banner por ID
    async getBannerById(bannerId) {
        try {
            if (!bannerId) {
                throw new ApiError('ID de banner requerido', 400);
            }

            const results = await db.query('CALL sp_banner_get_by_id(?)', [bannerId]);
            
            if (results && results[0] && results[0].length > 0) {
                const banner = results[0][0];
                return {
                    id: banner.id,
                    title: banner.title,
                    description: banner.description,
                    image: banner.image,
                    isActive: Boolean(banner.isActive),
                    order: banner.order || 0,
                    createdAt: banner.createdAt,
                    updatedAt: banner.updatedAt
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
            throw new ApiError('Error al obtener banner', 500);
        }
    }

    // Crear nuevo banner
    async createBanner(bannerData) {
        try {
            if (!bannerData) {
                throw new ApiError('Datos de banner requeridos', 400);
            }

            const { title, description, image, isActive, order } = bannerData;

            if (!title || title.trim() === '') {
                throw new ApiError('Título es requerido', 400);
            }

            if (!description || description.trim() === '') {
                throw new ApiError('Descripción es requerida', 400);
            }

            if (!image || image.trim() === '') {
                throw new ApiError('Imagen es requerida', 400);
            }

            if (title.length > 255) {
                throw new ApiError('El título no puede tener más de 255 caracteres', 400);
            }

            if (description.length > 500) {
                throw new ApiError('La descripción no puede tener más de 500 caracteres', 400);
            }

            if (!this.isValidUrl(image)) {
                throw new ApiError('La URL de la imagen no es válida', 400);
            }

            const results = await db.query(
                'CALL sp_banner_create(?, ?, ?, ?, ?)',
                [
                    title.trim(),
                    description.trim(),
                    image.trim(),
                    isActive !== undefined ? isActive : false,
                    order !== undefined ? order : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const createdBanner = results[0][0];
                return {
                    id: createdBanner.id,
                    title: createdBanner.title,
                    description: createdBanner.description,
                    image: createdBanner.image,
                    isActive: Boolean(createdBanner.isActive),
                    order: createdBanner.order || 0,
                    createdAt: createdBanner.createdAt,
                    updatedAt: createdBanner.updatedAt
                };
            }

            throw new ApiError('Error al crear banner', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear banner', 500);
        }
    }

    // Actualizar banner existente
    async updateBanner(bannerId, bannerData) {
        try {
            if (!bannerId) {
                throw new ApiError('ID de banner requerido', 400);
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
                if (!this.isValidUrl(image)) {
                    throw new ApiError('La URL de la imagen no es válida', 400);
                }
            }

            if (isActive !== undefined && typeof isActive !== 'boolean') {
                throw new ApiError('El estado activo debe ser verdadero o falso', 400);
            }

            if (order !== undefined && (typeof order !== 'number' || order < 0)) {
                throw new ApiError('El orden debe ser un número positivo', 400);
            }

            const results = await db.query(
                'CALL sp_banner_update(?, ?, ?, ?, ?, ?)',
                [
                    bannerId,
                    title !== undefined ? title.trim() : null,
                    description !== undefined ? description.trim() : null,
                    image !== undefined ? image.trim() : null,
                    isActive !== undefined ? isActive : null,
                    order !== undefined ? order : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedBanner = results[0][0];
                return {
                    id: updatedBanner.id,
                    title: updatedBanner.title,
                    description: updatedBanner.description,
                    image: updatedBanner.image,
                    isActive: Boolean(updatedBanner.isActive),
                    order: updatedBanner.order || 0,
                    createdAt: updatedBanner.createdAt,
                    updatedAt: updatedBanner.updatedAt
                };
            }

            throw new ApiError('Error al actualizar banner', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar banner', 500);
        }
    }

    // Eliminar banner
    async deleteBanner(bannerId) {
        try {
            if (!bannerId) {
                throw new ApiError('ID de banner requerido', 400);
            }

            const results = await db.query('CALL sp_banner_delete(?)', [bannerId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.affected_rows > 0) {
                    return { message: 'Banner eliminado exitosamente' };
                }
            }

            throw new ApiError('Error al eliminar banner', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al eliminar banner', 500);
        }
    }

    // Toggle estado del banner (activar/desactivar)
    async toggleBannerStatus(bannerId) {
        try {
            if (!bannerId) {
                throw new ApiError('ID de banner requerido', 400);
            }

            const currentBanner = await this.getBannerById(bannerId);
            if (!currentBanner) {
                throw new ApiError('Banner no encontrado', 404);
            }

            const newStatus = !currentBanner.isActive;
            
            return await this.updateBanner(bannerId, { isActive: newStatus });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al cambiar estado del banner', 500);
        }
    }

    // Validar URL
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new Banner();