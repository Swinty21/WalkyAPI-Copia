const Ticket = require('../models/Ticket');
const { ApiError } = require('../middleware/errorHandler');

class TicketController {
    static async getFAQs(req, res, next) {
        try {
            const faqs = await Ticket.getFAQs();

            res.status(200).json({
                status: 'success',
                data: {
                    faqs,
                    total: faqs.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTicketsByUser(req, res, next) {
        try {
            const userId = req.tokenData.id;

            if (!userId) {
                throw new ApiError('Usuario no autenticado', 401);
            }

            const tickets = await Ticket.getTicketsByUser(userId);

            res.status(200).json({
                status: 'success',
                data: {
                    tickets,
                    total: tickets.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllTickets(req, res, next) {
        try {
            
            if (!['admin', 'support'].includes(req.tokenData.role)) {
                throw new ApiError('Acceso denegado. Solo administradores y personal de soporte pueden ver todos los tickets', 403);
            }

            const tickets = await Ticket.getAllTickets();

            res.status(200).json({
                status: 'success',
                data: {
                    tickets,
                    total: tickets.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async createTicket(req, res, next) {
        try {
            const userId = req.tokenData.id;
            const ticketData = req.body;

            if (!ticketData || Object.keys(ticketData).length === 0) {
                throw new ApiError('Datos del ticket requeridos', 400);
            }

            const { subject, message, category } = ticketData;

            if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
                throw new ApiError('Asunto requerido', 400);
            }

            if (subject.trim().length < 5) {
                throw new ApiError('El asunto debe tener al menos 5 caracteres', 400);
            }

            if (subject.length > 255) {
                throw new ApiError('El asunto no puede exceder 255 caracteres', 400);
            }

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                throw new ApiError('Mensaje requerido', 400);
            }

            if (message.trim().length < 10) {
                throw new ApiError('El mensaje debe tener al menos 10 caracteres', 400);
            }

            if (message.length > 5000) {
                throw new ApiError('El mensaje no puede exceder 5000 caracteres', 400);
            }

            const ticketToCreate = {
                userId,
                subject: subject.trim(),
                message: message.trim(),
                category: category || 'General'
            };

            const createdTicket = await Ticket.createTicket(ticketToCreate);

            res.status(201).json({
                status: 'success',
                message: 'Ticket creado exitosamente',
                data: {
                    ticket: createdTicket
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async respondToTicket(req, res, next) {
        try {
            const { id } = req.params;
            const responseData = req.body;
            const agentId = req.tokenData.id;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de ticket inválido', 400);
            }

            if (!['admin', 'support'].includes(req.tokenData.role)) {
                throw new ApiError('Acceso denegado. Solo administradores y personal de soporte pueden responder tickets', 403);
            }

            if (!responseData || Object.keys(responseData).length === 0) {
                throw new ApiError('Datos de respuesta requeridos', 400);
            }

            const { content, status, agentName } = responseData;

            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                throw new ApiError('Contenido de respuesta requerido', 400);
            }

            if (content.trim().length < 10) {
                throw new ApiError('La respuesta debe tener al menos 10 caracteres', 400);
            }

            if (content.length > 2000) {
                throw new ApiError('La respuesta no puede exceder 2000 caracteres', 400);
            }

            if (!status) {
                throw new ApiError('Estado requerido', 400);
            }

            if (!['Resuelto', 'Cancelada'].includes(status)) {
                throw new ApiError('El estado debe ser "Resuelto" o "Cancelada"', 400);
            }

            if (status === 'Cancelada' && content.trim().length < 20) {
                throw new ApiError('La razón de cancelación debe tener al menos 20 caracteres', 400);
            }

            const responseToCreate = {
                agentId,
                content: content.trim(),
                status,
                agentName: agentName || req.tokenData.name
            };

            const result = await Ticket.respondToTicket(parseInt(id), responseToCreate);

            res.status(200).json({
                status: 'success',
                message: `Ticket ${status === 'Cancelada' ? 'cancelado' : 'resuelto'} exitosamente`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTicketStatistics(req, res, next) {
        try {
            
            if (!['admin', 'support'].includes(req.tokenData.role)) {
                throw new ApiError('Acceso denegado. Solo administradores y personal de soporte pueden ver estadísticas', 403);
            }

            const stats = await Ticket.getTicketStatistics();

            res.status(200).json({
                status: 'success',
                data: {
                    statistics: stats
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTicketCategories(req, res, next) {
        try {
            const categories = await Ticket.getTicketCategories();

            res.status(200).json({
                status: 'success',
                data: {
                    categories,
                    total: categories.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTicketById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.tokenData.id;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de ticket inválido', 400);
            }

            // Verificar acceso al ticket
            const isAdminOrSupport = ['admin', 'support'].includes(req.tokenData.role);
            
            // Si no es admin/support, solo puede ver sus propios tickets
            await Ticket.validateTicketAccess(parseInt(id), userId, !isAdminOrSupport);

            // Obtener ticket específico
            const tickets = isAdminOrSupport 
                ? await Ticket.getAllTickets()
                : await Ticket.getTicketsByUser(userId);
            
            const ticket = tickets.find(t => t.id === parseInt(id));

            if (!ticket) {
                throw new ApiError('Ticket no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    ticket
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateTicketStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de ticket inválido', 400);
            }

            if (!['admin', 'support'].includes(req.tokenData.role)) {
                throw new ApiError('Acceso denegado. Solo administradores y personal de soporte pueden cambiar el estado', 403);
            }

            if (!status) {
                throw new ApiError('Estado requerido', 400);
            }

            const validStatuses = ['En Espera', 'En Progreso', 'Resuelto', 'Cancelada'];
            if (!validStatuses.includes(status)) {
                throw new ApiError(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`, 400);
            }

            const automaticContent = `Estado cambiado a: ${status}`;
            const responseData = {
                agentId: req.tokenData.id,
                content: automaticContent,
                status,
                agentName: req.tokenData.name
            };

            const result = await Ticket.respondToTicket(parseInt(id), responseData);

            res.status(200).json({
                status: 'success',
                message: 'Estado del ticket actualizado exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Método auxiliar para validar datos de respuesta
    static validateResponseData(responseData) {
        const errors = [];

        if (!responseData) {
            errors.push("Datos de respuesta requeridos");
            return { isValid: false, errors };
        }

        if (!responseData.content || typeof responseData.content !== 'string') {
            errors.push("Contenido es requerido y debe ser texto");
        } else if (responseData.content.trim().length < 10) {
            errors.push("El contenido debe tener al menos 10 caracteres");
        } else if (responseData.content.length > 2000) {
            errors.push("El contenido no puede exceder 2000 caracteres");
        }

        if (!responseData.status) {
            errors.push("Estado es requerido");
        } else if (!["Resuelto", "Cancelada"].includes(responseData.status)) {
            errors.push("El estado debe ser 'Resuelto' o 'Cancelada'");
        }

        if (responseData.status === "Cancelada") {
            if (responseData.content.trim().length < 20) {
                errors.push("La razón de cancelación debe tener al menos 20 caracteres");
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = TicketController;