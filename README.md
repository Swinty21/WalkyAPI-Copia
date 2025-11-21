# Walky API

## Descripción

API REST para la aplicación Walky. Implementada en Node.js usando Express; proporciona endpoints para usuarios, paseadores, paseos, notificaciones, chat y más. Incluye manejo de base de datos MySQL, envío de correos y tareas programadas para procesar la cola de notificaciones.

## Tecnologías y lenguajes

- Lenguaje: JavaScript (Node.js)
- Runtime: Node.js (entrypoint `server.js`, configuración en `src/app.js`)

## Librerías principales

- Framework HTTP: `express`
- Base de datos: `mysql2` (con pool y consultas directas)
- Variables de entorno: `dotenv`
- Seguridad / headers: `helmet`
- CORS: `cors`
- Autenticación / tokens: `jsonwebtoken`
- Hash de contraseñas: `bcryptjs`
- HTTP cliente: `axios`
- Emails: `nodemailer`
- Tareas programadas: `node-cron`
- Desarrollo: `nodemon` (devDependency)

## Arquitectura del proyecto

- `src/controllers`: Controladores que exponen la lógica por endpoint.
- `src/models`: Modelos y `BaseModel` que usan la capa de base de datos.
- `src/routes`: Definición de rutas y agrupación de endpoints bajo `/api`.
- `src/middleware`: Middlewares (autenticación, manejo de errores, etc.).
- `src/services`: Servicios reutilizables (por ejemplo `emailService`, `notificationScheduler`).
- `src/config`: Configuración de la base de datos (`database.js`).
- `src/utils`: Utilidades para hashing y tokens.
- `public`: Archivos estáticos; la ruta `/docs` sirve la documentación HTML.

## Comandos útiles

Instalar dependencias:

```powershell
npm install
```

Ejecutar en desarrollo (recarga automática):

```powershell
npm run dev
```

Iniciar en producción:

```powershell
npm start
```

## Endpoints y comprobaciones rápidas

- Health check: `GET /health` — devuelve estado básico del servicio.
- Documentación estática: `GET /docs` (sirve `src/public/docs.html`).
- API base: todos los endpoints de la API están bajo `/api` (rutas en `src/routes`).

## Configuración / Variables de entorno

Coloca un archivo `.env` en la raíz con las variables necesarias. El proyecto usa las siguientes variables (según el código):

- `PORT`: Puerto donde corre el servidor (por defecto 3000).
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`: Conexión a MySQL (usadas en `src/config/database.js`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Configuración SMTP para `nodemailer` (usada por `src/services/emailService.js`).
- `FRONTEND_URL`: URL del frontend (opcional, usada en plantillas de email).
- `NODE_ENV`: Entorno de ejecución (desarrollo/producción).

Ejemplo mínimo de `.env` (rellena con tus valores):

```text
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=walkydb
DB_PORT=3306
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

## Notas operativas (basadas en el repositorio)

- La conexión a MySQL se maneja con `mysql2/promise`; el proyecto configura un pool y también soporta una conexión simple.
-- Existe un `notificationScheduler` (implementado con `node-cron`) que ejecuta:
	- procesamiento de la cola de correos cada 2 minutos,
	- chequeos diarios de suscripciones,
	- limpieza periódica de notificaciones antiguas.
- El patrón de acceso a la base de datos usa un `BaseModel` con métodos comunes (`findAll`, `findById`, `create`, `update`, `delete`, `count`) y consultas SQL parametrizadas.
- El manejo centralizado de errores está en `src/middleware/errorHandler.js`.

## Siguientes pasos sugeridos

- Completar el `.env` con credenciales reales y crear las tablas en MySQL según los scripts/migraciones que tengas fuera del repositorio.
- Opciones que puedo hacer a continuación:
	- Añadir un `README` con ejemplos de peticiones (requests) para endpoints clave.
	- Crear un archivo `.env.example` con las variables listadas.
	- Añadir scripts o documentación para inicializar la base de datos, si proporcionas los SQL/migraciones.

---
