const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, ApiError } = require('./middleware/errorHandler');
const db = require('./config/database');

class App {
    constructor() {
        this.app = express();
        this.dbConnected = false;
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeDatabase();
        this.initializeErrorHandling();
    }

    initializeMiddlewares() {
        this.app.use(helmet({
            contentSecurityPolicy: false,
        }));
        
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        this.app.use('/docs', express.static(path.join(__dirname, 'public')));

        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
            next();
        });
    }

    initializeRoutes() {
        this.app.get('/health', async (req, res) => {
            const dbStatus = await db.healthCheck();
            res.status(dbStatus ? 200 : 503).json({
                status: dbStatus ? 'success' : 'warning',
                message: dbStatus 
                    ? 'WalkyAPI está funcionando correctamente' 
                    : 'API funcionando pero base de datos no disponible',
                database: dbStatus ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        this.app.get('/docs', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'docs.html'));
        });

        this.app.use('/api', routes);

        this.app.use((req, res, next) => {
            next(new ApiError(`No se encontró la ruta ${req.originalUrl}`, 404));
        });
    }

    async initializeDatabase() {
        try {
            await db.connect();
            this.dbConnected = true;
            console.log('✅ Base de datos inicializada correctamente');
        } catch (error) {
            console.error('⚠️  No se pudo conectar a la base de datos después de múltiples intentos');
            console.error('⚠️  La API continuará ejecutándose pero las operaciones de BD fallarán');
            console.error('⚠️  Error:', error.message);
            this.dbConnected = false;
        }
    }

    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    getApp() {
        return this.app;
    }

    isDatabaseConnected() {
        return this.dbConnected;
    }
}

module.exports = new App().getApp();