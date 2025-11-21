const Walk = require('../models/Walk');
const { ApiError } = require('../middleware/errorHandler');

class WalkController {
    // Obtener todos los paseos
    static async getAllWalks(req, res, next) {
        try {
            const walks = await Walk.getAllWalks();

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseo por ID
    static async getWalkById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const walk = await Walk.getWalkById(parseInt(id));

            if (!walk) {
                throw new ApiError('Paseo no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    walk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos por estado
    static async getWalksByStatus(req, res, next) {
        try {
            const { status } = req.params;

            if (!status || typeof status !== 'string') {
                throw new ApiError('Estado inválido', 400);
            }

            const walks = await Walk.getWalksByStatus(status);

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length,
                    filterStatus: status
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos por paseador
    static async getWalksByWalker(req, res, next) {
        try {
            const { walkerId } = req.params;

            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const walks = await Walk.getWalksByWalker(parseInt(walkerId));

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length,
                    walkerId: parseInt(walkerId)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos por dueño
    static async getWalksByOwner(req, res, next) {
        try {
            const { ownerId } = req.params;

            if (!ownerId || isNaN(ownerId)) {
                throw new ApiError('ID de dueño inválido', 400);
            }

            const walks = await Walk.getWalksByOwner(parseInt(ownerId));

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length,
                    ownerId: parseInt(ownerId)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Crear nueva solicitud de paseo
    static async createWalk(req, res, next) {
        try {
            const walkData = req.body;

            if (!walkData || Object.keys(walkData).length === 0) {
                throw new ApiError('Datos de paseo requeridos', 400);
            }

            const { walkerId, ownerId, scheduledDateTime, totalPrice, petIds, startAddress, description } = walkData;

            // Validaciones
            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador requerido', 400);
            }

            if (!ownerId || isNaN(ownerId)) {
                throw new ApiError('ID de dueño requerido', 400);
            }

            if (!scheduledDateTime) {
                throw new ApiError('Fecha y hora programada requerida', 400);
            }

            if (!totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
                throw new ApiError('Precio total debe ser mayor a 0', 400);
            }

            if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
                throw new ApiError('Debe seleccionar al menos una mascota', 400);
            }

            if (!startAddress || typeof startAddress !== 'string' || startAddress.trim().length === 0) {
                throw new ApiError('Dirección de inicio requerida', 400);
            }

            const newWalk = await Walk.createWalk(walkData);

            res.status(201).json({
                status: 'success',
                message: 'Solicitud de paseo creada exitosamente',
                data: {
                    walk: newWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar estado del paseo
    static async updateWalkStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!status || typeof status !== 'string') {
                throw new ApiError('Estado requerido', 400);
            }

            const validStatuses = ['Solicitado', 'Esperando pago', 'Agendado', 'Activo', 'Finalizado', 'Rechazado', 'Cancelado'];
            if (!validStatuses.includes(status)) {
                throw new ApiError(`Estado inválido. Estados válidos: ${validStatuses.join(', ')}`, 400);
            }

            // Obtener paseo actual para validar transición
            const currentWalk = await Walk.getWalkById(parseInt(id));
            if (!currentWalk) {
                throw new ApiError('Paseo no encontrado', 404);
            }

            // Validar transición de estado
            Walk.validateStatusTransition(currentWalk.status, status);

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), status);

            res.status(200).json({
                status: 'success',
                message: `Estado del paseo actualizado a '${status}'`,
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar información del paseo
    static async updateWalk(req, res, next) {
        try {
            const { id } = req.params;
            const walkData = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!walkData || Object.keys(walkData).length === 0) {
                throw new ApiError('Datos de paseo requeridos', 400);
            }

            const { duration, distance, walkerNotes, adminNotes } = walkData;

            if (duration !== undefined && (isNaN(duration) || duration < 0)) {
                throw new ApiError('Duración inválida', 400);
            }

            if (distance !== undefined && (isNaN(distance) || distance < 0)) {
                throw new ApiError('Distancia inválida', 400);
            }

            const updatedWalk = await Walk.updateWalk(parseInt(id), walkData);

            res.status(200).json({
                status: 'success',
                message: 'Paseo actualizado exitosamente',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Eliminar paseo
    static async deleteWalk(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const result = await Walk.deleteWalk(parseInt(id));

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    walkId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos activos
    static async getActiveWalks(req, res, next) {
        try {
            const walks = await Walk.getWalksByStatus('Activo');

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos agendados
    static async getScheduledWalks(req, res, next) {
        try {
            const walks = await Walk.getWalksByStatus('Agendado');

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos esperando pago
    static async getWalksAwaitingPayment(req, res, next) {
        try {
            const walks = await Walk.getWalksByStatus('Esperando pago');

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener paseos solicitados
    static async getRequestedWalks(req, res, next) {
        try {
            const walks = await Walk.getWalksByStatus('Solicitado');

            res.status(200).json({
                status: 'success',
                data: {
                    walks,
                    total: walks.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Aceptar solicitud de paseo (walker acepta)
    static async acceptWalkRequest(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), 'Esperando pago');

            res.status(200).json({
                status: 'success',
                message: 'Solicitud de paseo aceptada',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Rechazar solicitud de paseo
    static async rejectWalkRequest(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), 'Rechazado');

            res.status(200).json({
                status: 'success',
                message: 'Solicitud de paseo rechazada',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Confirmar pago (owner paga)
    static async confirmPayment(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), 'Agendado');

            res.status(200).json({
                status: 'success',
                message: 'Pago confirmado, paseo agendado',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Iniciar paseo (walker inicia)
    static async startWalk(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), 'Activo');

            res.status(200).json({
                status: 'success',
                message: 'Paseo iniciado',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Finalizar paseo (walker finaliza)
    static async finishWalk(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), 'Finalizado');

            res.status(200).json({
                status: 'success',
                message: 'Paseo finalizado',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Cancelar un paseo (Cliente lo cancela) cancelWalk
    static async cancelWalk(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const updatedWalk = await Walk.updateWalkStatus(parseInt(id), 'Cancelado');

            res.status(200).json({
                status: 'success',
                message: 'Paseo Cancelado',
                data: {
                    walk: updatedWalk
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Validar que un paseo existe
    static async validateWalk(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const walk = await Walk.getWalkById(parseInt(id));
            const isValid = walk !== null;

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    walkId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener recibo de un paseo específico
    static async getReceiptByWalkId(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const receipt = await Walk.getReceiptByWalkId(parseInt(id));

            if (!receipt) {
                throw new ApiError('Recibo no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    receipt
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener recibos de un usuario (owner o walker)
    static async getReceiptsByUser(req, res, next) {
        try {
            const { userType, userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!userType || !['owner', 'walker'].includes(userType)) {
                throw new ApiError('Tipo de usuario debe ser "owner" o "walker"', 400);
            }

            const receipts = await Walk.getReceiptsByUser(parseInt(userId), userType);

            res.status(200).json({
                status: 'success',
                data: {
                    receipts,
                    total: receipts.length,
                    userId: parseInt(userId),
                    userType
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = WalkController;