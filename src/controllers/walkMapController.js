const WalkMap = require('../models/WalkMap');
const { ApiError } = require('../middleware/errorHandler');

class WalkMapController {
    
    static async getWalkRoute(req, res, next) {
        try {
            const { walkId } = req.params;

            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const mapData = await WalkMap.getWalkRoute(parseInt(walkId));

            res.status(200).json({
                status: 'success',
                data: mapData
            });
        } catch (error) {
            next(error);
        }
    }

    static async saveLocation(req, res, next) {
        try {
            const { latitude, longitude, altitude } = req.body;
            const walkerId = req.tokenData.id;

            // Validaciones
            if (latitude === undefined || longitude === undefined) {
                throw new ApiError('Latitud y longitud son requeridas', 400);
            }

            if (latitude < -90 || latitude > 90) {
                throw new ApiError('Latitud inválida (debe estar entre -90 y 90)', 400);
            }

            if (longitude < -180 || longitude > 180) {
                throw new ApiError('Longitud inválida (debe estar entre -180 y 180)', 400);
            }

            // Obtener paseos activos con GPS habilitado
            const validWalks = await WalkMap.getActiveWalksWithGPS(walkerId);

            if (validWalks.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    message: 'No hay mapas de ese paseador para guardar su ubicación',
                    data: {
                        savedCount: 0
                    }
                });
            }

            // Guardar ubicación en cada paseo válido
            let savedCount = 0;
            const savedLocations = [];

            for (const walk of validWalks) {
                try {
                    const location = await WalkMap.saveLocation(
                        walk.walk_id,
                        latitude,
                        longitude,
                        altitude
                    );

                    savedCount++;
                    savedLocations.push({
                        walkId: walk.walk_id,
                        location: location
                    });
                } catch (error) {
                    // Continuar con los demás paseos aunque uno falle
                    console.error(`Error saving location for walk ${walk.walk_id}:`, error);
                }
            }

            res.status(200).json({
                status: 'success',
                message: `Ubicación guardada exitosamente en ${savedCount} paseo(s)`,
                data: {
                    savedCount,
                    locations: savedLocations
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async checkMapAvailability(req, res, next) {
        try {
            const { walkId } = req.params;

            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const availability = await WalkMap.checkMapAvailability(parseInt(walkId));

            res.status(200).json({
                status: 'success',
                data: availability
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = WalkMapController;