const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }
        
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. Invalid token format.',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Access denied. Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({ 
            message: 'Access denied. Invalid token.',
            code: 'INVALID_TOKEN'
        });
    }
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Access denied. User not authenticated.',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`,
                code: 'INSUFFICIENT_PERMISSIONS',
                userRole: req.user.role,
                requiredRoles: allowedRoles
            });
        }
        
        next();
    };
};

module.exports = { authenticateToken, checkRole };