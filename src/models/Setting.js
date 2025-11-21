const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Setting extends BaseModel {
    constructor() {
        super('user_settings');
    }

    // Obtener configuraciones de usuario
    async getUserSettings(userId) {
        try {
            if (!userId) {
                throw new ApiError('User ID is required', 400);
            }

            const results = await db.query('CALL sp_settings_get_user(?)', [userId]);
            
            if (results && results[0] && results[0].length > 0) {
                const settings = results[0][0];
                return {
                    email: settings.email,
                    notification_walk_status: Boolean(settings.notification_walk_status),
                    notification_announcements: Boolean(settings.notification_announcements),
                    notification_subscription: Boolean(settings.notification_subscription),
                    notification_messages: Boolean(settings.notification_messages),
                    notification_system_alerts: Boolean(settings.notification_system_alerts),
                    updated_at: settings.updated_at
                };
            }
            
            // Return default settings if none exist
            return {
                email: '',
                notification_walk_status: true,
                notification_announcements: true,
                notification_subscription: true,
                notification_messages: true,
                notification_system_alerts: true,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener configuraciones del usuario', 500);
        }
    }

    // Actualizar configuraciones de usuario
    async updateUserSettings(userId, settings) {
        try {
            if (!userId) {
                throw new ApiError('User ID is required', 400);
            }

            if (!settings) {
                throw new ApiError('Settings data is required', 400);
            }

            const { email, notifications } = settings;

            // Validate email if provided
            if (email !== undefined && !this.isValidEmail(email)) {
                throw new ApiError('Invalid email format', 400);
            }

            const results = await db.query(
                'CALL sp_settings_update_user(?, ?, ?, ?, ?, ?, ?)',
                [
                    userId,
                    email || null,
                    notifications?.walkStatus !== undefined ? notifications.walkStatus : null,
                    notifications?.announcements !== undefined ? notifications.announcements : null,
                    notifications?.subscription !== undefined ? notifications.subscription : null,
                    notifications?.messages !== undefined ? notifications.messages : null,
                    notifications?.systemAlerts !== undefined ? notifications.systemAlerts : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedSettings = results[0][0];
                return {
                    email: updatedSettings.email,
                    notification_walk_status: Boolean(updatedSettings.notification_walk_status),
                    notification_announcements: Boolean(updatedSettings.notification_announcements),
                    notification_subscription: Boolean(updatedSettings.notification_subscription),
                    notification_messages: Boolean(updatedSettings.notification_messages),
                    notification_system_alerts: Boolean(updatedSettings.notification_system_alerts),
                    updated_at: updatedSettings.updated_at
                };
            }

            throw new ApiError('Error al actualizar configuraciones', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar configuraciones del usuario', 500);
        }
    }

    // Obtener suscripción del usuario
    async getUserSubscription(userId) {
        try {
            if (!userId) {
                throw new ApiError('User ID is required', 400);
            }

            const results = await db.query('CALL sp_settings_get_user_subscription(?)', [userId]);
            
            if (results && results[0] && results[0].length > 0) {
                const subscription = results[0][0];
                return {
                    plan: subscription.plan_id || 'free',
                    start_date: subscription.start_date,
                    expiry_date: subscription.expiry_date,
                    is_active: Boolean(subscription.is_active)
                };
            }

            return null;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener suscripción del usuario', 500);
        }
    }

    // Actualizar suscripción del usuario
    async updateSubscription(userId, subscriptionData) {
        try {
            if (!userId) {
                throw new ApiError('User ID is required', 400);
            }

            if (!subscriptionData) {
                throw new ApiError('Subscription data is required', 400);
            }

            const { plan, start_date, expiry_date, is_active } = subscriptionData;

            const results = await db.query(
                'CALL sp_settings_update_subscription(?, ?, ?, ?, ?)',
                [
                    userId,
                    plan || 'free',
                    start_date || new Date().toISOString(),
                    expiry_date || null,
                    is_active !== undefined ? is_active : true
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedSubscription = results[0][0];
                return {
                    plan: updatedSubscription.plan_id || updatedSubscription.plan,
                    start_date: updatedSubscription.start_date,
                    expiry_date: updatedSubscription.expiry_date,
                    is_active: Boolean(updatedSubscription.is_active),
                    updated_at: updatedSubscription.updated_at
                };
            }

            throw new ApiError('Error al actualizar suscripción', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar suscripción', 500);
        }
    }

    // Obtener planes de suscripción activos
    async getActiveSubscriptionPlans() {
        try {
            const results = await db.query('CALL sp_settings_get_active_plans()');
            
            if (results && results[0]) {
                return results[0].map(plan => ({
                    id: plan.id,
                    plan_id: plan.plan_id,
                    name: plan.name,
                    price: plan.price,
                    duration: plan.duration,
                    category: plan.category,
                    description: plan.description,
                    max_walks: plan.max_walks,
                    features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
                    support_level: plan.support_level,
                    cancellation_policy: plan.cancellation_policy,
                    discount_percentage: plan.discount_percentage,
                    is_active: Boolean(plan.is_active),
                    created_at: plan.created_at,
                    updated_at: plan.updated_at
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener planes activos', 500);
        }
    }

    // Obtener todos los planes de suscripción
    async getAllSubscriptionPlans() {
        try {
            const results = await db.query('CALL sp_settings_get_all_plans()');
            
            if (results && results[0]) {
                return results[0].map(plan => ({
                    id: plan.id,
                    plan_id: plan.plan_id,
                    name: plan.name,
                    price: plan.price,
                    duration: plan.duration,
                    category: plan.category,
                    description: plan.description,
                    max_walks: plan.max_walks,
                    features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
                    support_level: plan.support_level,
                    cancellation_policy: plan.cancellation_policy,
                    discount_percentage: plan.discount_percentage,
                    is_active: Boolean(plan.is_active),
                    created_at: plan.created_at,
                    updated_at: plan.updated_at
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener todos los planes', 500);
        }
    }

    // Obtener plan por ID
    async getSubscriptionPlanById(planId) {
        try {
            if (!planId) {
                throw new ApiError('Plan ID is required', 400);
            }

            const results = await db.query('CALL sp_settings_get_plan_by_id(?)', [planId]);
            
            if (results && results[0] && results[0].length > 0) {
                const plan = results[0][0];
                return {
                    id: plan.id,
                    plan_id: plan.plan_id,
                    name: plan.name,
                    price: plan.price,
                    duration: plan.duration,
                    category: plan.category,
                    description: plan.description,
                    max_walks: plan.max_walks,
                    features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
                    support_level: plan.support_level,
                    cancellation_policy: plan.cancellation_policy,
                    discount_percentage: plan.discount_percentage,
                    is_active: Boolean(plan.is_active),
                    created_at: plan.created_at,
                    updated_at: plan.updated_at
                };
            }
            return null;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener plan por ID', 500);
        }
    }

    // Crear nuevo plan de suscripción
    async createSubscriptionPlan(planData) {
        try {
            if (!planData) {
                throw new ApiError('Plan data is required', 400);
            }

            const { 
                plan_id, name, price, duration, category, description, max_walks,
                features, support_level, cancellation_policy, discount_percentage, is_active
            } = planData;

            if (!plan_id || !name || price === undefined) {
                throw new ApiError('plan_id, name, and price are required', 400);
            }

            const results = await db.query(
                'CALL sp_settings_create_plan(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    plan_id,
                    name,
                    price,
                    duration || 'monthly',
                    category || 'standard',
                    description || '',
                    max_walks || 0,
                    JSON.stringify(features || []),
                    support_level || 'email',
                    cancellation_policy || 'none',
                    discount_percentage || 0,
                    is_active !== undefined ? is_active : false
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const newPlan = results[0][0];
                return {
                    id: newPlan.id,
                    plan_id: newPlan.plan_id,
                    name: newPlan.name,
                    price: newPlan.price,
                    duration: newPlan.duration,
                    category: newPlan.category,
                    description: newPlan.description,
                    max_walks: newPlan.max_walks,
                    features: typeof newPlan.features === 'string' ? JSON.parse(newPlan.features) : newPlan.features,
                    support_level: newPlan.support_level,
                    cancellation_policy: newPlan.cancellation_policy,
                    discount_percentage: newPlan.discount_percentage,
                    is_active: Boolean(newPlan.is_active),
                    created_at: newPlan.created_at,
                    updated_at: newPlan.updated_at
                };
            }

            throw new ApiError('Error al crear plan', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear plan de suscripción', 500);
        }
    }

    // Actualizar plan de suscripción
    async updateSubscriptionPlan(planId, planData) {
        try {
            if (!planId) {
                throw new ApiError('Plan ID is required', 400);
            }

            if (!planData || Object.keys(planData).length === 0) {
                throw new ApiError('Plan data is required', 400);
            }

            const { 
                name, price, duration, category, description, max_walks,
                features, support_level, cancellation_policy, discount_percentage, is_active
            } = planData;

            const results = await db.query(
                'CALL sp_settings_update_plan(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    planId,
                    name || null,
                    price !== undefined ? price : null,
                    duration || null,
                    category || null,
                    description || null,
                    max_walks !== undefined ? max_walks : null,
                    features ? JSON.stringify(features) : null,
                    support_level || null,
                    cancellation_policy || null,
                    discount_percentage !== undefined ? discount_percentage : null,
                    is_active !== undefined ? is_active : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedPlan = results[0][0];
                return {
                    id: updatedPlan.id,
                    plan_id: updatedPlan.plan_id,
                    name: updatedPlan.name,
                    price: updatedPlan.price,
                    duration: updatedPlan.duration,
                    category: updatedPlan.category,
                    description: updatedPlan.description,
                    max_walks: updatedPlan.max_walks,
                    features: typeof updatedPlan.features === 'string' ? JSON.parse(updatedPlan.features) : updatedPlan.features,
                    support_level: updatedPlan.support_level,
                    cancellation_policy: updatedPlan.cancellation_policy,
                    discount_percentage: updatedPlan.discount_percentage,
                    is_active: Boolean(updatedPlan.is_active),
                    created_at: updatedPlan.created_at,
                    updated_at: updatedPlan.updated_at
                };
            }

            throw new ApiError('Error al actualizar plan', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar plan de suscripción', 500);
        }
    }

    // Eliminar plan de suscripción
    async deleteSubscriptionPlan(planId) {
        try {
            if (!planId) {
                throw new ApiError('Plan ID is required', 400);
            }
            
            const results = await db.query('CALL sp_settings_delete_plan(?)', [planId]);

            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.affected_rows > 0) {
                    return { message: 'Plan eliminado exitosamente' };
                }
            }

            throw new ApiError('Error al eliminar plan', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al eliminar plan de suscripción', 500);
        }
    }

    // Obtener usuarios con un plan específico
    async getUsersWithPlan(planId) {
        try {
            if (!planId) {
                throw new ApiError('Plan ID is required', 400);
            }

            const results = await db.query('CALL sp_settings_get_users_with_plan(?)', [planId]);
            
            if (results && results[0]) {
                return results[0].map(user => parseInt(user.user_id));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener usuarios con el plan', 500);
        }
    }

    // Obtener estadísticas de suscripciones
    async getSubscriptionStats() {
        try {
            const results = await db.query('CALL sp_settings_get_subscription_stats()');
            
            if (results && results[0] && results[0].length > 0) {
                const stats = results[0][0];
                return {
                    totalUsers: stats.total_users,
                    planDistribution: JSON.parse(stats.plan_distribution || '{}'),
                    mostPopularPlan: stats.most_popular_plan,
                    activeSubscriptions: stats.active_subscriptions,
                    expiredSubscriptions: stats.expired_subscriptions
                };
            }

            return {
                totalUsers: 0,
                planDistribution: {},
                mostPopularPlan: 'free',
                activeSubscriptions: 0,
                expiredSubscriptions: 0
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener estadísticas de suscripciones', 500);
        }
    }

    // Obtener características de un plan
    async getPlanFeatures(planId) {
        try {
            if (!planId) {
                throw new ApiError('Plan ID is required', 400);
            }

            const plan = await this.getSubscriptionPlanById(planId);
            if (!plan) return null;

            return {
                maxWalks: plan.max_walks,
                hasGPS: plan.max_walks > 2,
                hasPhotos: plan.max_walks > 2,
                hasVideos: plan.max_walks > 8,
                hasHDVideos: plan.max_walks === -1,
                hasPremiumWalkers: plan.max_walks > 8,
                hasVIPWalkers: plan.max_walks === -1,
                hasPersonalWalker: plan.plan_id === 'platinum',
                supportLevel: plan.support_level,
                cancellationPolicy: plan.cancellation_policy,
                discountPercentage: plan.discount_percentage,
                hasEmergencyService: plan.max_walks === -1,
                hasNightWalks: plan.max_walks === -1,
                hasVetReports: plan.max_walks === -1,
                hasLiveStreaming: plan.plan_id === 'platinum',
                hasVetConsultations: plan.plan_id === 'platinum'
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener características del plan', 500);
        }
    }

    // Validar transición de plan
    async validatePlanTransition(fromPlanId, toPlanId) {
        try {
            if (!toPlanId) {
                throw new ApiError('Target plan ID is required', 400);
            }

            const results = await db.query('CALL sp_settings_validate_plan_transition(?, ?)', [fromPlanId || 'free', toPlanId]);
            
            if (results && results[0] && results[0].length > 0) {
                const validation = results[0][0];
                return {
                    isValid: Boolean(validation.is_valid),
                    isUpgrade: Boolean(validation.is_upgrade),
                    isDowngrade: Boolean(validation.is_downgrade),
                    requiresPayment: Boolean(validation.requires_payment),
                    refundAmount: validation.refund_amount || 0,
                    message: validation.message || 'Transition validated'
                };
            }

            return {
                isValid: false,
                isUpgrade: false,
                isDowngrade: false,
                requiresPayment: false,
                refundAmount: 0,
                message: 'Invalid plan transition'
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al validar transición de plan', 500);
        }
    }

    // Actualizar configuraciones de GPS del paseador
    async updateGpsSettings(walkerId, gpsData) {
        try {
            if (!walkerId) {
                throw new ApiError('Walker ID is required', 400);
            }

            if (!gpsData) {
                throw new ApiError('GPS data is required', 400);
            }

            const { gps_tracking_enabled, gps_tracking_interval } = gpsData;

            if (gps_tracking_interval !== undefined && (gps_tracking_interval < 10 || gps_tracking_interval > 300)) {
                throw new ApiError('El intervalo de rastreo debe estar entre 10 y 300 segundos', 400);
            }

            const results = await db.query(
                'CALL sp_walker_update_gps_settings(?, ?, ?)',
                [
                    walkerId,
                    gps_tracking_enabled !== undefined ? gps_tracking_enabled : null,
                    gps_tracking_interval !== undefined ? gps_tracking_interval : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedSettings = results[0][0];
                return {
                    walker_id: updatedSettings.walker_id,
                    location: updatedSettings.location,
                    price_per_pet: updatedSettings.pricePerPet,
                    has_gps_tracker: Boolean(updatedSettings.hasGPSTracker),
                    has_discount: Boolean(updatedSettings.hasDiscount),
                    discount_percentage: updatedSettings.discountPercentage,
                    has_mercadopago: Boolean(updatedSettings.hasMercadoPago),
                    token_mercadopago: updatedSettings.tokenMercadoPago,
                    gps_tracking_enabled: Boolean(updatedSettings.gpsTrackingEnabled),
                    gps_tracking_interval: updatedSettings.gpsTrackingInterval,
                    updated_at: updatedSettings.updatedAt
                };
            }

            throw new ApiError('Error al actualizar configuraciones de GPS', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar configuraciones de GPS', 500);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = new Setting();