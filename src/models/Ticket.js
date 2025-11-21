const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Ticket extends BaseModel {
    constructor() {
        super('support_tickets');
    }

    // Obtener todas las FAQs
    async getFAQs() {
        try {
            const results = await db.query('CALL sp_faq_get_all()');
            
            if (results && results[0]) {
                return results[0].map(faq => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener FAQs', 500);
        }
    }

    // Obtener tickets por usuario
    async getTicketsByUser(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_ticket_get_by_user(?)', [userId]);
            
            if (results && results[0]) {
                return results[0].map(ticket => ({
                    id: ticket.id,
                    userId: ticket.userId,
                    subject: ticket.subject,
                    message: ticket.message,
                    category: ticket.category,
                    status: this.mapStatusToFrontend(ticket.status),
                    createdAt: ticket.createdAt,
                    updatedAt: ticket.updatedAt,
                    response: ticket.response_content ? {
                        agentName: ticket.response_agent,
                        date: ticket.response_date,
                        content: ticket.response_content
                    } : null,
                    cancellationReason: ticket.status === 'cancelada' ? ticket.response_content : null
                }));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener tickets del usuario', 500);
        }
    }

    // Obtener todos los tickets
    async getAllTickets() {
        try {
            const results = await db.query('CALL sp_ticket_get_all()');
            
            if (results && results[0]) {
                return results[0].map(ticket => ({
                    id: ticket.id,
                    userId: ticket.userId,
                    userName: ticket.user_name,
                    userEmail: ticket.user_email,
                    subject: ticket.subject,
                    message: ticket.message,
                    category: ticket.category,
                    status: this.mapStatusToFrontend(ticket.status),
                    createdAt: ticket.createdAt,
                    updatedAt: ticket.updatedAt,
                    response: ticket.response_content ? {
                        agentName: ticket.response_agent,
                        date: ticket.response_date,
                        content: ticket.response_content
                    } : null,
                    cancellationReason: ticket.status === 'cancelada' ? ticket.response_content : null
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener todos los tickets', 500);
        }
    }

    // Crear nuevo ticket
    async createTicket(ticketData) {
        try {
            if (!ticketData) {
                throw new ApiError('Datos del ticket requeridos', 400);
            }

            const { userId, subject, message, category } = ticketData;

            if (!userId || !subject || !message) {
                throw new ApiError('UserId, subject y message son requeridos', 400);
            }

            if (typeof subject !== 'string' || subject.trim().length < 5) {
                throw new ApiError('El asunto debe tener al menos 5 caracteres', 400);
            }

            if (typeof message !== 'string' || message.trim().length < 10) {
                throw new ApiError('El mensaje debe tener al menos 10 caracteres', 400);
            }

            const results = await db.query(
                'CALL sp_ticket_create(?, ?, ?, ?)',
                [userId, subject.trim(), message.trim(), category || 'General']
            );

            if (results && results[0] && results[0].length > 0) {
                const createdTicket = results[0][0];
                return {
                    id: createdTicket.id,
                    userId: createdTicket.userId,
                    subject: createdTicket.subject,
                    message: createdTicket.message,
                    category: createdTicket.category,
                    status: this.mapStatusToFrontend(createdTicket.status),
                    createdAt: createdTicket.createdAt,
                    updatedAt: createdTicket.updatedAt
                };
            }

            throw new ApiError('Error al crear el ticket', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear ticket', 500);
        }
    }

    // Responder a ticket
    async respondToTicket(ticketId, responseData) {
        try {
            if (!ticketId) {
                throw new ApiError('ID del ticket requerido', 400);
            }

            if (!responseData) {
                throw new ApiError('Datos de respuesta requeridos', 400);
            }

            const { agentId, content, status, agentName } = responseData;

            if (!agentId || !content || !status) {
                throw new ApiError('AgentId, content y status son requeridos', 400);
            }

            if (typeof content !== 'string' || content.trim().length < 10) {
                throw new ApiError('El contenido de la respuesta debe tener al menos 10 caracteres', 400);
            }

            if (!['Resuelto', 'Cancelada'].includes(status)) {
                throw new ApiError('El estado debe ser "Resuelto" o "Cancelada"', 400);
            }

            if (status === 'Cancelada' && content.trim().length < 20) {
                throw new ApiError('La razón de cancelación debe tener al menos 20 caracteres', 400);
            }

            // Mapear estado del frontend a la base de datos
            const dbStatus = this.mapStatusToDatabase(status);

            const results = await db.query(
                'CALL sp_ticket_respond(?, ?, ?, ?)',
                [ticketId, agentId, content.trim(), dbStatus]
            );

            if (results && results[0] && results[0].length > 0) {
                const response = results[0][0];
                return {
                    success: true,
                    message: response.message,
                    ticket: {
                        id: response.ticket_id,
                        status: status,
                        updatedAt: response.response_date,
                        response: {
                            agentName: agentName || response.agent_name,
                            date: response.response_date,
                            content: content.trim()
                        }
                    },
                    timestamp: response.response_date
                };
            }

            throw new ApiError('Error al responder el ticket', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al responder ticket', 500);
        }
    }

    // Obtener estadísticas de tickets
    async getTicketStatistics() {
        try {
            const results = await db.query('CALL sp_ticket_get_statistics()');
            
            if (results && results[0] && results[1]) {
                const generalStats = results[0][0];
                const categoryStats = results[1];

                const byCategory = {};
                categoryStats.forEach(stat => {
                    byCategory[stat.category] = {
                        total: parseInt(stat.total) || 0,
                        pending: parseInt(stat.pending) || 0,
                        resolved: parseInt(stat.resolved) || 0,
                        cancelled: parseInt(stat.cancelled) || 0
                    };
                });

                return {
                    total: parseInt(generalStats.total) || 0,
                    pending: parseInt(generalStats.pending) || 0,
                    resolved: parseInt(generalStats.resolved) || 0,
                    cancelled: parseInt(generalStats.cancelled) || 0,
                    byCategory: byCategory,
                    averageResponseTime: Math.round(parseFloat(generalStats.average_response_time_hours) || 0)
                };
            }

            return {
                total: 0,
                pending: 0,
                resolved: 0,
                cancelled: 0,
                byCategory: {},
                averageResponseTime: 0
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener estadísticas de tickets', 500);
        }
    }

    // Obtener categorías disponibles
    async getTicketCategories() {
        try {
            const results = await db.query('CALL sp_ticket_get_categories()');
            
            if (results && results[0]) {
                return results[0].map(category => ({
                    id: category.id,
                    name: category.name,
                    description: category.description
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener categorías', 500);
        }
    }

    // Mapear estados de la base de datos al frontend
    mapStatusToFrontend(dbStatus) {
        const statusMap = {
            'en_espera': 'En Espera',
            'en_progreso': 'En Progreso',
            'resuelto': 'Resuelto',
            'cancelada': 'Cancelada'
        };
        return statusMap[dbStatus] || dbStatus;
    }

    // Mapear estados del frontend a la base de datos
    mapStatusToDatabase(frontendStatus) {
        const statusMap = {
            'En Espera': 'en_espera',
            'En Progreso': 'en_progreso',
            'Resuelto': 'resuelto',
            'Cancelada': 'cancelada'
        };
        return statusMap[frontendStatus] || frontendStatus.toLowerCase();
    }

    // Validar que un ticket existe y está accesible para un usuario
    async validateTicketAccess(ticketId, userId, requireOwnership = true) {
        try {
            if (!ticketId) {
                throw new ApiError('ID del ticket requerido', 400);
            }

            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            let query = `
                SELECT st.id, st.user_id, ts.name as status, u.name as user_name
                FROM support_tickets st
                INNER JOIN ticket_statuses ts ON st.status_id = ts.id
                INNER JOIN users u ON st.user_id = u.id
                WHERE st.id = ?
            `;

            const params = [ticketId];

            if (requireOwnership) {
                query += ' AND st.user_id = ?';
                params.push(userId);
            }

            const result = await db.query(query, params);

            if (!result || result.length === 0) {
                throw new ApiError('Ticket no encontrado o acceso denegado', 404);
            }

            return result[0];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al validar acceso al ticket', 500);
        }
    }
}

module.exports = new Ticket();