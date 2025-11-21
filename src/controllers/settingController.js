const Setting = require('../models/Setting');
const Walker = require('../models/Walker');
const { ApiError } = require('../middleware/errorHandler');

class SettingController {
    // Obtener configuraciones de usuario
    static async getUserSettings(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const settings = await Setting.getUserSettings(parseInt(userId));

            res.status(200).json({
                status: 'success',
                data: {
                    settings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar configuraciones de usuario
    static async updateUserSettings(req, res, next) {
        try {
            const { userId } = req.params;
            const settingsData = req.body;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!settingsData || Object.keys(settingsData).length === 0) {
                throw new ApiError('Datos de configuración requeridos', 400);
            }

            const updatedSettings = await Setting.updateUserSettings(parseInt(userId), settingsData);

            res.status(200).json({
                status: 'success',
                message: 'Configuraciones actualizadas exitosamente',
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener suscripción del usuario
    static async getUserSubscription(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const subscription = await Setting.getUserSubscription(parseInt(userId));

            res.status(200).json({
                status: 'success',
                data: {
                    subscription
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar suscripción del usuario
    static async updateSubscription(req, res, next) {
        try {
            const { userId } = req.params;
            const subscriptionData = req.body;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!subscriptionData || Object.keys(subscriptionData).length === 0) {
                throw new ApiError('Datos de suscripción requeridos', 400);
            }

            const updatedSubscription = await Setting.updateSubscription(parseInt(userId), subscriptionData);

            res.status(200).json({
                status: 'success',
                message: 'Suscripción actualizada exitosamente',
                data: {
                    subscription: updatedSubscription
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener planes de suscripción activos
    static async getActiveSubscriptionPlans(req, res, next) {
        try {
            const plans = await Setting.getActiveSubscriptionPlans();

            res.status(200).json({
                status: 'success',
                data: {
                    plans
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener todos los planes de suscripción
    static async getAllSubscriptionPlans(req, res, next) {
        try {
            const plans = await Setting.getAllSubscriptionPlans();

            res.status(200).json({
                status: 'success',
                data: {
                    plans
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener plan por ID
    static async getSubscriptionPlanById(req, res, next) {
        try {
            const { planId } = req.params;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            const plan = await Setting.getSubscriptionPlanById(planId);

            if (!plan) {
                throw new ApiError('Plan no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    plan
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Crear nuevo plan de suscripción
    static async createSubscriptionPlan(req, res, next) {
        try {
            const planData = req.body;

            if (!planData || Object.keys(planData).length === 0) {
                throw new ApiError('Datos de plan requeridos', 400);
            }

            const { plan_id, name, price, features } = planData;

            if (!plan_id || typeof plan_id !== 'string' || plan_id.trim() === '') {
                throw new ApiError('ID de plan es requerido', 400);
            }

            if (!name || typeof name !== 'string' || name.trim() === '') {
                throw new ApiError('Nombre de plan es requerido', 400);
            }

            if (price === undefined || typeof price !== 'number' || price < 0) {
                throw new ApiError('Precio debe ser un número válido', 400);
            }

            if (!Array.isArray(features) || features.length === 0) {
                throw new ApiError('Debe incluir al menos una característica', 400);
            }

            const newPlan = await Setting.createSubscriptionPlan(planData);

            res.status(201).json({
                status: 'success',
                message: 'Plan creado exitosamente',
                data: {
                    plan: newPlan
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar plan de suscripción
    static async updateSubscriptionPlan(req, res, next) {
        try {
            const { planId } = req.params;
            const planData = req.body;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            if (!planData || Object.keys(planData).length === 0) {
                throw new ApiError('Datos de plan requeridos', 400);
            }

            const { name, price, features } = planData;

            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim() === '') {
                    throw new ApiError('El nombre debe ser un texto válido', 400);
                }
            }

            if (price !== undefined) {
                if (typeof price !== 'number' || price < 0) {
                    throw new ApiError('El precio debe ser un número válido', 400);
                }
            }

            if (features !== undefined) {
                if (!Array.isArray(features) || features.length === 0) {
                    throw new ApiError('Debe incluir al menos una característica', 400);
                }
            }

            const updatedPlan = await Setting.updateSubscriptionPlan(planId, planData);

            res.status(200).json({
                status: 'success',
                message: 'Plan actualizado exitosamente',
                data: {
                    plan: updatedPlan
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Eliminar plan de suscripción
    static async deleteSubscriptionPlan(req, res, next) {
        try {
            const { planId } = req.params;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            const result = await Setting.deleteSubscriptionPlan(planId);

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    planId
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener usuarios con un plan específico
    static async getUsersWithPlan(req, res, next) {
        try {
            const { planId } = req.params;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            const users = await Setting.getUsersWithPlan(planId);

            res.status(200).json({
                status: 'success',
                data: {
                    users,
                    planId,
                    count: users.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtener estadísticas de suscripciones
    static async getSubscriptionStats(req, res, next) {
        try {
            const stats = await Setting.getSubscriptionStats();

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

    // Obtener características de un plan
    static async getPlanFeatures(req, res, next) {
        try {
            const { planId } = req.params;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            const features = await Setting.getPlanFeatures(planId);

            if (!features) {
                throw new ApiError('Plan no encontrado', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    planId,
                    features
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Validar transición de plan
    static async validatePlanTransition(req, res, next) {
        try {
            const { fromPlanId, toPlanId } = req.params;

            if (!toPlanId) {
                throw new ApiError('ID de plan destino requerido', 400);
            }

            const validation = await Setting.validatePlanTransition(fromPlanId, toPlanId);

            res.status(200).json({
                status: 'success',
                data: {
                    validation,
                    fromPlanId,
                    toPlanId
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Toggle estado de plan (activar/desactivar)
    static async togglePlanStatus(req, res, next) {
        try {
            const { planId } = req.params;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            // Primero obtener el plan actual
            const currentPlan = await Setting.getSubscriptionPlanById(planId);
            if (!currentPlan) {
                throw new ApiError('Plan no encontrado', 404);
            }

            // Actualizar con el estado opuesto
            const updatedPlan = await Setting.updateSubscriptionPlan(planId, {
                is_active: !currentPlan.is_active
            });

            res.status(200).json({
                status: 'success',
                message: `Plan ${updatedPlan.is_active ? 'activado' : 'desactivado'} exitosamente`,
                data: {
                    plan: updatedPlan
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Validar upgrade de suscripción para un usuario
    static async validateSubscriptionUpgrade(req, res, next) {
        try {
            const { userId, newPlanId } = req.params;

            if (!userId || isNaN(userId)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!newPlanId) {
                throw new ApiError('ID de nuevo plan requerido', 400);
            }

            // Obtener suscripción actual del usuario
            const currentSubscription = await Setting.getUserSubscription(parseInt(userId));
            const currentPlanId = currentSubscription ? currentSubscription.plan : 'free';

            // Validar transición
            const validation = await Setting.validatePlanTransition(currentPlanId, newPlanId);

            // Obtener detalles de los planes
            const currentPlan = await Setting.getSubscriptionPlanById(currentPlanId);
            const newPlan = await Setting.getSubscriptionPlanById(newPlanId);

            res.status(200).json({
                status: 'success',
                data: {
                    userId: parseInt(userId),
                    validation,
                    currentPlan,
                    newPlan,
                    priceDifference: newPlan ? newPlan.price - (currentPlan?.price || 0) : 0
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método adicional para obtener planes con filtro
    static async getSubscriptionPlans(req, res, next) {
        try {
            const { active } = req.query;

            let plans;
            if (active === 'true') {
                plans = await Setting.getActiveSubscriptionPlans();
            } else {
                plans = await Setting.getAllSubscriptionPlans();
            }

            res.status(200).json({
                status: 'success',
                data: {
                    plans,
                    total: plans.length,
                    activeOnly: active === 'true'
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Validar que un plan existe
    static async validatePlan(req, res, next) {
        try {
            const { planId } = req.params;

            if (!planId) {
                throw new ApiError('ID de plan requerido', 400);
            }

            const plan = await Setting.getSubscriptionPlanById(planId);
            const isValid = plan !== null;

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    planId
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Actualizar configuraciones de GPS
    static async updateGpsSettings(req, res, next) {
        try {
            const { walkerId } = req.params;
            const gpsData = req.body;

            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            if (!gpsData || Object.keys(gpsData).length === 0) {
                throw new ApiError('Datos de GPS requeridos', 400);
            }

            const { gps_tracking_enabled, gps_tracking_interval } = gpsData;

            if (gps_tracking_enabled === undefined && gps_tracking_interval === undefined) {
                throw new ApiError('Debe proporcionar al menos un campo para actualizar', 400);
            }

            if (gps_tracking_interval !== undefined) {
                if (typeof gps_tracking_interval !== 'number') {
                    throw new ApiError('El intervalo debe ser un número', 400);
                }
                if (gps_tracking_interval < 10 || gps_tracking_interval > 300) {
                    throw new ApiError('El intervalo debe estar entre 10 y 300 segundos', 400);
                }
            }

            const updatedSettings = await Setting.updateGpsSettings(parseInt(walkerId), gpsData);

            res.status(200).json({
                status: 'success',
                message: 'Configuraciones de GPS actualizadas exitosamente',
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Toggle GPS tracking
    static async toggleGpsTracking(req, res, next) {
        try {
            const { walkerId } = req.params;

            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const currentSettings = await Walker.getWalkerSettings(parseInt(walkerId));
            
            if (!currentSettings) {
                throw new ApiError('Configuraciones no encontradas', 404);
            }

            const updatedSettings = await Setting.updateGpsSettings(parseInt(walkerId), {
                gps_tracking_enabled: !currentSettings.gps_tracking_enabled
            });

            res.status(200).json({
                status: 'success',
                message: `GPS ${updatedSettings.gps_tracking_enabled ? 'activado' : 'desactivado'} exitosamente`,
                data: {
                    settings: updatedSettings
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SettingController;