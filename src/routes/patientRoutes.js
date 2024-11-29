const router = require('express').Router();
const patientController = require('../controllers/patientController');

// Patient dashboard routes (no token required, using email/password)
router.post('/profile', patientController.getProfile);
router.post('/profile/update', patientController.updateProfile);
router.post('/profile/delete', patientController.deleteAccount);
router.post('/appointments', patientController.getAppointments);

module.exports = router;