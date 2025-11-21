const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class Pet extends BaseModel {
    constructor() {
        super('pets');
    }

    // Obtener todas las mascotas
    async getAllPets() {
        try {
            const results = await db.query('CALL sp_pet_get_all()');
            
            if (results && results[0]) {
                return results[0].map(pet => ({
                    id: pet.id,
                    name: pet.name,
                    ownerId: pet.ownerId,
                    image: pet.image,
                    weight: pet.weight,
                    age: pet.age,
                    description: pet.description,
                    createdAt: pet.createdAt,
                    updatedAt: pet.updatedAt
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener mascotas', 500);
        }
    }

    // Obtener mascota por ID
    async getPetById(petId) {
        try {
            if (!petId) {
                throw new ApiError('ID de mascota requerido', 400);
            }

            const results = await db.query('CALL sp_pet_get_by_id(?)', [petId]);
            
            if (results && results[0] && results[0].length > 0) {
                const pet = results[0][0];
                return {
                    id: pet.id,
                    name: pet.name,
                    ownerId: pet.ownerId,
                    image: pet.image,
                    weight: pet.weight,
                    age: pet.age,
                    description: pet.description,
                    createdAt: pet.createdAt,
                    updatedAt: pet.updatedAt
                };
            }
            return null;
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener mascota', 500);
        }
    }

    // Obtener mascotas por propietario
    async getPetsByOwner(ownerId) {
        try {
            if (!ownerId) {
                throw new ApiError('ID de propietario requerido', 400);
            }

            const results = await db.query('CALL sp_pet_get_by_owner(?)', [ownerId]);
            
            if (results && results[0]) {
                return results[0].map(pet => ({
                    id: pet.id,
                    name: pet.name,
                    ownerId: pet.ownerId,
                    image: pet.image,
                    weight: pet.weight,
                    age: pet.age,
                    description: pet.description,
                    createdAt: pet.createdAt,
                    updatedAt: pet.updatedAt
                }));
            }
            return [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener mascotas del propietario', 500);
        }
    }

    // Crear nueva mascota
    async createPet(petData) {
        try {
            if (!petData) {
                throw new ApiError('Datos de mascota requeridos', 400);
            }

            const { ownerId, name, image, weight, age, description } = petData;

            if (!ownerId || !name || !image) {
                throw new ApiError('ID de propietario, nombre e imagen son requeridos', 400);
            }

            if (typeof ownerId !== 'number' || ownerId <= 0) {
                throw new ApiError('ID de propietario debe ser un número válido', 400);
            }

            if (typeof name !== 'string' || name.trim() === '') {
                throw new ApiError('Nombre es requerido', 400);
            }

            if (typeof image !== 'string' || image.trim() === '') {
                throw new ApiError('Imagen es requerida', 400);
            }

            if (name.length > 255) {
                throw new ApiError('El nombre no puede tener más de 255 caracteres', 400);
            }

            if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
                throw new ApiError('El peso debe ser un número positivo', 400);
            }

            if (age !== undefined && (typeof age !== 'number' || age < 0)) {
                throw new ApiError('La edad debe ser un número positivo', 400);
            }

            if (!this.isValidUrl(image)) {
                throw new ApiError('La URL de la imagen no es válida', 400);
            }

            const results = await db.query(
                'CALL sp_pet_create(?, ?, ?, ?, ?, ?)',
                [
                    ownerId,
                    name.trim(),
                    image.trim(),
                    weight || null,
                    age || null,
                    description ? description.trim() : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const createdPet = results[0][0];
                return {
                    id: createdPet.id,
                    name: createdPet.name,
                    ownerId: createdPet.ownerId,
                    image: createdPet.image,
                    weight: createdPet.weight,
                    age: createdPet.age,
                    description: createdPet.description,
                    createdAt: createdPet.createdAt,
                    updatedAt: createdPet.updatedAt
                };
            }

            throw new ApiError('Error al crear mascota', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al crear mascota', 500);
        }
    }

    // Actualizar mascota existente
    async updatePet(petId, petData) {
        try {
            if (!petId) {
                throw new ApiError('ID de mascota requerido', 400);
            }

            if (!petData || Object.keys(petData).length === 0) {
                throw new ApiError('Datos de mascota requeridos', 400);
            }

            const { name, image, weight, age, description } = petData;

            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim() === '') {
                    throw new ApiError('El nombre debe ser un texto válido', 400);
                }
                if (name.length > 255) {
                    throw new ApiError('El nombre no puede tener más de 255 caracteres', 400);
                }
            }

            if (image !== undefined) {
                if (typeof image !== 'string' || image.trim() === '') {
                    throw new ApiError('La imagen debe ser una URL válida', 400);
                }
                if (!this.isValidUrl(image)) {
                    throw new ApiError('La URL de la imagen no es válida', 400);
                }
            }

            if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
                throw new ApiError('El peso debe ser un número positivo', 400);
            }

            if (age !== undefined && (typeof age !== 'number' || age < 0)) {
                throw new ApiError('La edad debe ser un número positivo', 400);
            }

            const results = await db.query(
                'CALL sp_pet_update(?, ?, ?, ?, ?, ?)',
                [
                    petId,
                    name !== undefined ? name.trim() : null,
                    image !== undefined ? image.trim() : null,
                    weight !== undefined ? weight : null,
                    age !== undefined ? age : null,
                    description !== undefined ? (description ? description.trim() : null) : null
                ]
            );

            if (results && results[0] && results[0].length > 0) {
                const updatedPet = results[0][0];
                return {
                    id: updatedPet.id,
                    name: updatedPet.name,
                    ownerId: updatedPet.ownerId,
                    image: updatedPet.image,
                    weight: updatedPet.weight,
                    age: updatedPet.age,
                    description: updatedPet.description,
                    createdAt: updatedPet.createdAt,
                    updatedAt: updatedPet.updatedAt
                };
            }

            throw new ApiError('Error al actualizar mascota', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al actualizar mascota', 500);
        }
    }

    // Eliminar mascota
    async deletePet(petId) {
        try {
            if (!petId) {
                throw new ApiError('ID de mascota requerido', 400);
            }

            const results = await db.query('CALL sp_pet_delete(?)', [petId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                if (result.affected_rows > 0) {
                    return { message: 'Mascota eliminada exitosamente' };
                }
            }

            throw new ApiError('Error al eliminar mascota', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al eliminar mascota', 500);
        }
    }

    // Validar URL
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Validar que el propietario existe y puede tener mascotas
    async validateOwner(ownerId) {
        try {
            const results = await db.query('CALL sp_pet_validate_owner(?)', [ownerId]);
            
            if (results && results[0] && results[0].length > 0) {
                const result = results[0][0];
                return result.is_valid === 1;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new Pet();