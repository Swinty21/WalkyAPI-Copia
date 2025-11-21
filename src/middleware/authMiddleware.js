const TokenUtils = require('../utils/tokenUtils');
const { ApiError } = require('./errorHandler');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = TokenUtils.extractToken(authHeader);

        if (!token) {
            throw new ApiError('Token de acceso requerido', 401);
        }

        const decoded = TokenUtils.verifyToken(token);
        
        req.tokenData = decoded;
        
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else {
            next(new ApiError(error.message, 401));
        }
    }
};

module.exports = {
    authenticateToken
};