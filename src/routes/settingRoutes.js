const express = require('express');
const SettingController = require('../controllers/settingController');
const WalkerController = require('../controllers/walkerController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de configuraciones requieren autenticación
router.use(authenticateToken);

// Rutas de configuraciones de usuario
router.get('/users/:userId', SettingController.getUserSettings);
router.put('/users/:userId', SettingController.updateUserSettings);
router.get('/users/:userId/subscription', SettingController.getUserSubscription);
router.put('/users/:userId/subscription', SettingController.updateSubscription);

// Rutas de planes de suscripción
router.get('/subscription-plans', SettingController.getSubscriptionPlans);
router.get('/subscription-plans/active', SettingController.getActiveSubscriptionPlans);
router.get('/subscription-plans/all', SettingController.getAllSubscriptionPlans);
router.get('/subscription-plans/:planId', SettingController.getSubscriptionPlanById);
router.post('/subscription-plans', SettingController.createSubscriptionPlan);
router.put('/subscription-plans/:planId', SettingController.updateSubscriptionPlan);
router.delete('/subscription-plans/:planId', SettingController.deleteSubscriptionPlan);
router.get('/subscription-plans/:planId/users', SettingController.getUsersWithPlan);
router.get('/subscription-plans/:planId/features', SettingController.getPlanFeatures);
router.get('/subscription-stats', SettingController.getSubscriptionStats);
router.get('/subscription-plans/:planId/validate', SettingController.validatePlan);
router.get('/plan-transition/:fromPlanId/:toPlanId/validate', SettingController.validatePlanTransition);
router.get('/users/:userId/upgrade/:newPlanId/validate', SettingController.validateSubscriptionUpgrade);
router.patch('/subscription-plans/:planId/toggle-status', SettingController.togglePlanStatus);

// Rutas de configuraciones de paseador (GPS)
router.get('/walkers/:walkerId', WalkerController.getWalkerSettings);
router.put('/walkers/:walkerId/gps', SettingController.updateGpsSettings);
router.patch('/walkers/:walkerId/gps/toggle', SettingController.toggleGpsTracking);

module.exports = router;