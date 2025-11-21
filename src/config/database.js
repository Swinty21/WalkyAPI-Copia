const mysql = require('mysql2/promise');
const { ApiError } = require('../middleware/errorHandler');

class Database {
    constructor() {
        this.connection = null;
        this.pool = null;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'walkydb',
                port: process.env.DB_PORT || 3306,
                charset: 'utf8mb4',
                timezone: 'Z',
                connectTimeout: 60000,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            });
            console.log('✅ Conectado a MySQL');
            return this.connection;
        } catch (error) {
            console.error('❌ Error conectando a MySQL:', error.message);
            throw error;
        }
    }

    init() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'walkydb',
                port: process.env.DB_PORT || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                maxIdle: 10,
                idleTimeout: 60000,
                queueLimit: 0,
                acquireTimeout: 60000,
                timeout: 60000,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000,
                charset: 'utf8mb4',
                timezone: 'Z',
                dateStrings: false,
                supportBigNumbers: true,
                bigNumberStrings: false,
                multipleStatements: false
            });

            console.log('📊 Pool de conexiones MySQL configurado');
            
            this.pool.on('connection', (connection) => {
                console.log('🔗 Nueva conexión establecida');
            });

            this.pool.on('error', (err) => {
                console.error('❌ Error del pool:', err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.log('🔄 Reconectando...');
                }
            });
            
            this.testConnection();
            
        } catch (error) {
            console.error('❌ Error configurando pool de conexiones:', error);
            throw new ApiError('Error de configuración de base de datos', 500);
        }
    }

    async testConnection() {
        try {
            if (this.pool) {
                const connection = await this.pool.getConnection();
                await connection.ping();
                connection.release();
                console.log('✅ Conexión a MySQL establecida correctamente');
                console.log(`📍 Conectado a: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
            } else if (this.connection) {
                await this.connection.ping();
                console.log('✅ Conexión a MySQL establecida correctamente');
            }
        } catch (error) {
            console.error('❌ Error conectando a MySQL:', error);
            throw new ApiError('No se pudo conectar a la base de datos', 500);
        }
    }

    async query(sql, params = []) {
        try {
            
            if (this.pool) {
                const connection = await this.pool.getConnection();
                try {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('🔍 SQL:', sql);
                        if (params.length > 0) {
                            console.log('📝 Params:', params);
                        }
                    }
                    
                    const [results] = await connection.execute(sql, params);
                    return results;
                } finally {
                    connection.release();
                }
            } else {
                
                if (!this.connection) {
                    await this.connect();
                }
                const [results] = await this.connection.execute(sql, params);
                return results;
            }
        } catch (error) {
            console.error('❌ Error en consulta SQL:', error);
            
            if (error.code === 'ER_NO_SUCH_TABLE') {
                throw new ApiError('Tabla no encontrada', 500);
            }
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError('Registro duplicado', 400);
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError('Referencia inválida', 400);
            }
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                throw new ApiError('Acceso denegado a la base de datos', 500);
            }
            if (error.code === 'ER_BAD_DB_ERROR') {
                throw new ApiError('Base de datos no encontrada', 500);
            }
            if (error.code === 'ECONNREFUSED') {
                throw new ApiError('No se pudo conectar al servidor de base de datos', 500);
            }
            if (error.code === 'ETIMEDOUT') {
                throw new ApiError('Timeout de conexión a la base de datos', 500);
            }
            if (error.code === 'PROTOCOL_CONNECTION_LOST') {
                throw new ApiError('Conexión perdida con la base de datos', 500);
            }
            
            throw new ApiError('Error en base de datos: ' + error.message, 500);
        }
    }

    async transaction(callback) {
        let connection;
        try {
            if (this.pool) {
                connection = await this.pool.getConnection();
            } else {
                if (!this.connection) {
                    await this.connect();
                }
                connection = this.connection;
            }
            
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            throw error;
        } finally {
            if (this.pool && connection) {
                connection.release();
            }
        }
    }

    async close() {
        try {
            if (this.pool) {
                await this.pool.end();
                console.log('✅ Pool de conexiones cerrado');
            }
            if (this.connection) {
                await this.connection.end();
                console.log('🔌 Conexión a MySQL cerrada');
            }
        } catch (error) {
            console.error('❌ Error cerrando conexión:', error);
        }
    }

    async healthCheck() {
        try {
            if (this.pool) {
                const connection = await this.pool.getConnection();
                const [results] = await connection.execute('SELECT 1 as status');
                connection.release();
                return results[0].status === 1;
            } else if (this.connection) {
                const [results] = await this.connection.execute('SELECT 1 as status');
                return results[0].status === 1;
            }
            return false;
        } catch (error) {
            console.error('❌ Health check falló:', error);
            return false;
        }
    }
}

const database = new Database();

process.on('SIGINT', async () => {
    await database.close();
});

process.on('SIGTERM', async () => {
    await database.close();
});

module.exports = database;