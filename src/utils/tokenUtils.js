const jwt = require('jsonwebtoken');
const { ApiError } = require('../middleware/errorHandler');

class TokenUtils {
    static generateToken(userData) {
        try {
            const payload = {
                id: userData.id,
                email: userData.email,
                role: userData.role,
                name: userData.name
            };
            
            const options = {
                expiresIn: '7h',
                issuer: 'walkyapi',
                audience: 'walkyapp'
            };
            
            return jwt.sign(payload, process.env.JWT_SECRET, options);
        } catch (error) {
            throw new ApiError('Error al generar token', 500);
        }
    }
    
    static verifyToken(token) {
        try {
            const options = {
                issuer: 'walkyapi',
                audience: 'walkyapp'
            };
            
            return jwt.verify(token, process.env.JWT_SECRET, options);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError('Su token ha expirado. Por favor inicie sesión nuevamente.', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError('Token inválido. Por favor inicie sesión nuevamente.', 401);
            }
            throw new ApiError('Error al verificar token', 401);
        }
    }
    
    static extractToken(authHeader) {
        if (!authHeader) {
            return null;
        }
        
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        
        return parts[1];
    }
    
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }
    
    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    
    static isTokenExpired(token) {
        try {
            const expiration = this.getTokenExpiration(token);
            if (!expiration) return true;
            
            return expiration < new Date();
        } catch (error) {
            return true;
        }
    }
    
    static refreshToken(token) {
        try {
            const decoded = this.verifyToken(token);
            
            const newToken = this.generateToken({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name
            });
            
            return newToken;
        } catch (error) {
            throw new ApiError('No se pudo renovar el token', 401);
        }
    }
}

module.exports = TokenUtils;