const router = require('express').Router();
const caregiverController = require('../controllers/caregiverController');
const { authenticateToken, checkRole } = require('../middleware/auth');
const caregiverDashboardController = require('../controllers/caregiverDashboardController');

// Get all caregivers
router.get('/', 
    authenticateToken, 
    checkRole(['admin', 'patient']), 
    caregiverController.getAllCaregivers
);

// Get caregiver by ID
router.get('/:id', 
    authenticateToken, 
    checkRole(['admin', 'patient']), 
    caregiverController.getCaregiverById
);

// Create new caregiver (admin only)
router.post('/', 
    authenticateToken, 
    checkRole(['admin']), 
    caregiverController.createCaregiver
);

// Update caregiver (admin only)
router.put('/:id', 
    authenticateToken, 
    checkRole(['admin']), 
    caregiverController.updateCaregiver
);
// Dashboard routes
router.post('/dashboard/stats', caregiverDashboardController.getDashboardStats);
router.post('/patients/assigned', caregiverDashboardController.getAssignedPatients);
router.post('/appointments/schedule', caregiverDashboardController.scheduleAppointment);
router.post('/appointments/schedule/get', caregiverDashboardController.getSchedule);

// Delete caregiver (admin only)
router.delete('/:id', 
    authenticateToken, 
    checkRole(['admin']), 
    caregiverController.deleteCaregiver
);

module.exports = router;





