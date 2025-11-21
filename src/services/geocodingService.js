const axios = require('axios');

// temporal
class GeocodingService {
    async getAddressFromCoordinates(lat, lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        // finalmente se implemento en los front mediante otras APIs
        return `Lat: ${latNum.toFixed(6)}, Lng: ${lngNum.toFixed(6)}`;
    }
}

// class GeocodingService {
//     constructor() {
//         this.cache = new Map();
//     }

//     getCacheKey(lat, lng) {
//         const latNum = parseFloat(lat);
//         const lngNum = parseFloat(lng);
//         return `${latNum.toFixed(4)}_${lngNum.toFixed(4)}`;
//     }

//     async getAddressFromCoordinates(lat, lng) {
//         try {
//             const latNum = parseFloat(lat);
//             const lngNum = parseFloat(lng);

//             if (isNaN(latNum) || isNaN(lngNum)) {
//                 return `Lat: ${lat}, Lng: ${lng}`;
//             }

//             const cacheKey = this.getCacheKey(latNum, lngNum);
//             if (this.cache.has(cacheKey)) {
//                 return this.cache.get(cacheKey);
//             }

//             const apiKey = process.env.GOOGLE_MAPS_API_KEY;
            
//             if (!apiKey) {
//                 return `Lat: ${latNum.toFixed(6)}, Lng: ${lngNum.toFixed(6)}`;
//             }

//             const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
//                 params: {
//                     latlng: `${latNum},${lngNum}`,
//                     key: apiKey,
//                     language: 'es'
//                 },
//                 timeout: 5000
//             });

//             if (response.data.results && response.data.results.length > 0) {
//                 const address = response.data.results[0].formatted_address;
//                 this.cache.set(cacheKey, address);
//                 return address;
//             }

//             return `Lat: ${latNum.toFixed(6)}, Lng: ${lngNum.toFixed(6)}`;
//         } catch (error) {
//             console.error('Error en geocodificación:', error.message);
//             return `Lat: ${lat}, Lng: ${lng}`;
//         }
//     }
// }

module.exports = new GeocodingService();