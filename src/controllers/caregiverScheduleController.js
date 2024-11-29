const db = require('../config/database');

class CaregiverScheduleController {
    // Set caregiver schedule
    async setSchedule(req, res) {
        try {
            const { caregiverId, scheduleDate, timeSlots } = req.body;

            // Validate input
            if (!caregiverId || !scheduleDate || !timeSlots) {
                return res.status(400).json({
                    message: "Caregiver ID, date and time slots are required"
                });
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Delete existing schedule for the date
                await connection.query(
                    'DELETE FROM caregiver_schedule WHERE caregiver_id = ? AND schedule_date = ?',
                    [caregiverId, scheduleDate]
                );

                // Insert new schedule
                for (const slot of timeSlots) {
                    await connection.query(
                        `INSERT INTO caregiver_schedule 
                        (caregiver_id, schedule_date, start_time, end_time) 
                        VALUES (?, ?, ?, ?)`,
                        [caregiverId, scheduleDate, slot.start, slot.end]
                    );
                }

                await connection.commit();

                res.status(201).json({
                    message: "Schedule set successfully",
                    scheduleDate,
                    timeSlots
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('Error setting schedule:', error);
            res.status(500).json({ message: 'Error setting schedule' });
        }
    }

    // Get assigned patients for a date
    async getAssignedPatients(req, res) {
        try {
            const { date } = req.params;
            const { caregiverId } = req.query;

            const [assignments] = await db.query(`
                SELECT 
                    a.id as assignment_id,
                    p.id as patient_id,
                    CONCAT(u.first_name, ' ', u.last_name) as patient_name,
                    a.assignment_date,
                    ap.appointment_date,
                    ap.time_slot,
                    ap.status
                FROM assignments a
                JOIN patients p ON a.patient_id = p.id
                JOIN users u ON p.user_id = u.id
                LEFT JOIN appointments ap ON a.id = ap.assignment_id
                WHERE a.caregiver_id = ? 
                AND (a.assignment_date = ? OR ap.appointment_date = ?)
                AND a.status = 'active'
                ORDER BY ap.time_slot ASC
            `, [caregiverId, date, date]);

            res.json({ assignments });

        } catch (error) {
            console.error('Error fetching assigned patients:', error);
            res.status(500).json({ message: 'Error fetching assigned patients' });
        }
    }

    // Schedule appointment for assigned patient
    async scheduleAppointment(req, res) {
        try {
            const {
                assignmentId,
                appointmentDate,
                timeSlot,
                duration,
                notes
            } = req.body;

            // Validate input
            if (!assignmentId || !appointmentDate || !timeSlot) {
                return res.status(400).json({
                    message: "Assignment ID, date and time slot are required"
                });
            }

            // Get assignment details
            const [assignments] = await db.query(
                'SELECT * FROM assignments WHERE id = ? AND status = "active"',
                [assignmentId]
            );

            if (assignments.length === 0) {
                return res.status(404).json({
                    message: "Active assignment not found"
                });
            }

            const assignment = assignments[0];

            // Check caregiver availability
            const [availability] = await db.query(
                `SELECT * FROM caregiver_schedule 
                WHERE caregiver_id = ? 
                AND schedule_date = ? 
                AND ? BETWEEN start_time AND end_time
                AND is_available = true`,
                [assignment.caregiver_id, appointmentDate, timeSlot]
            );

            if (availability.length === 0) {
                return res.status(400).json({
                    message: "Caregiver not available at selected time"
                });
            }

            // Create appointment
            const [result] = await db.query(
                `INSERT INTO appointments 
                (assignment_id, patient_id, caregiver_id, appointment_date, time_slot, duration, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    assignmentId,
                    assignment.patient_id,
                    assignment.caregiver_id,
                    appointmentDate,
                    timeSlot,
                    duration || 30,
                    notes
                ]
            );

            res.status(201).json({
                message: "Appointment scheduled successfully",
                appointmentId: result.insertId
            });

        } catch (error) {
            console.error('Error scheduling appointment:', error);
            res.status(500).json({ message: 'Error scheduling appointment' });
        }
    }
}

module.exports = new CaregiverScheduleController();