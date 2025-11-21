const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class User extends BaseModel {
    constructor() {
        super('users');
    }

    // Buscar usuario por email (sin password, para operaciones generales)
    async findByEmail(email) {
        try {
            const results = await db.query('CALL sp_user_get_by_email_for_auth(?)', [email]);
            
            if (results && results[0] && results[0].length > 0) {
                const user = results[0][0];
                
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            return null;
        } catch (error) {
            throw new ApiError('Error al buscar usuario por email', 500);
        }
    }

    // Buscar usuario por email con password (solo para autenticación)
    async findByEmailForAuth(email) {
        try {
            const results = await db.query('CALL sp_user_get_by_email_for_auth(?)', [email]);
            
            if (results && results[0] && results[0].length > 0) {
                return results[0][0];
            }
            return null;
        } catch (error) {
            throw new ApiError('Error al buscar usuario para autenticación', 500);
        }
    }

    // Verificar si el email ya existe
    async emailExists(email) {
        try {
            const results = await db.query('CALL sp_user_check_email_exists(?)', [email]);
            
            if (results && results[0] && results[0].length > 0) {
                return results[0][0].email_exists === 1;
            }
            return false;
        } catch (error) {
            throw new ApiError('Error al verificar email', 500);
        }
    }

    // Crear un nuevo usuario
    async createUser(userData) {
        try {
            const {
                name,
                email,
                password,
                role = 'client',
                phone = null,
                location = null
            } = userData;

            const results = await db.query(
                'CALL sp_user_register(?, ?, ?, ?, ?, ?)',
                [name, email, password, role, phone, location]
            );

            if (results && results[0] && results[0].length > 0) {
                const newUser = results[0][0];
                
                return {
                    ...newUser,
                    suscription: newUser.subscription || 'Basic'
                };
            }
            
            throw new ApiError('Error al crear usuario', 500);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError('El email ya está registrado', 400);
            }
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            throw error;
        }
    }

    // Buscar usuario por ID (sin password)
    async findByIdSafe(id) {
        try {
            const results = await db.query('CALL sp_user_get_by_id(?)', [id]);
            
            if (results && results[0] && results[0].length > 0) {
                const user = results[0][0];
                return {
                    ...user,
                    suscription: user.subscription || 'Basic'
                };
            }
            return null;
        } catch (error) {
            throw new ApiError('Error al buscar usuario', 500);
        }
    }

    // Obtener todos los usuarios (sin passwords)
    async findAllSafe() {
        try {
            const results = await db.query('CALL sp_user_get_all()');
            
            if (results && results[0]) {
                return results[0].map(user => ({
                    ...user,
                    suscription: user.subscription || 'Basic'
                }));
            }
            return [];
        } catch (error) {
            throw new ApiError('Error al obtener usuarios', 500);
        }
    }

    // Actualizar usuario
    async updateUser(id, userData) {
        
        try {
            const {
                name = null,
                email = null,
                password = null,
                profileImage = null,
                phone = null,
                location = null
            } = userData;

            const results = await db.query(
                'CALL sp_user_update(?, ?, ?, ?, ?, ?, ?)',
                [id, name, email, password, profileImage, phone, location]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedUser = results[0][0];
                return {
                    ...updatedUser,
                    suscription: updatedUser.subscription || 'Basic'
                };
            }
            
            throw new ApiError('Usuario no encontrado', 404);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            throw error;
        }
    }

    // Actualizar usuario por admin (solo campos específicos)
    async updateUserByAdmin(id, userData) {
        try {
            const {
                name = null,
                role = null,
                status = null,
                profileImage = null,
                phone = null,
                location = null
            } = userData;

            const results = await db.query(
                'CALL sp_user_update_by_admin(?, ?, ?, ?, ?, ?, ?)',
                [id, name, role, status, profileImage, phone, location]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedUser = results[0][0];
                return {
                    ...updatedUser,
                    suscription: updatedUser.subscription || 'Basic'
                };
            }
            
            throw new ApiError('Usuario no encontrado', 404);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            throw error;
        }
    }

    // Eliminar usuario
    async delete(id) {
        try {
            const results = await db.query('CALL sp_user_delete(?)', [id]);
            
            if (results && results[0] && results[0].length > 0) {
                return results[0][0].success === 1;
            }
            return false;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            throw new ApiError('Error al eliminar usuario', 500);
        }
    }

    // Obtener estadísticas de usuarios
    async getUserStats() {
        try {
            const results = await db.query('CALL sp_user_get_stats()');
            
            if (results && results[0] && results[0].length > 0) {
                const stats = results[0][0];
                
                return {
                    total: parseInt(stats.total),
                    active: parseInt(stats.active),
                    inactive: parseInt(stats.inactive),
                    byRole: {
                        admin: parseInt(stats.admin),
                        client: parseInt(stats.client),
                        walker: parseInt(stats.walker),
                        support: parseInt(stats.support)
                    },
                    recentJoins: parseInt(stats.recent_joins)
                };
            }
            
            return {
                total: 0,
                active: 0,
                inactive: 0,
                byRole: {
                    admin: 0,
                    client: 0,
                    walker: 0,
                    support: 0
                },
                recentJoins: 0
            };
        } catch (error) {
            throw new ApiError('Error al obtener estadísticas de usuarios', 500);
        }
    }

    // Actualizar último login
    async updateLastLogin(id) {
        try {
            await db.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [id]
            );
        } catch (error) {
            
            console.error('Error al actualizar último login:', error);
        }
    }

    // Buscar usuario por ID (con password, solo para operaciones internas)
    async findById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const results = await db.query(sql, [id]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            throw new ApiError(`Error al buscar registro en ${this.tableName}`, 500);
        }
    }

    async mobileUpdateUser(id, userData) {
    try {
        const {
            name = null,
            profileImage = null,
            phone = null,
            location = null
        } = userData;

        const results = await db.query(
            'CALL sp_mobile_user_edit(?, ?, ?, ?, ?)',
            [id, name, profileImage, phone, location]
        );

        if (results && results[0] && results[0].length > 0) {
            const updatedUser = results[0][0];
            return {
                ...updatedUser,
                suscription: updatedUser.subscription || 'Basic'
            };
        }
        
        throw new ApiError('Usuario no encontrado', 404);
    } catch (error) {
        if (error.sqlState === '45000') {
            throw new ApiError(error.message, 400);
        }
        throw error;
    }
}
}

module.exports = new User();