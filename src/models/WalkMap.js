const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const GeocodingService = require('../services/geocodingService');

class WalkMap extends BaseModel {
    constructor() {
        super('walk_maps');
    }

    // Obtener ruta completa del paseo
    async getWalkRoute(walkId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const results = await db.query('CALL sp_walk_map_get_route(?)', [walkId]);
            
            if (results && results[0]) {
                const locations = results[0];
                
                if (locations.length === 0 || !locations[0].hasMap) {
                    return {
                        hasMap: false,
                        mapId: null,
                        walkId: walkId,
                        locations: []
                    };
                }
                
                const hasMap = locations[0].hasMap;
                const mapId = locations[0].mapId;
                const walkIdFromDb = locations[0].walkId;
                
                const formattedLocations = await Promise.all(
                    locations.map(loc => this.formatLocationData(loc))
                );
                
                return {
                    hasMap: hasMap,
                    mapId: mapId,
                    walkId: walkIdFromDb,
                    locations: formattedLocations
                };
            }
            
            return {
                hasMap: false,
                mapId: null,
                walkId: walkId,
                locations: []
            };
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener ruta del paseo', 500);
        }
    }

    // Guardar nueva ubicación GPS
    async saveLocation(walkId, lat, lng, altitude) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            if (lat === undefined || lat === null || isNaN(lat)) {
                throw new ApiError('Latitud requerida', 400);
            }

            if (lng === undefined || lng === null || isNaN(lng)) {
                throw new ApiError('Longitud requerida', 400);
            }

            const results = await db.query(
                'CALL sp_walk_map_save_location(?, ?, ?, ?)',
                [walkId, lat, lng, altitude || 0]
            );

            if (results && results[0] && results[0].length > 0) {
                return await this.formatLocationData(results[0][0]);
            }

            throw new ApiError('Error al guardar ubicación', 500);
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 400);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al guardar ubicación', 500);
        }
    }

    async getActiveWalksWithGPS(walkerId) {
        try {
            if (!walkerId || isNaN(walkerId)) {
                throw new ApiError('ID de paseador inválido', 400);
            }

            const query = `
                SELECT w.id as walk_id, wm.id as map_id, ws.has_gps_tracker
                FROM walks w
                INNER JOIN walk_statuses wst ON w.status_id = wst.id
                LEFT JOIN walk_maps wm ON w.id = wm.walk_id
                LEFT JOIN walker_settings ws ON w.walker_id = ws.walker_id
                WHERE w.walker_id = ? AND wst.name = 'activo'
            `;

            const results = await db.query(query, [walkerId]);

            if (!results || results.length === 0) {
                return [];
            }

            return results.filter(walk => 
                walk.map_id !== null && walk.has_gps_tracker === 1
            );
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al obtener paseos activos con GPS', 500);
        }
    }

    // Verificar disponibilidad del mapa
    async checkMapAvailability(walkId) {
        try {
            if (!walkId || isNaN(walkId)) {
                throw new ApiError('ID de paseo inválido', 400);
            }

            const results = await db.query('CALL sp_walk_map_check_availability(?)', [walkId]);

            if (results && results[0] && results[0].length > 0) {
                const availability = results[0][0];
                return {
                    hasMap: availability.hasMap,
                    mapId: availability.mapId,
                    locationCount: availability.locationCount
                };
            }

            return {
                hasMap: false,
                mapId: null,
                locationCount: 0
            };
        } catch (error) {
            if (error.sqlState === '45000') {
                throw new ApiError(error.message, 404);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error al verificar disponibilidad del mapa', 500);
        }
    }

    // Formatear datos de ubicación para respuesta
    async formatLocationData(location) {
        let address = location.address;
        
        if (!address || address === 'Dirección calculada por el backend') {
            address = await GeocodingService.getAddressFromCoordinates(
                location.lat,
                location.lng
            );
        }
        
        return {
            id: location.id,
            lat: location.lat,
            lng: location.lng,
            elevation: location.elevation,
            address: address,
            recordedAt: location.recordedAt
        };
    }
}

module.exports = new WalkMap();