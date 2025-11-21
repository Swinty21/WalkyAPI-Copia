const WalkerRegistration = require('../models/WalkerRegistration');
const { ApiError } = require('../middleware/errorHandler');

class WalkerRegistrationController {
    static async createRegistration(req, res, next) {
        try {
            const registrationData = req.body;
            
            if (!registrationData || Object.keys(registrationData).length === 0) {
                throw new ApiError('Datos de registro requeridos', 400);
            }

            const { userId, fullName, phone, dni, city, province, images } = registrationData;

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

            // Generar ID de registro único
            const registrationId = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Procesar imágenes con URLs simuladas
            const processedImages = {};
            for (const [key, file] of Object.entries(images)) {
                if (file) {
                    processedImages[key] = {
                        filename: file || 'unknown_file',
                        originalName: file || 'unknown_original',
                        size: file.size || 0,
                        type: file.type || 'application/octet-stream',
                        uploadedAt: new Date().toISOString(),
                        url: 'unknow'
                    };
                }
            }

            const registrationPayload = {
                registrationId,
                userId,
                fullName,
                phone,
                dni,
                city,
                province,
                images: processedImages,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                applicationScore: 0
            };

            const newRegistration = await WalkerRegistration.createRegistration(registrationPayload);

            res.status(201).json({
                status: 'success',
                message: 'Solicitud de registro creada exitosamente',
                data: {
                    registration: newRegistration
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllRegistrations(req, res, next) {
        try {
            const registrations = await WalkerRegistration.getAllRegistrations();

            // Ordenar por fecha de envío más reciente
            const sortedRegistrations = registrations.sort((a, b) => 
                new Date(b.submittedAt) - new Date(a.submittedAt)
            );

            res.status(200).json({
                status: 'success',
                data: {
                    registrations: sortedRegistrations,
                    total: sortedRegistrations.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getRegistrationById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                throw new ApiError('ID de registro requerido', 400);
            }

            const registration = await WalkerRegistration.getRegistrationById(id);

            if (!registration) {
                throw new ApiError('Registro no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    registration
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateRegistration(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id) {
                throw new ApiError('ID de registro requerido', 400);
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                throw new ApiError('Datos de actualización requeridos', 400);
            }

            const { status, adminNotes } = updateData;

            if (status && !['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
                throw new ApiError('Estado inválido', 400);
            }

            const updatePayload = {
                status,
                adminNotes: adminNotes || '',
                reviewedBy: req.tokenData?.name || null,
                reviewedAt: new Date().toISOString()
            };
            
            if (status === 'approved') {
                const registration = await WalkerRegistration.getRegistrationById(id);
                
                if (registration) {
                    updatePayload.applicationScore = WalkerRegistrationController.calculateApplicationScore(registration);
                    
                    try {
                        await WalkerRegistration.promoteUserToWalker(registration.userId);
                    } catch (promoteError) {
                        updatePayload.adminNotes = (updatePayload.adminNotes || '') + 
                            (updatePayload.adminNotes ? ' | ' : '') + 
                            'Advertencia: Error al promover usuario automáticamente. Verificar rol manualmente.';
                    }
                }
            }

            const updatedRegistration = await WalkerRegistration.updateRegistration(id, updatePayload);
            
            res.status(200).json({
                status: 'success',
                message: 'Registro actualizado exitosamente',
                data: {
                    registration: updatedRegistration
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteRegistration(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                throw new ApiError('ID de registro requerido', 400);
            }

            const result = await WalkerRegistration.deleteRegistration(id);

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    registrationId: id
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getRegistrationsByStatus(req, res, next) {
        try {
            const { status } = req.params;

            if (!status) {
                throw new ApiError('Estado requerido', 400);
            }

            if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
                throw new ApiError('Estado inválido', 400);
            }

            const registrations = await WalkerRegistration.getRegistrationsByStatus(status);

            // Ordenar por fecha más reciente
            const sortedRegistrations = registrations.sort((a, b) => 
                new Date(b.submittedAt) - new Date(a.submittedAt)
            );

            res.status(200).json({
                status: 'success',
                data: {
                    registrations: sortedRegistrations,
                    total: sortedRegistrations.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getApplicationByUserId(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const application = await WalkerRegistration.getApplicationByUserId(parseInt(userId));
            res.status(200).json({
                status: 'success',
                data: {
                    application
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getRegistrationStatistics(req, res, next) {
        try {
            const statistics = await WalkerRegistration.getRegistrationStatistics();

            res.status(200).json({
                status: 'success',
                data: {
                    statistics
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async promoteUserToWalker(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const result = await WalkerRegistration.promoteUserToWalker(parseInt(userId));

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    success: result.success,
                    newRole: result.newRole,
                    userId: parseInt(userId)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método auxiliar para calcular score de aplicación
    static calculateApplicationScore(registration) {
        let score = 0;
        
        if (registration.fullName && registration.fullName.length >= 5) score += 20;
        if (registration.phone && registration.phone.length >= 8) score += 15;
        if (registration.dni && /^\d{7,8}$/.test(registration.dni)) score += 20;
        if (registration.city && registration.city.length >= 3) score += 10;
        if (registration.province && registration.province.length >= 3) score += 10;
        
        const imageKeys = ['dniFront', 'dniBack', 'selfieWithDni'];
        imageKeys.forEach(key => {
            if (registration.images && registration.images[key]) score += 8;
        });

        const submissionHour = new Date(registration.submittedAt).getHours();
        if (submissionHour >= 9 && submissionHour <= 17) score += 5;

        return Math.min(score, 100);
    }
}

module.exports = WalkerRegistrationController;