const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class WalkerRegistration extends BaseModel {
    constructor() {
        super('walker_registrations');
    }

    // Crear nueva solicitud de registro
    async createRegistration(registrationData) {
        try {
            if (!registrationData) {
                throw new ApiError('Datos de registro requeridos', 400);
            }

            const { 
                registrationId, 
                userId, 
                fullName, 
                phone, 
                dni, 
                city, 
                province, 
                images,
                status,
                submittedAt,
                applicationScore
            } = registrationData;

            if (!userId || !fullName || !phone || !dni || !city || !province) {
                throw new ApiError('Campos requeridos: userId, fullName, phone, dni, city, province', 400);
            }

            if (!/^\d{7,8}$/.test(dni.trim())) {
                throw new ApiError('DNI debe tener 7 u 8 dígitos', 400);
            }

            const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
            if (!/^\d{8,15}$/.test(cleanPhone)) {
                throw new ApiError('Formato de teléfono inválido', 400);
            }

            if (!images || !images.dniFront || !images.dniBack || !images.selfieWithDni) {
                throw new ApiError('Todas las imágenes son requeridas: dniFront, dniBack, selfieWithDni', 400);
            }

            const results = await db.query(
                'CALL sp_walker_registration_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    registrationId,
                    userId,
                    fullName.trim(),
                    cleanPhone,
                    dni.trim(),
                    city.trim(),
                    province.trim(),
                    status || 'pending',
                    submittedAt || new Date().toISOString(),
                    applicationScore || 0,
                    JSON.stringify(images)
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.message) {
                    if (result.message === 'Registro creado') {
                        return {
                            id: registrationId,
                            userId,
                            fullName,
                            phone: cleanPhone,
                            dni: dni.trim(),
                            city: city.trim(),
                            province: province.trim(),
                            images,
                            status: status || 'pending',
                            submittedAt: submittedAt || new Date().toISOString(),
                            reviewedAt: null,
                            reviewedBy: null,
                            adminNotes: '',
                            applicationScore: applicationScore || 0
                        };
                    } else {
                        throw new ApiError(result.message, 400);
                    }
                }
            }

            throw new ApiError('Error al crear registro - no se recibió respuesta del SP', 500);
        } catch (error) {
            
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(`Error al crear registro de paseador: ${error.message}`, 500);
        }
    }

    // Obtener todas las solicitudes
    async getAllRegistrations() {
        try {
            const results = await db.query('CALL sp_walker_registration_get_all()');
            
            if (results && results[0]) {
                return results[0].map(reg => this.formatRegistration(reg));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener registros', 500);
        }
    }

    // Obtener registro por ID
    async getRegistrationById(registrationId) {
        try {
            if (!registrationId) {
                throw new ApiError('ID de registro requerido', 400);
            }

            const results = await db.query('CALL sp_walker_registration_get_by_id(?)', [registrationId]);
            
            if (results && results[0] && results[0].length > 0) {
                return this.formatRegistration(results[0][0]);
            }
            return null;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener registro', 500);
        }
    }

    // Actualizar registro
    async updateRegistration(registrationId, updateData) {
        try {
            if (!registrationId) {
                throw new ApiError('ID de registro requerido', 400);
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                throw new ApiError('Datos de actualización requeridos', 400);
            }

            const { status, adminNotes, reviewedBy, reviewedAt, applicationScore } = updateData;

            if (status && !this.isValidStatus(status)) {
                throw new ApiError('Estado inválido', 400);
            }

            const results = await db.query(
                'CALL sp_walker_registration_update(?, ?, ?, ?, ?, ?)',
                [
                    registrationId,
                    status || null,
                    adminNotes || null,
                    reviewedBy || null,
                    reviewedAt || null,
                    applicationScore || null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                return this.formatRegistration(results[0][0]);
            }

            throw new ApiError('Error al actualizar registro', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar registro', 500);
        }
    }

    // Eliminar registro
    async deleteRegistration(registrationId) {
        try {
            if (!registrationId) {
                throw new ApiError('ID de registro requerido', 400);
            }

            const results = await db.query('CALL sp_walker_registration_delete(?)', [registrationId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.affected_rows > 0) {
                    return { message: 'Registro eliminado exitosamente' };
                }
            }

            throw new ApiError('Error al eliminar registro', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al eliminar registro', 500);
        }
    }

    // Obtener registros por estado
    async getRegistrationsByStatus(status) {
        try {
            if (!status) {
                throw new ApiError('Estado requerido', 400);
            }

            if (!this.isValidStatus(status)) {
                throw new ApiError('Estado inválido', 400);
            }

            const results = await db.query('CALL sp_walker_registration_get_by_status(?)', [status]);
            
            if (results && results[0]) {
                return results[0].map(reg => this.formatRegistration(reg));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener registros por estado', 500);
        }
    }

    // Obtener registro por usuario
    async getApplicationByUserId(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_walker_registration_get_by_user(?)', [userId]);
            
            if (results && results[0] && results[0].length > 0) {
                return this.formatRegistration(results[0][0]);
            }
            
            throw new ApiError('No application found for this user', 404);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener solicitud por usuario', 500);
        }
    }

    // Obtener estadísticas
    async getRegistrationStatistics() {
        try {
            const results = await db.query('CALL sp_walker_registration_get_statistics()');
            
            if (results && results[0] && results[0].length > 0) {
                const stats = results[0][0];
                return {
                    total: stats.total || 0,
                    pending: stats.pending || 0,
                    under_review: stats.under_review || 0,
                    approved: stats.approved || 0,
                    rejected: stats.rejected || 0
                };
            }
            return {
                total: 0,
                pending: 0,
                under_review: 0,
                approved: 0,
                rejected: 0
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener estadísticas', 500);
        }
    }

    // Promover usuario a walker
    async promoteUserToWalker(userId) {
        try {
            if (!userId) {
                throw new ApiError('ID de usuario requerido', 400);
            }

            const results = await db.query('CALL sp_walker_registration_promote_user(?)', [userId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                return {
                    success: true,
                    message: result.message || 'Usuario promovido exitosamente',
                    newRole: 'walker'
                };
            }

            throw new ApiError('Error al promover usuario', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al promover usuario a walker', 500);
        }
    }

    // Validar estado
    isValidStatus(status) {
        const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
        return validStatuses.includes(status);
    }

    // Formatear registro para respuesta
    formatRegistration(reg) {
        if (!reg) return null;

        let images = {};
        try {
            if (reg.images && typeof reg.images === 'string') {
                images = JSON.parse(reg.images);
            } else if (reg.images && typeof reg.images === 'object') {
                images = reg.images;
            } else {
                // Construir desde campos individuales si existen
                images = {
                    dniFront: reg.dni_front_image || null,
                    dniBack: reg.dni_back_image || null,
                    selfieWithDni: reg.selfie_image || null
                };
            }
        } catch (e) {
            images = {};
        }

        return {
            id: reg.registration_id || reg.id,
            userId: reg.user_id,
            fullName: reg.full_name,
            phone: reg.phone,
            dni: reg.dni,
            city: reg.city,
            province: reg.province,
            images: images,
            status: reg.status,
            submittedAt: reg.created_at || reg.submitted_at,
            reviewedAt: reg.reviewed_at,
            reviewedBy: reg.reviewed_by,
            adminNotes: reg.admin_notes || '',
            applicationScore: reg.application_score || 0
        };
    }
}

module.exports = new WalkerRegistration();