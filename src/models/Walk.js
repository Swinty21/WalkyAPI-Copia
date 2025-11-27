const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Walk extends BaseModel {
    constructor() {
        super('walks');
    }

    // Obtener todos los paseos
    async getAllWalks() {
        try {
            const results = await db.query('CALL sp_walk_get_all()');
            
            if (results && results[0]) {
                return results[0].map(walk => this.formatWalkData(walk));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseos', 500);
        }
    }

    // Obtener paseo por ID
    async getWalkById(walkId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const results = await db.query('CALL sp_walk_get_by_id(?)', [walkId]);
            
            if (results && results[0] && results[0].length > 0) {
                return this.formatWalkData(results[0][0]);
            }
            return null;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseo', 500);
        }
    }

    // Obtener paseos por estado
    async getWalksByStatus(status) {
        try {
            if (!status || typeof status !== 'string') {
                throw new ApiError('Estado inválido', 400);
            }

            const results = await db.query('CALL sp_walk_get_by_status(?)', [status]);
            
            if (results && results[0]) {
                return results[0].map(walk => this.formatWalkData(walk));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseos por estado', 500);
        }
    }

    // Obtener paseos por paseador
    async getWalksByWalker(walkerId) {
        try {
            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const results = await db.query('CALL sp_walk_get_by_walker(?)', [walkerId]);
            
            if (results && results[0]) {
                return results[0].map(walk => this.formatWalkData(walk));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseos del paseador', 500);
        }
    }

    // Obtener paseos por dueño
    async getWalksByOwner(ownerId) {
        try {
            if (!ownerId || isNaN(ownerId)) {
                throw new ApiError('ID de dueño inválido', 400);
            }

            const results = await db.query('CALL sp_walk_get_by_owner(?)', [ownerId]);
            
            if (results && results[0]) {
                return results[0].map(walk => this.formatWalkData(walk));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseos del dueño', 500);
        }
    }

    // Crear nueva solicitud de paseo
    async createWalk(walkData) {
        
        try {
            if (!walkData) {
                throw new ApiError('Datos de paseo requeridos', 400);
            }

            const { walkerId, ownerId, scheduledDateTime, totalPrice, petIds, startAddress, description } = walkData;

            // Validaciones
            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!ownerId || isNaN(ownerId)) {
                throw new ApiError('ID de dueño inválido', 400);
            }

            if (!scheduledDateTime) {
                throw new ApiError('Fecha y hora programada requerida', 400);
            }

            if (!totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
                throw new ApiError('Precio total inválido', 400);
            }

            if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
                throw new ApiError('Debe seleccionar al menos una mascota', 400);
            }

            if (!startAddress || typeof startAddress !== 'string' || startAddress.trim().length === 0) {
                throw new ApiError('Dirección de inicio requerida', 400);
            }

            // Calcular scheduled_end_time (1 hora después del inicio)
            const scheduledStartTime = new Date(scheduledDateTime);
            const scheduledEndTime = new Date(scheduledStartTime.getTime() + 60 * 60 * 1000);

            // Convertir petIds a JSON para el stored procedure
            const petIdsJson = JSON.stringify(petIds);

            const results = await db.query(
                'CALL sp_walk_create(?, ?, ?, ?, ?, ?, ?)',
                [
                    walkerId,
                    ownerId,
                    scheduledStartTime,
                    scheduledEndTime,
                    startAddress,
                    totalPrice,
                    petIdsJson
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                return this.formatWalkData(results[0][0]);
            }

            throw new ApiError('Error al crear paseo', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear paseo', 500);
        }
    }

    // Actualizar estado del paseo
    async updateWalkStatus(walkId, newStatus) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!newStatus || typeof newStatus !== 'string') {
                throw new ApiError('Estado requerido', 400);
            }

            // Convertir nombres del frontend a nombres de la BD
            const statusMap = {
                'Solicitado': 'solicitado',
                'Esperando pago': 'esperando_pago',
                'Agendado': 'agendado',
                'Activo': 'activo',
                'Finalizado': 'finalizado',
                'Rechazado': 'rechazado',
                'Cancelado': 'cancelado'
            };

            const dbStatus = statusMap[newStatus] || newStatus.toLowerCase();
            
            // Validar ventana de tiempo para iniciar paseo
            if (dbStatus === 'activo') {
                const walk = await this.getWalkById(walkId);
                
                if (!walk) {
                    throw new ApiError('Paseo no encontrado', 404);
                }

                const scheduledStartTime = new Date(walk.startTime);
                const now = new Date();
                
                // Calcular ventana de ±20 minutos (20 * 60 * 1000 ms)
                const twentyMinutes = 20 * 60 * 1000;
                const earliestTime = new Date(scheduledStartTime.getTime() - twentyMinutes);
                const latestTime = new Date(scheduledStartTime.getTime() + twentyMinutes);
                
                // Validar que la hora actual esté dentro de la ventana
                if (now < earliestTime || now > latestTime) {
                    throw new ApiError(
                        `No se puede iniciar el paseo fuera de la ventana permitida. ` +
                        `El paseo está programado para ${scheduledStartTime.toLocaleString('es-AR')} ` +
                        `(±20 minutos)`,
                        400
                    );
                }
            }

            const results = await db.query(
                'CALL sp_walk_update_status(?, ?)',
                [walkId, dbStatus]
            );

            if (results && results[0] && results[0].length > 0) {
                return this.formatWalkData(results[0][0]);
            }

            throw new ApiError('Error al actualizar estado del paseo', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar estado del paseo', 500);
        }
    }

    // Actualizar información del paseo
    async updateWalk(walkId, walkData) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (!walkData || Object.keys(walkData).length === 0) {
                throw new ApiError('Datos de paseo requeridos', 400);
            }

            const { duration, distance, walkerNotes, adminNotes } = walkData;

            const results = await db.query(
                'CALL sp_walk_update(?, ?, ?, ?, ?)',
                [
                    walkId,
                    duration || null,
                    distance || null,
                    walkerNotes || null,
                    adminNotes || null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                return this.formatWalkData(results[0][0]);
            }

            throw new ApiError('Error al actualizar paseo', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar paseo', 500);
        }
    }

    // Eliminar paseo
    async deleteWalk(walkId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const results = await db.query('CALL sp_walk_delete(?)', [walkId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.affected_rows > 0) {
                    return { message: 'Paseo eliminado exitosamente' };
                }
            }

            throw new ApiError('Error al eliminar paseo', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al eliminar paseo', 500);
        }
    }

    // Validar transición de estado
    validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            'solicitado': ['esperando_pago', 'rechazado', 'cancelado'],
            'esperando_pago': ['agendado', 'cancelado'],
            'agendado': ['activo', 'cancelado'],
            'activo': ['finalizado'],
            'finalizado': [],
            'rechazado': [],
            'cancelado': []
        };

        const statusMap = {
            'Solicitado': 'solicitado',
            'Esperando pago': 'esperando_pago',
            'Agendado': 'agendado',
            'Activo': 'activo',
            'Finalizado': 'finalizado',
            'Rechazado': 'rechazado',
            'Cancelado': 'cancelado'
        };

        const dbCurrentStatus = statusMap[currentStatus] || currentStatus.toLowerCase();
        const dbNewStatus = statusMap[newStatus] || newStatus.toLowerCase();

        if (!validTransitions[dbCurrentStatus]) {
            throw new ApiError(`Estado actual inválido: ${currentStatus}`, 400);
        }

        if (!validTransitions[dbCurrentStatus].includes(dbNewStatus)) {
            throw new ApiError(
                `Transición de estado inválida de '${currentStatus}' a '${newStatus}'`,
                400
            );
        }

        return true;
    }

    // Formatear datos del paseo para respuesta
    formatWalkData(walk) {
        
        const statusMap = {
            'solicitado': 'Solicitado',
            'esperando_pago': 'Esperando pago',
            'agendado': 'Agendado',
            'activo': 'Activo',
            'finalizado': 'Finalizado',
            'rechazado': 'Rechazado',
            'cancelado': 'Cancelado'
        };

        const petIds = walk.petIds ? walk.petIds.split(',').map(id => parseInt(id)) : [];

        return {
            id: walk.id,
            dogName: walk.petNames || '',
            walkerId: walk.walkerId,
            ownerId: walk.ownerId,
            walkerName: walk.walkerName,
            ownerName: walk.ownerName,
            startTime: walk.scheduledStartTime,
            actualStartTime: walk.actualStartTime,
            endTime: walk.scheduledEndTime,
            actualEndTime: walk.actualEndTime,
            startAddress: walk.startAddress,
            status: statusMap[walk.status] || walk.status,
            duration: walk.duration,
            distance: walk.distance,
            totalPrice: walk.totalPrice,
            notes: walk.walkerNotes,
            adminNotes: walk.adminNotes,
            petIds: petIds,
            petNames: walk.petNames,
            createdAt: walk.createdAt,
            updatedAt: walk.updatedAt
        };
    }

    // Obtener recibo de un paseo por ID
    async getReceiptByWalkId(walkId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const results = await db.query('CALL sp_walk_get_receipt(?)', [walkId]);
            
            if (results && results[0] && results[0].length > 0) {
                return this.formatReceiptData(results[0][0]);
            }
            return null;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener recibo del paseo', 500);
        }
    }

    // Obtener recibos de un usuario (owner o walker)
    async getReceiptsByUser(userId, userType) {
        try {
            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!userType || !['owner', 'walker'].includes(userType)) {
                throw new ApiError('Tipo de usuario debe ser "owner" o "walker"', 400);
            }

            const results = await db.query('CALL sp_walk_get_receipts_by_user(?, ?)', [userId, userType]);
            
            if (results && results[0]) {
                return results[0].map(receipt => this.formatReceiptSummaryData(receipt));
            }
            return [];
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener recibos del usuario', 500);
        }
    }

    // Formatear datos completos del recibo
    formatReceiptData(receipt) {
        return {
            paymentId: receipt.paymentId,
            walkId: receipt.walkId,
            amountPaid: receipt.amountPaid,
            paymentDate: receipt.paymentDate,
            paymentMethod: receipt.paymentMethod,
            transactionId: receipt.transactionId,
            paymentStatus: receipt.paymentStatus,
            paymentNotes: receipt.paymentNotes,
            walk: {
                scheduledStartTime: receipt.scheduledStartTime,
                actualStartTime: receipt.actualStartTime,
                scheduledEndTime: receipt.scheduledEndTime,
                actualEndTime: receipt.actualEndTime,
                startAddress: receipt.startAddress,
                duration: receipt.duration,
                distance: receipt.distance,
                totalPrice: receipt.totalPrice,
                walkPrice: receipt.walkPrice,
                status: receipt.walkStatus
            },
            walker: {
                id: receipt.walkerId,
                name: receipt.walkerName,
                email: receipt.walkerEmail,
                phone: receipt.walkerPhone,
                image: receipt.walkerImage
            },
            owner: {
                id: receipt.ownerId,
                name: receipt.ownerName,
                email: receipt.ownerEmail,
                phone: receipt.ownerPhone,
                image: receipt.ownerImage
            },
            pets: {
                names: receipt.petNames,
                ids: receipt.petIds ? receipt.petIds.split(',').map(id => parseInt(id)) : []
            },
            walkerSettings: {
                hadDiscount: receipt.walkerHadDiscount,
                discountPercentage: receipt.walkerDiscountPercentage
            },
            createdAt: {
                walk: receipt.walkCreatedAt,
                payment: receipt.paymentCreatedAt
            }
        };
    }

    formatReceiptSummaryData(receipt) {
        return {
            paymentId: receipt.paymentId,
            walkId: receipt.walkId,
            amountPaid: receipt.amountPaid,
            paymentDate: receipt.paymentDate,
            paymentMethod: receipt.paymentMethod,
            paymentStatus: receipt.paymentStatus,
            scheduledStartTime: receipt.scheduledStartTime,
            startAddress: receipt.startAddress,
            walkStatus: receipt.walkStatus,
            walkerName: receipt.walkerName,
            ownerName: receipt.ownerName,
            petNames: receipt.petNames
        };
    }
}

module.exports = new Walk();