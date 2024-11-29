const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Specific limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 login requests per hour
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// Security middleware configuration
const securityMiddleware = [
    // Basic security headers
    helmet(),
    
    // Prevent XSS attacks
    xss(),
    
    // Prevent HTTP Parameter Pollution
    hpp(),
    
    // Custom security headers
    (req, res, next) => {
        res.setHeader('Permissions-Policy', 'geolocation=()');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    }
];

module.exports = {
    limiter,
    loginLimiter,
    securityMiddleware
};