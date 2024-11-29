const router = require('express').Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, checkRole } = require('../middleware/auth');

const ROLES = {
    MANAGE_APPOINTMENTS: ['admin', 'caregiver']
};

router.post('/', 
    authenticateToken, 
    checkRole(ROLES.MANAGE_APPOINTMENTS), 
    appointmentController.createAppointment
);

router.get('/', 
    authenticateToken, 
    checkRole(ROLES.MANAGE_APPOINTMENTS), 
    appointmentController.getAppointments
);

router.put('/:id/status', 
    authenticateToken, 
    checkRole(ROLES.MANAGE_APPOINTMENTS), 
    appointmentController.updateAppointmentStatus
);

module.exports = router;