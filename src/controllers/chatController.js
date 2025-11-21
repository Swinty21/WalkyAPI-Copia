const Chat = require('../models/Chat');
const { ApiError } = require('../middleware/errorHandler');

class ChatController {
    
    static async getChatMessages(req, res, next) {
        try {
            const { walkId } = req.params;

            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const chatData = await Chat.getChatMessages(parseInt(walkId));

            res.status(200).json({
                status: 'success',
                data: {
                    chatId: chatData.chatId,
                    messages: chatData.messages
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async sendMessage(req, res, next) {
        try {
            const { walkId } = req.params;
            const messageData = req.body;

            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!messageData || Object.keys(messageData).length === 0) {
                throw new ApiError('Datos del mensaje requeridos', 400);
            }

            const { senderId, message } = messageData;

            if (!senderId || isNaN(senderId)) {
                throw new ApiError('ID de emisor requerido', 400);
            }

            if (!message || typeof message !== 'string' || message.trim() === '') {
                throw new ApiError('Contenido del mensaje requerido', 400);
            }

            if (message.length > 500) {
                throw new ApiError('Mensaje muy largo. Máximo 500 caracteres', 400);
            }

            const newMessage = await Chat.sendMessage(parseInt(walkId), messageData);

            res.status(201).json({
                status: 'success',
                message: 'Mensaje enviado exitosamente',
                data: newMessage
            });
        } catch (error) {
            next(error);
        }
    }

    static async markMessagesAsRead(req, res, next) {
        try {
            const { walkId } = req.params;
            const { userId } = req.body;

            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const result = await Chat.markMessagesAsRead(parseInt(walkId), parseInt(userId));

            res.status(200).json({
                status: 'success',
                message: 'Mensajes marcados como leídos',
                data: {
                    success: true,
                    messagesMarked: result.messagesMarked,
                    tripId: parseInt(walkId),
                    userId: parseInt(userId)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getUnreadCount(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const unreadCount = await Chat.getUnreadCount(parseInt(userId));

            res.status(200).json({
                status: 'success',
                data: {
                    unreadCount
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatController;