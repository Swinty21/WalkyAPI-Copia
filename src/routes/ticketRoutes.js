const express = require('express');
const TicketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de tickets requieren autenticación
router.use(authenticateToken);

// Rutas públicas
router.get('/faqs', TicketController.getFAQs);
router.get('/categories', TicketController.getTicketCategories);
router.get('/my-tickets', TicketController.getTicketsByUser);
router.get('/:id', TicketController.getTicketById);
router.post('/', TicketController.createTicket);

// Rutas administrativas
router.get('/', TicketController.getAllTickets);
router.post('/:id/respond', TicketController.respondToTicket);
router.patch('/:id/status', TicketController.updateTicketStatus);
router.get('/admin/statistics', TicketController.getTicketStatistics);

module.exports = router;