const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Notification extends BaseModel {
    constructor() {
        super('notifications');
    }

    // Obtener todas las notificaciones de un usuario
    async getNotificationsByUser(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_notification_get_by_user(?)', [userId]);
            
            if (results && results[0]) {
                return results[0];
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener notificaciones del usuario', 500);
        }
    }

    // Obtener una notificación específica por ID y usuario
    async getNotificationById(notificationId, userId) {
        try {
            if (!notificationId) {
                throw new ApiError('ID de notificación requerido', 400);
            }
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_notification_get_by_id(?, ?)', [notificationId, userId]);
            
            if (results && results[0] && results[0].length > 0) {
                return results[0][0];
            }
            return null;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener notificación', 500);
        }
    }

    // Marcar notificación como leída
    async markAsRead(notificationId, userId) {
        try {
            if (!notificationId) {
                throw new ApiError('ID de notificación requerido', 400);
            }
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_notification_mark_as_read(?, ?)', [notificationId, userId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                return {
                    success: result.success === 1,
                    message: result.message
                };
            }
            
            throw new ApiError('Error al marcar notificación como leída', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al marcar notificación como leída', 500);
        }
    }

    // Crear nueva notificación
    async createNotification(notificationData) {
        try {
            const {
                userId,
                title,
                content,
                type,
                walkerName = null
            } = notificationData;

            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }
            if (!title || title.trim().length === 0) {
                throw new ApiError('Título de notificación requerido', 400);
            }
            if (!content || content.trim().length === 0) {
                throw new ApiError('Contenido de notificación requerido', 400);
            }
            if (!type) {
                throw new ApiError('Tipo de notificación requerido', 400);
            }

            const validTypes = ['success', 'warning', 'info', 'error'];
            if (!validTypes.includes(type)) {
                throw new ApiError('Tipo de notificación inválido. Debe ser: success, warning, info, error', 400);
            }

            const results = await db.query(
                'CALL sp_notification_create(?, ?, ?, ?, ?)',
                [userId, title.trim(), content.trim(), type, walkerName]
            );

            if (results && results[0] && results[0].length > 0) {
                return results[0][0];
            }
            
            throw new ApiError('Error al crear notificación', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear notificación', 500);
        }
    }

    // Obtener estadísticas de notificaciones para un usuario
    async getNotificationStats(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const notifications = await this.getNotificationsByUser(userId);
            
            const stats = {
                total: notifications.length,
                unread: notifications.filter(n => !n.read).length,
                read: notifications.filter(n => n.read).length,
                byType: {
                    success: notifications.filter(n => n.type === 'success').length,
                    warning: notifications.filter(n => n.type === 'warning').length,
                    info: notifications.filter(n => n.type === 'info').length,
                    error: notifications.filter(n => n.type === 'error').length
                }
            };

            return stats;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener estadísticas de notificaciones', 500);
        }
    }

    // Marcar todas las notificaciones como leídas para un usuario
    async markAllAsRead(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const userExists = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
            if (!userExists || userExists.length === 0) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            const result = await db.query(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );

            return {
                success: true,
                message: 'Todas las notificaciones marcadas como leídas',
                updatedCount: result.affectedRows || 0
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al marcar todas las notificaciones como leídas', 500);
        }
    }

    // Eliminar notificaciones antiguas (más de X días)
    async deleteOldNotifications(days = 30) {
        try {
            const result = await db.query(
                'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [days]
            );

            return {
                success: true,
                message: `Notificaciones anteriores a ${days} días eliminadas`,
                deletedCount: result.affectedRows || 0
            };
        } catch (error) {
            throw new ApiError('Error al eliminar notificaciones antiguas', 500);
        }
    }
}

module.exports = new Notification();