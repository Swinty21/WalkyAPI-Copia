const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Chat extends BaseModel {
    constructor() {
        super('walk_chats');
    }

    // Obtener mensajes de un chat de paseo
    async getChatMessages(walkId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const results = await db.query('CALL sp_walk_chat_get_messages(?)', [walkId]);
            
            if (results && results[0]) {
                const messages = results[0].map(msg => this.formatMessageData(msg));
                
                const chatId = messages.length > 0 ? messages[0].chatId : null;
                
                return {
                    chatId: chatId,
                    messages: messages
                };
            }
            
            return {
                chatId: null,
                messages: []
            };
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener mensajes del chat', 500);
        }
    }

    // Enviar mensaje en un chat
    async sendMessage(walkId, messageData) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!messageData) {
                throw new ApiError('Datos del mensaje requeridos', 400);
            }

            const { senderId, message } = messageData;

            if (!senderId || isNaN(senderId)) {
                throw new ApiError('ID de emisor inválido', 400);
            }

            if (!message || typeof message !== 'string' || message.trim() === '') {
                throw new ApiError('Contenido del mensaje requerido', 400);
            }

            const results = await db.query(
                'CALL sp_walk_chat_send_message(?, ?, ?)',
                [walkId, senderId, message.trim()]
            );

            if (results && results[0] && results[0].length > 0) {
                return this.formatMessageData(results[0][0]);
            }

            throw new ApiError('Error al enviar mensaje', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al enviar mensaje', 500);
        }
    }

    // Marcar mensajes como leídos
    async markMessagesAsRead(walkId, userId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const results = await db.query(
                'CALL sp_walk_chat_mark_read(?, ?)',
                [walkId, userId]
            );

            if (results && results[0] && results[0].length > 0) {
                return {
                    messagesMarked: results[0][0].messagesMarked
                };
            }

            return {
                messagesMarked: 0
            };
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al marcar mensajes como leídos', 500);
        }
    }

    // Obtener contador de mensajes no leídos
    async getUnreadCount(userId) {
        try {
            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const results = await db.query('CALL sp_walk_chat_unread_count(?)', [userId]);

            if (results && results[0] && results[0].length > 0) {
                return results[0][0].unreadCount || 0;
            }

            return 0;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener contador de mensajes no leídos', 500);
        }
    }

    // Formatear datos del mensaje para respuesta
    formatMessageData(message) {
        return {
            id: message.id,
            chatId: message.chatId,
            senderId: message.senderId,
            senderName: message.senderName,
            senderType: message.senderType,
            content: message.content,
            sentAt: message.sentAt,
            isRead: message.isRead
        };
    }
}

module.exports = new Chat();