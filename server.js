const app = require('./src/app');
const notificationScheduler = require('./src/services/notificationScheduler');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log('🚀 ====================================');
    console.log(`🚶‍♂️ WalkyAPI iniciada exitosamente`);
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api`);
    console.log('🚀 ====================================');
    notificationScheduler.start();
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} ya está en uso`);
    } else {
        console.error('❌ Error del servidor:', error.message);
    }
    process.exit(1);
});

process.on('SIGTERM', () => {
    notificationScheduler.stop();
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    notificationScheduler.stop();
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});