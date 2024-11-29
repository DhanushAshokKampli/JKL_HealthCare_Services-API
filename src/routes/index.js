const router = require('express').Router();
const patientController = require('../controllers/patientController');
const caregiverController = require('../controllers/caregiverController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { authenticateToken, checkRole } = require('../middleware/auth');

router.post('/auth/login', authController.login);
router.post('/auth/register/patient', patientController.createPatient);
router.post('/auth/register/caregiver', caregiverController.createCaregiver);

router.get('/admin/dashboard/counts', authenticateToken, checkRole(['admin']), adminController.getDashboardCounts);
router.get('/admin/dashboard/stats', authenticateToken, checkRole(['admin']), adminController.getDashboardStats);

router.get('/admin/assignments/available', authenticateToken, checkRole(['admin']), adminController.getAvailableForAssignment);
router.post('/admin/assignments', authenticateToken, checkRole(['admin']), adminController.createAssignment);
router.get('/admin/assignments/recent', authenticateToken, checkRole(['admin']), adminController.getRecentAssignments);
router.put('/admin/assignments/:id/status', authenticateToken, checkRole(['admin']), adminController.updateAssignmentStatus);
router.post('/admin/assignments/assign', authenticateToken, checkRole(['admin']), adminController.assignCaregiverToPatient);
router.get('/admin/assignments/all', authenticateToken, checkRole(['admin']), adminController.getAllAssignments);

router.get('/admin/patients/:id', authenticateToken, checkRole(['admin']), adminController.getPatientById);

router.post('/patients/profile', patientController.getOwnProfile);
router.post('/patients/appointments', patientController.getOwnAppointments);
router.put('/patients/profile/update', patientController.updateProfile);
router.post('/patients/profile/delete', patientController.deleteAccount);

router.post('/caregivers/profile', caregiverController.getOwnProfile);
router.post('/caregivers/appointments', caregiverController.getOwnAppointments);

router.post('/admin/patients', authenticateToken, checkRole(['admin']), patientController.createPatient);
router.get('/admin/patients', authenticateToken, checkRole(['admin']), patientController.getAllPatients);
router.get('/admin/caregivers', authenticateToken, checkRole(['admin']), caregiverController.getAllCaregivers);

module.exports = router;