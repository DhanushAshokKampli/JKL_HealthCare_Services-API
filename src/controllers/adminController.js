const db = require('../config/database');

// Get Dashboard Statistics
const assignCaregiverToPatient = async (req, res) => {
    try {
        const { patientId, caregiverId, notes } = req.body;

        // Validate input
        if (!patientId || !caregiverId) {
            return res.status(400).json({
                message: "Patient ID and Caregiver ID are required"
            });
        }

        // Check if patient and caregiver exist
        const [patient] = await db.query('SELECT id FROM patients WHERE id = ?', [patientId]);
        const [caregiver] = await db.query('SELECT id FROM caregivers WHERE id = ?', [caregiverId]);

        if (patient.length === 0 || caregiver.length === 0) {
            return res.status(404).json({
                message: "Patient or Caregiver not found"
            });
        }

        // Check if assignment already exists
        const [existingAssignment] = await db.query(
            'SELECT id FROM assignments WHERE patient_id = ? AND caregiver_id = ? AND status = "active"',
            [patientId, caregiverId]
        );

        if (existingAssignment.length > 0) {
            return res.status(409).json({
                message: "Assignment already exists"
            });
        }

        // Create assignment
        const [result] = await db.query(
            `INSERT INTO assignments (patient_id, caregiver_id, notes, status) 
             VALUES (?, ?, ?, 'active')`,
            [patientId, caregiverId, notes]
        );

        res.status(201).json({
            message: "Caregiver assigned successfully",
            assignmentId: result.insertId
        });

    } catch (error) {
        console.error('Error assigning caregiver:', error);
        res.status(500).json({ message: 'Error assigning caregiver' });
    }
};

const getDashboardCounts = async (req, res) => {
    try {
        // Get total patients
        const [patientCount] = await db.query('SELECT COUNT(*) as total FROM patients');
        
        // Get total caregivers
        const [caregiverCount] = await db.query('SELECT COUNT(*) as total FROM caregivers');
        
        // Get total assigned patients
        const [assignedCount] = await db.query('SELECT COUNT(DISTINCT patient_id) as total FROM assignments WHERE status = "active"');
        
        // Get total appointments
        const [appointmentCount] = await db.query('SELECT COUNT(*) as total FROM appointments');

        res.json({
            totalPatients: patientCount[0].total,
            totalCaregivers: caregiverCount[0].total,
            totalAssignedPatients: assignedCount[0].total,
            totalAppointments: appointmentCount[0].total
        });
    } catch (error) {
        console.error('Error fetching dashboard counts:', error);
        res.status(500).json({ message: 'Error fetching dashboard counts' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        // Get total counts
        const [patientCount] = await db.query('SELECT COUNT(*) as count FROM patients');
        const [caregiverCount] = await db.query('SELECT COUNT(*) as count FROM caregivers');
        const [assignmentCount] = await db.query('SELECT COUNT(*) as count FROM assignments WHERE status = "active"');

        // Get recent assignments
        const [recentAssignments] = await db.query(`
            SELECT 
                a.id,
                p.name as patient_name,
                c.name as caregiver_name,
                a.created_at,  // Changed from assigned_date to created_at
                a.status
            FROM assignments a
            JOIN patients p ON a.patient_id = p.id
            JOIN caregivers c ON a.caregiver_id = c.id
            ORDER BY a.created_at DESC  // Changed from assigned_date to created_at
            LIMIT 5
        `);

        res.json({
            statistics: {
                totalPatients: patientCount[0].count,
                totalCaregivers: caregiverCount[0].count,
                activeAssignments: assignmentCount[0].count
            },
            recentAssignments
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
};

// Get Available Caregivers and Patients
const getAvailableForAssignment = async (req, res) => {
    try {
        // Get available caregivers
        const [caregivers] = await db.query(`
            SELECT 
                c.*,
                COUNT(a.id) as current_patients
            FROM caregivers c
            LEFT JOIN assignments a ON c.id = a.caregiver_id AND a.status = 'active'
            WHERE c.availability = true
            GROUP BY c.id
        `);

        // Get unassigned patients
        const [patients] = await db.query(`
            SELECT p.*
            FROM patients p
            LEFT JOIN assignments a ON p.id = a.patient_id AND a.status = 'active'
            WHERE a.id IS NULL
        `);

        res.json({
            caregivers,
            patients
        });
    } catch (error) {
        console.error('Error fetching available assignments:', error);
        res.status(500).json({ message: 'Error fetching available assignments' });
    }
};

// Create Assignment
const createAssignment = async (req, res) => {
    try {
        const { caregiverId, patientId, assignmentDetails } = req.body;

        // Validate input
        if (!caregiverId || !patientId || !assignmentDetails.startDate) {
            return res.status(400).json({ 
                message: 'Caregiver ID, patient ID, and start date are required' 
            });
        }

        // Check if patient already has active assignment
        const [existingAssignment] = await db.query(
            'SELECT id FROM assignments WHERE patient_id = ? AND status = "active"',
            [patientId]
        );

        if (existingAssignment.length > 0) {
            return res.status(400).json({ 
                message: 'Patient already has an active assignment' 
            });
        }

        // Create assignment
        const [result] = await db.query(
            `INSERT INTO assignments (
                caregiver_id, 
                patient_id, 
                start_date,
                status,
                notes
            ) VALUES (?, ?, ?, 'active', ?)`,
            [
                caregiverId,
                patientId,
                assignmentDetails.startDate,
                assignmentDetails.notes || null
            ]
        );

        res.status(201).json({
            message: 'Assignment created successfully',
            assignmentId: result.insertId
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ message: 'Error creating assignment' });
    }
};


// Get Recent Assignments
const getRecentAssignments = async (req, res) => {
    try {
        const [assignments] = await db.query(`
            SELECT 
                a.id,
                a.created_at,  // Changed from assigned_date to created_at
                a.status,
                p.name as patient_name,
                c.name as caregiver_name,
                c.specialization
            FROM assignments a
            JOIN patients p ON a.patient_id = p.id
            JOIN caregivers c ON a.caregiver_id = c.id
            ORDER BY a.created_at DESC  // Changed from assigned_date to created_at
            LIMIT 10
        `);

        const [stats] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as last_week
            FROM assignments
        `);

        res.json({
            assignments,
            statistics: {
                total: stats[0].total,
                lastWeek: stats[0].last_week
            }
        });
    } catch (error) {
        console.error('Error fetching recent assignments:', error);
        res.status(500).json({ message: 'Error fetching recent assignments' });
    }
};

// Update Assignment Status
const updateAssignmentStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const assignmentId = req.params.id;

        if (!['active', 'completed', 'terminated'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [result] = await db.query(
            `UPDATE assignments 
             SET status = ?, 
                 notes = COALESCE(?, notes),
                 updated_at = NOW()
             WHERE id = ?`,
            [status, notes, assignmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json({
            message: 'Assignment status updated successfully'
        });
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({ message: 'Error updating assignment' });
    }
};
// Get all assigned patients
const getAllAssignments = async (req, res) => {
    try {
        const [assignments] = await db.query(`
            SELECT 
                a.id as assignment_id,
                p.id as patient_id,
                CONCAT(pu.first_name, ' ', pu.last_name) as patient_name,
                c.id as caregiver_id,
                CONCAT(cu.first_name, ' ', cu.last_name) as caregiver_name,
                a.created_at as assignment_date,
                a.status
            FROM assignments a
            JOIN patients p ON a.patient_id = p.id
            JOIN caregivers c ON a.caregiver_id = c.id
            JOIN users pu ON p.user_id = pu.id
            JOIN users cu ON c.user_id = cu.id
            WHERE a.status = 'active'
            ORDER BY a.created_at DESC
        `);

        res.json({ assignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'Error fetching assignments' });
    }
};
const getPatientById = async (req, res) => {
    try {
        const [patient] = await db.query(`
            SELECT 
                p.*,
                u.email,
                u.phone_number,
                c.name as caregiver_name,
                c.specialization as caregiver_specialization
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN assignments a ON p.id = a.patient_id AND a.status = 'active'
            LEFT JOIN caregivers c ON a.caregiver_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (patient.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        res.json(patient[0]);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ message: 'Error fetching patient' });
    }
};

module.exports = {
    getPatientById,
    getAllAssignments,
    getDashboardStats,
    getAvailableForAssignment,
    createAssignment,
    getRecentAssignments,
    updateAssignmentStatus,
    getDashboardCounts,
    assignCaregiverToPatient
};