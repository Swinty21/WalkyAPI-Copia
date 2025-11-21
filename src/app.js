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
            // origin: process.env.FRONTEND_URL || '*',
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
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'success',
                message: 'WalkyAPI está funcionando correctamente',
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
        } catch (error) {
            console.error('❌ Error conectando a la base de datos:', error.message);
            process.exit(1);
        }
    }

    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    getApp() {
        return this.app;
    }
}

module.exports = new App().getApp();