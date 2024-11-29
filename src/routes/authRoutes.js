const router = require('express').Router();
const authController = require('../controllers/authController');

// Only login endpoint is exposed
router.post('/login', authController.login);

module.exports = router;