const db = require('../config/database');
const { validateAppointment } = require('../utils/validation');

const createAppointment = async (req, res) => {
    try {
        const { isValid, errors } = validateAppointment(req.body);
        if (!isValid) {
            return res.status(400).json({ errors });
        }
        
        const { patient_id, caregiver_id, appointment_date, notes } = req.body;
        
        // Check for scheduling conflicts
        const [conflicts] = await db.query(`
            SELECT id
            FROM appointments
            WHERE caregiver_id = ?
            AND appointment_date BETWEEN DATE_SUB(?, INTERVAL 1 HOUR) AND DATE_ADD(?, INTERVAL 1 HOUR)
            AND status = 'scheduled'
        `, [caregiver_id, appointment_date, appointment_date]);
        
        if (conflicts.length > 0) {
            return res.status(400).json({ message: 'Scheduling conflict detected' });
        }
        
        // Create appointment
        await db.query(`
            INSERT INTO appointments (patient_id, caregiver_id, appointment_date, notes)
            VALUES (?, ?, ?, ?)
        `, [patient_id, caregiver_id, appointment_date, notes]);
        
        res.status(201).json({ message: 'Appointment created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating appointment' });
    }
};

const getAppointments = async (req, res) => {
    try {
        const [appointments] = await db.query(`
            SELECT 
                a.*,
                p.name as patient_name,
                c.name as caregiver_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN caregivers c ON a.caregiver_id = c.id
            ORDER BY a.appointment_date
        `);
        
        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        await db.query(`
            UPDATE appointments
            SET status = ?
            WHERE id = ?
        `, [status, req.params.id]);
        
        res.json({ message: 'Appointment status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating appointment status' });
    }
};

module.exports = {
    createAppointment,
    getAppointments,
    updateAppointmentStatus
};