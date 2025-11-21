const Notification = require('../models/Notification');
const { ApiError } = require('../middleware/errorHandler');

class NotificationController {

    static async getAllNotificationsByUser(req, res, next) {
        try {
            const { page = 1, limit = 10, search = "", userId } = req.query;
            
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const allNotifications = await Notification.getNotificationsByUser(userId);
            
            let filteredNotifications = allNotifications;
            if (search && search.trim().length > 0) {
                const searchTerm = search.toLowerCase().trim();
                filteredNotifications = allNotifications.filter(notification => 
                    notification.title.toLowerCase().includes(searchTerm) ||
                    notification.content.toLowerCase().includes(searchTerm) ||
                    (notification.walkerName && notification.walkerName.toLowerCase().includes(searchTerm))
                );
            }

            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const startIndex = (pageNumber - 1) * limitNumber;
            const endIndex = startIndex + limitNumber;
            
            const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

            const formattedNotifications = paginatedNotifications.map(notification => ({
                id: notification.id,
                title: notification.title,
                preview: notification.content.length > 100 
                    ? notification.content.substring(0, 100) + "..." 
                    : notification.content,
                fullContent: notification.content,
                type: notification.type,
                date: notification.date,
                read: notification.read,
                walkerName: notification.walkerName
            }));

            const totalPages = Math.ceil(filteredNotifications.length / limitNumber);

            res.status(200).json({
                status: 'success',
                data: {
                    notifications: formattedNotifications,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages: totalPages,
                        totalCount: filteredNotifications.length,
                        hasNextPage: endIndex < filteredNotifications.length,
                        hasPrevPage: pageNumber > 1,
                        limit: limitNumber
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getNotificationById(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.query;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de notificación inválido', 400);
            }
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const notification = await Notification.getNotificationById(parseInt(id), userId);

            if (!notification) {
                throw new ApiError('Notificación no encontrada', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    notification: {
                        id: notification.id,
                        title: notification.title,
                        content: notification.content,
                        type: notification.type,
                        date: notification.date,
                        read: notification.read,
                        walkerName: notification.walkerName
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de notificación inválido', 400);
            }
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const notification = await Notification.getNotificationById(parseInt(id), userId);
            if (!notification) {
                throw new ApiError('Notificación no encontrada', 404);
            }

            const result = await Notification.markAsRead(parseInt(id), userId);

            if (!result.success) {
                throw new ApiError('Error al marcar notificación como leída', 500);
            }

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    success: true,
                    notificationId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async createNotification(req, res, next) {
        try {
            const { title, content, type, walkerName, targetUserId } = req.body;
            
            if (!title || title.trim().length === 0) {
                throw new ApiError('El título es requerido', 400);
            }
            if (!content || content.trim().length === 0) {
                throw new ApiError('El contenido es requerido', 400);
            }
            if (!type) {
                throw new ApiError('El tipo de notificación es requerido', 400);
            }
            if (!targetUserId) {
                throw new ApiError('El ID del usuario destino es requerido', 400);
            }

            const notificationData = {
                userId: targetUserId,
                title: title.trim(),
                content: content.trim(),
                type,
                walkerName: walkerName || null
            };

            const newNotification = await Notification.createNotification(notificationData);

            res.status(201).json({
                status: 'success',
                message: 'Notificación creada exitosamente',
                data: {
                    notification: newNotification
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getNotificationStats(req, res, next) {
        try {
            const { userId } = req.query;
            
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const stats = await Notification.getNotificationStats(userId);

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

    static async markAllAsRead(req, res, next) {
        try {
            const { userId } = req.body;
            
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const result = await Notification.markAllAsRead(userId);

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    success: result.success,
                    updatedCount: result.updatedCount
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteOldNotifications(req, res, next) {
        try {
            const { days = 30 } = req.body;
            
            if (req.tokenData.role !== 'admin') {
                throw new ApiError('Acceso denegado. Solo administradores pueden eliminar notificaciones antiguas', 403);
            }

            if (days < 1) {
                throw new ApiError('Los días deben ser mayor a 0', 400);
            }

            const result = await Notification.deleteOldNotifications(days);

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    success: result.success,
                    deletedCount: result.deletedCount
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = NotificationController;