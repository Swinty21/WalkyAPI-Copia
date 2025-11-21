const User = require('../models/User');
const HashUtils = require('../utils/hashUtils');
const { ApiError } = require('../middleware/errorHandler');

class UserController {

    static async getAllUsers(req, res, next) {
        try {
            const users = await User.findAllSafe();
            
            const formattedUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                profileImage: user.profile_image,
                phone: user.phone,
                location: user.location,
                suscription: user.subscription || 'Sin Suscripción',
                joinedDate: user.joined_date,
                lastLogin: user.last_login,
                created_at: user.created_at,
                updated_at: user.updated_at
            }));

            res.status(200).json({
                status: 'success',
                results: formattedUsers.length,
                data: {
                    users: formattedUsers
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const user = await User.findByIdSafe(parseInt(id));
            
            if (!user) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            const formattedUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                profileImage: user.profile_image,
                phone: user.phone,
                location: user.location,
                suscription: user.subscription || 'Sin Suscripción',
                joinedDate: user.joined_date,
                lastLogin: user.last_login,
                created_at: user.created_at,
                updated_at: user.updated_at
            };

            res.status(200).json({
                status: 'success',
                data: {
                    user: formattedUser
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const { email, name, password, phone, location, role, profileImage } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const userId = parseInt(id);

            const existingUser = await User.findByIdSafe(userId);
            if (!existingUser) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            const updateData = {};
            
            if (email && email !== existingUser.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    throw new ApiError('Formato de email inválido', 400);
                }
                updateData.email = email.toLowerCase();
            }

            if (name && name.trim() !== existingUser.name) {
                if (name.trim().length < 6) {
                    throw new ApiError('El nombre debe tener al menos 6 caracteres', 400);
                }
                updateData.name = name.trim();
            }

            if (password) {
                if (password.length < 8) {
                    throw new ApiError('La contraseña debe tener al menos 8 caracteres', 400);
                }
                updateData.password = await HashUtils.hashPassword(password);
            }

            if (phone !== undefined) {
                updateData.phone = phone;
            }

            if (location !== undefined) {
                updateData.location = location;
            }

            if(profileImage !== undefined && profileImage != existingUser.profile_image){
                updateData.profileImage = profileImage;
            }

            if (Object.keys(updateData).length === 0) {
                const formattedUser = {
                    id: existingUser.id,
                    name: existingUser.name,
                    email: existingUser.email,
                    role: existingUser.role,
                    status: existingUser.status,
                    profileImage: existingUser.profile_image,
                    phone: existingUser.phone,
                    location: existingUser.location,
                    suscription: existingUser.subscription || 'Sin Suscripción',
                    joinedDate: existingUser.joined_date,
                    lastLogin: existingUser.last_login
                };

                return res.status(200).json({
                    status: 'success',
                    message: 'Usuario actualizado exitosamente',
                    data: {
                        user: formattedUser
                    }
                });
            }

            const updatedUser = await User.updateUser(userId, updateData);

            const formattedUser = {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                profileImage: profileImage || updatedUser.profile_image,
                phone: updatedUser.phone,
                location: updatedUser.location,
                suscription: updatedUser.subscription || 'Sin Suscripción',
                joinedDate: updatedUser.joined_date,
                lastLogin: updatedUser.last_login
            };

            res.status(200).json({
                status: 'success',
                message: 'Usuario actualizado exitosamente',
                data: {
                    user: formattedUser
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateUserByAdmin(req, res, next) {
        try {

            if (req.tokenData.role !== 'admin') {
                throw new ApiError('Acceso denegado. Solo administradores pueden eliminar notificaciones antiguas', 403);
            }

            const { id } = req.params;
            const { name, role, status, profileImage, phone, location } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const userId = parseInt(id);

            const existingUser = await User.findByIdSafe(userId);
            if (!existingUser) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            if (name !== undefined && (!name.trim() || name.trim().length < 2)) {
                throw new ApiError('El nombre debe tener al menos 2 caracteres', 400);
            }

            if (role !== undefined && !['admin', 'client', 'walker', 'support'].includes(role)) {
                throw new ApiError('Rol inválido', 400);
            }

            if (status !== undefined && !['active', 'inactive'].includes(status)) {
                throw new ApiError('Estado inválido', 400);
            }

            if (phone !== undefined && phone.trim() !== '' && !/^[\+]?[0-9\-\s\(\)]+$/.test(phone)) {
                throw new ApiError('Formato de teléfono inválido', 400);
            }

            const updatedUser = await User.updateUserByAdmin(userId, {
                name: name !== undefined ? name.trim() : undefined,
                role,
                status,
                profileImage,
                phone: phone !== undefined ? phone.trim() : undefined,
                location: location !== undefined ? location.trim() : undefined
            });

            const formattedUser = {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                profileImage: updatedUser.profile_image,
                phone: updatedUser.phone,
                location: updatedUser.location,
                suscription: updatedUser.subscription || 'Sin Suscripción',
                joinedDate: updatedUser.joined_date,
                lastLogin: updatedUser.last_login
            };

            res.status(200).json({
                status: 'success',
                message: 'Usuario actualizado por admin exitosamente',
                data: {
                    user: formattedUser
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const userId = parseInt(id);

            const existingUser = await User.findByIdSafe(userId);
            if (!existingUser) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            const deleted = await User.delete(userId);
            
            if (!deleted) {
                throw new ApiError('No se pudo eliminar el usuario', 500);
            }

            res.status(200).json({
                status: 'success',
                message: 'Usuario eliminado exitosamente',
                data: {
                    success: true
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getUserStats(req, res, next) {
        try {
            const stats = await User.getUserStats();

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

    static async searchUsers(req, res, next) {
        try {
            const { query, role, status, limit = 50 } = req.query;
            
            let users = await User.findAllSafe();
            
            if (query) {
                const searchQuery = query.toLowerCase();
                users = users.filter(user => 
                    user.name.toLowerCase().includes(searchQuery) ||
                    user.email.toLowerCase().includes(searchQuery)
                );
            }
            
            if (role) {
                users = users.filter(user => user.role === role);
            }
            
            if (status) {
                users = users.filter(user => user.status === status);
            }
            
            users = users.slice(0, parseInt(limit));
            
            const formattedUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                profileImage: user.profile_image,
                phone: user.phone,
                location: user.location,
                suscription: user.subscription || 'Sin Suscripción',
                joinedDate: user.joined_date,
                lastLogin: user.last_login
            }));

            res.status(200).json({
                status: 'success',
                results: formattedUsers.length,
                data: {
                    users: formattedUsers
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async changeUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
                throw new ApiError('Estado inválido. Debe ser: active, inactive, suspended', 400);
            }

            const userId = parseInt(id);

            const existingUser = await User.findByIdSafe(userId);
            if (!existingUser) {
                throw new ApiError('Usuario no encontrado', 404);
            }


            const updatedUser = await User.updateUser(userId, {});

            res.status(200).json({
                status: 'success',
                message: `Estado del usuario cambiado a ${status}`,
                data: {
                    user: {
                        ...updatedUser,
                        suscription: updatedUser.subscription || 'Sin Suscripción',
                        joinedDate: updatedUser.joined_date,
                        lastLogin: updatedUser.last_login
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async changeUserPassword(req, res, next) {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            if (!currentPassword || !newPassword) {
                throw new ApiError('Contraseña actual y nueva contraseña son requeridas', 400);
            }

            if (newPassword.length < 6) {
                throw new ApiError('La nueva contraseña debe tener al menos 6 caracteres', 400);
            }

            if (currentPassword === newPassword) {
                throw new ApiError('La nueva contraseña debe ser diferente a la actual', 400);
            }

            const userId = parseInt(id);

            const existingUser = await User.findById(userId);
            if (!existingUser) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            const isCurrentPasswordValid = await HashUtils.comparePassword(currentPassword, existingUser.password);
            if (!isCurrentPasswordValid) {
                throw new ApiError('La contraseña actual es incorrecta', 400);
            }

            const hashedNewPassword = await HashUtils.hashPassword(newPassword);

            await User.updateUser(userId, { password: hashedNewPassword });

            res.status(200).json({
                status: 'success',
                message: 'Contraseña cambiada exitosamente',
                data: {
                    success: true
                }
            });
        } catch (error) {
            next(error);
        }
    }


    static async mobileUpdateUser(req, res, next) {
        try {
            const { id } = req.params;
            const { name, profileImage, phone, location } = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de usuario inválido', 400);
            }

            const userId = parseInt(id);

            const existingUser = await User.findByIdSafe(userId);
            if (!existingUser) {
                throw new ApiError('Usuario no encontrado', 404);
            }

            if (!name && !profileImage && !phone && !location) {
                throw new ApiError('Debe proporcionar al menos un campo para actualizar', 400);
            }

            if (name && name.trim().length < 3) {
                throw new ApiError('El nombre debe tener al menos 3 caracteres', 400);
            }

            if (phone && phone.trim() !== '' && !/^[\+]?[0-9\-\s\(\)]+$/.test(phone)) {
                throw new ApiError('Formato de teléfono inválido', 400);
            }

            const updatedUser = await User.mobileUpdateUser(userId, {
                name: name || null,
                profileImage: profileImage || null,
                phone: phone || null,
                location: location || null
            });

            const formattedUser = {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                profileImage: updatedUser.profile_image,
                phone: updatedUser.phone,
                location: updatedUser.location,
                suscription: updatedUser.subscription || 'Sin Suscripción',
                joinedDate: updatedUser.joined_date,
                lastLogin: updatedUser.last_login
            };

            res.status(200).json({
                status: 'success',
                message: 'Perfil actualizado exitosamente',
                data: {
                    user: formattedUser
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = UserController;