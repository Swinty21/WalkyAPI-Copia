const Pet = require('../models/Pet');
const { ApiError } = require('../middleware/errorHandler');

class PetsController {
    static async getAllPets(req, res, next) {
        try {
            const pets = await Pet.getAllPets();

            res.status(200).json({
                status: 'success',
                data: {
                    pets
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPetById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de mascota inválido', 400);
            }

            const pet = await Pet.getPetById(parseInt(id));

            if (!pet) {
                throw new ApiError('Mascota no encontrada', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    pet
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPetsByOwner(req, res, next) {
        try {
            const { ownerId } = req.params;

            if (!ownerId || isNaN(ownerId)) {
                throw new ApiError('ID de propietario inválido', 400);
            }

            const pets = await Pet.getPetsByOwner(parseInt(ownerId));

            res.status(200).json({
                status: 'success',
                data: {
                    pets
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async createPet(req, res, next) {
        try {
            const petData = req.body;

            if (!petData || Object.keys(petData).length === 0) {
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
                throw new ApiError('El nombre debe ser un texto válido', 400);
            }

            if (typeof image !== 'string' || image.trim() === '') {
                throw new ApiError('La imagen debe ser una URL válida', 400);
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

            if (description !== undefined && typeof description !== 'string') {
                throw new ApiError('La descripción debe ser un texto', 400);
            }

            const newPet = await Pet.createPet(petData);

            res.status(201).json({
                status: 'success',
                message: 'Mascota creada exitosamente',
                data: {
                    pet: newPet
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePet(req, res, next) {
        try {
            const { id } = req.params;
            const petData = req.body;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de mascota inválido', 400);
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
            }

            if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
                throw new ApiError('El peso debe ser un número positivo', 400);
            }

            if (age !== undefined && (typeof age !== 'number' || age < 0)) {
                throw new ApiError('La edad debe ser un número positivo', 400);
            }

            if (description !== undefined && typeof description !== 'string') {
                throw new ApiError('La descripción debe ser un texto', 400);
            }

            const updatedPet = await Pet.updatePet(parseInt(id), petData);

            res.status(200).json({
                status: 'success',
                message: 'Mascota actualizada exitosamente',
                data: {
                    pet: updatedPet
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deletePet(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de mascota inválido', 400);
            }

            const result = await Pet.deletePet(parseInt(id));

            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    petId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para validar que una mascota existe
    static async validatePet(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                throw new ApiError('ID de mascota inválido', 400);
            }

            const pet = await Pet.getPetById(parseInt(id));
            const isValid = pet !== null;

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    petId: parseInt(id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para validar propietario
    static async validateOwner(req, res, next) {
        try {
            const { ownerId } = req.params;

            if (!ownerId || isNaN(ownerId)) {
                throw new ApiError('ID de propietario inválido', 400);
            }

            const isValid = await Pet.validateOwner(parseInt(ownerId));

            res.status(200).json({
                status: 'success',
                data: {
                    isValid,
                    ownerId: parseInt(ownerId)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PetsController;