const db = require('../config/database');

class CaregiverDashboardController {
    // Get Caregiver's Dashboard Overview
    getDashboardStats(req, res) {
        return async () => {
            try {
                const { email, password } = req.body;

                const [caregiver] = await db.query(
                    `SELECT c.id FROM caregivers c 
                     JOIN users u ON c.user_id = u.id 
                     WHERE u.email = ?`,
                    [email]
                );

                if (!caregiver) {
                    return res.status(404).json({ message: 'Caregiver not found' });
                }

                // Get total assigned patients
                const [assignedPatients] = await db.query(
                    `SELECT 
                        COUNT(DISTINCT a.patient_id) as total_patients,
                        COUNT(DISTINCT CASE WHEN apt.status = 'scheduled' THEN apt.id END) as pending_appointments,
                        COUNT(DISTINCT CASE WHEN apt.status = 'completed' THEN apt.id END) as completed_appointments
                    FROM assignments a
                    LEFT JOIN appointments apt ON a.patient_id = apt.patient_id
                    WHERE a.caregiver_id = ? AND a.status = 'active'`,
                    [caregiver.id]
                );

                // Get today's appointments
                const [todayAppointments] = await db.query(
                    `SELECT 
                        apt.id,
                        apt.appointment_date,
                        p.name as patient_name,
                        apt.status,
                        apt.notes
                    FROM appointments apt
                    JOIN patients p ON apt.patient_id = p.id
                    WHERE apt.caregiver_id = ? 
                    AND DATE(apt.appointment_date) = CURDATE()
                    ORDER BY apt.appointment_date`,
                    [caregiver.id]
                );

                res.json({
                    statistics: assignedPatients[0],
                    todayAppointments
                });
            } catch (error) {
                console.error('Error fetching caregiver dashboard:', error);
                res.status(500).json({ message: 'Error fetching dashboard data' });
            }
        };
    }

    // Get Assigned Patients List
    getAssignedPatients(req, res) {
        return async () => {
            try {
                const { email, password } = req.body;

                const [caregiver] = await db.query(
                    `SELECT c.id FROM caregivers c 
                     JOIN users u ON c.user_id = u.id 
                     WHERE u.email = ?`,
                    [email]
                );

                const [patients] = await db.query(
                    `SELECT 
                        p.id,
                        p.name,
                        p.medical_record,
                        a.assigned_date,
                        (SELECT apt.appointment_date 
                         FROM appointments apt 
                         WHERE apt.patient_id = p.id 
                         AND apt.status = 'scheduled'
                         ORDER BY apt.appointment_date DESC 
                         LIMIT 1) as next_appointment
                    FROM assignments a
                    JOIN patients p ON a.patient_id = p.id
                    WHERE a.caregiver_id = ? AND a.status = 'active'
                    ORDER BY next_appointment ASC`,
                    [caregiver.id]
                );

                res.json({ assignedPatients: patients });
            } catch (error) {
                console.error('Error fetching assigned patients:', error);
                res.status(500).json({ message: 'Error fetching patient list' });
            }
        };
    }

    // Schedule Appointment
    scheduleAppointment(req, res) {
        return async () => {
            try {
                const { email, password, appointmentData } = req.body;
                const { patientId, appointmentDate, notes } = appointmentData;

                const [caregiver] = await db.query(
                    `SELECT c.id FROM caregivers c 
                     JOIN users u ON c.user_id = u.id 
                     WHERE u.email = ?`,
                    [email]
                );

                // Validate assignment exists
                const [assignment] = await db.query(
                    `SELECT id FROM assignments 
                     WHERE caregiver_id = ? AND patient_id = ? AND status = 'active'`,
                    [caregiver.id, patientId]
                );

                if (assignment.length === 0) {
                    return res.status(400).json({ 
                        message: 'No active assignment found for this patient' 
                    });
                }

                // Check for scheduling conflicts
                const [conflicts] = await db.query(
                    `SELECT id FROM appointments 
                     WHERE caregiver_id = ? 
                     AND DATE(appointment_date) = DATE(?) 
                     AND TIME(appointment_date) = TIME(?)`,
                    [caregiver.id, appointmentDate, appointmentDate]
                );

                if (conflicts.length > 0) {
                    return res.status(400).json({ 
                        message: 'Time slot already booked' 
                    });
                }

                // Create appointment
                const [result] = await db.query(
                    `INSERT INTO appointments (
                        caregiver_id, 
                        patient_id, 
                        appointment_date, 
                        notes, 
                        status
                    ) VALUES (?, ?, ?, ?, 'scheduled')`,
                    [caregiver.id, patientId, appointmentDate, notes]
                );

                // Get appointment details
                const [appointment] = await db.query(
                    `SELECT 
                        a.*,
                        p.name as patient_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    WHERE a.id = ?`,
                    [result.insertId]
                );

                res.status(201).json({
                    message: 'Appointment scheduled successfully',
                    appointment: appointment[0]
                });
            } catch (error) {
                console.error('Error scheduling appointment:', error);
                res.status(500).json({ message: 'Error scheduling appointment' });
            }
        };
    }

    // Get Appointment Schedule
    getSchedule(req, res) {
        return async () => {
            try {
                const { email, password, date } = req.body;

                const [caregiver] = await db.query(
                    `SELECT c.id FROM caregivers c 
                     JOIN users u ON c.user_id = u.id 
                     WHERE u.email = ?`,
                    [email]
                );

                const [appointments] = await db.query(
                    `SELECT 
                        apt.id,
                        apt.appointment_date,
                        p.name as patient_name,
                        apt.status,
                        apt.notes
                    FROM appointments apt
                    JOIN patients p ON apt.patient_id = p.id
                    WHERE apt.caregiver_id = ? 
                    AND DATE(apt.appointment_date) = ?
                    ORDER BY apt.appointment_date`,
                    [caregiver.id, date]
                );

                res.json({ appointments });
            } catch (error) {
                console.error('Error fetching schedule:', error);
                res.status(500).json({ message: 'Error fetching schedule' });
            }
        };
    }
}

module.exports = new CaregiverDashboardController();