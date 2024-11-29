const db = require('../config/database');
const bcrypt = require('bcrypt');

class CaregiverController {
    // Create Caregiver (Public Route - No Token Required)
    async createCaregiver(req, res) {
        try {
            const {
                firstName,
                lastName,
                email,
                phoneNumber,
                password,
                specialization,
                availability
            } = req.body;

            // Validation
            const errors = [];
            if (!firstName || firstName.length < 2) errors.push('First name is required (min 2 characters)');
            if (!lastName || lastName.length < 2) errors.push('Last name is required (min 2 characters)');
            if (!email || !email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
                errors.push('Valid email is required');
            }
            if (!phoneNumber || !phoneNumber.match(/^\+?[0-9]{10,15}$/)) {
                errors.push('Valid phone number is required (+44XXXXXXXXXX format for UK)');
            }
            if (!password || password.length < 8) {
                errors.push('Password must be at least 8 characters');
            }
            if (!specialization) errors.push('Specialization is required');

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            // Check if email exists
            const [existingUser] = await db.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({
                    message: 'Email already registered'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create transaction
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Insert user
                const [userResult] = await connection.query(
                    `INSERT INTO users (
                        first_name, last_name, email, phone_number, password, role
                    ) VALUES (?, ?, ?, ?, ?, 'caregiver')`,
                    [firstName, lastName, email, phoneNumber, hashedPassword]
                );

                // Insert caregiver details
                await connection.query(
                    `INSERT INTO caregivers (
                        user_id, name, specialization, availability
                    ) VALUES (?, ?, ?, ?)`,
                    [
                        userResult.insertId,
                        `${firstName} ${lastName}`,
                        specialization,
                        availability !== false
                    ]
                );

                await connection.commit();
                
                res.status(201).json({
                    message: 'Caregiver registration successful',
                    caregiverId: userResult.insertId
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Caregiver creation error:', error);
            res.status(500).json({
                message: 'Error creating caregiver',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get Own Profile (Public Route - Email/Password Required)
    async getOwnProfile(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password are required"
                });
            }

            const [users] = await db.query(
                `SELECT u.*, c.* 
                FROM users u 
                JOIN caregivers c ON u.id = c.user_id 
                WHERE u.email = ? AND u.role = 'caregiver'`,
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            res.json({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phoneNumber: user.phone_number,
                specialization: user.specialization,
                availability: user.availability
            });
        } catch (error) {
            console.error('Error fetching caregiver profile:', error);
            res.status(500).json({
                message: "Error fetching profile"
            });
        }
    }

    // Get Own Appointments (Public Route - Email/Password Required)
    async getOwnAppointments(req, res) {
        try {
            const { email, password } = req.body;

            const [users] = await db.query(
                `SELECT u.*, c.id as caregiver_id 
                FROM users u 
                JOIN caregivers c ON u.id = c.user_id 
                WHERE u.email = ? AND u.role = 'caregiver'`,
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            const [appointments] = await db.query(
                `SELECT 
                    a.*,
                    p.name as patient_name,
                    p.address as patient_address
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                WHERE a.caregiver_id = ?
                ORDER BY a.appointment_date DESC`,
                [user.caregiver_id]
            );

            res.json(appointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({
                message: "Error fetching appointments"
            });
        }
    }

    // Admin Routes (Bearer Token Required)
    async getAllCaregivers(req, res) {
        try {
            const [caregivers] = await db.query(`
                SELECT 
                    c.*,
                    u.email,
                    u.phone_number,
                    COUNT(DISTINCT apt.id) as scheduled_appointments
                FROM caregivers c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN appointments apt ON c.id = apt.caregiver_id AND apt.status = 'scheduled'
                GROUP BY c.id
            `);
            
            res.json(caregivers);
        } catch (error) {
            console.error('Error fetching caregivers:', error);
            res.status(500).json({ message: 'Error fetching caregivers' });
        }
    }

    async updateCaregiver(req, res) {
        try {
            const { specialization, availability } = req.body;
            const caregiverId = req.params.id;

            const [result] = await db.query(
                `UPDATE caregivers
                SET specialization = COALESCE(?, specialization),
                    availability = COALESCE(?, availability)
                WHERE id = ?`,
                [specialization, availability, caregiverId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Caregiver not found' });
            }

            res.json({ message: 'Caregiver updated successfully' });
        } catch (error) {
            console.error('Error updating caregiver:', error);
            res.status(500).json({ message: 'Error updating caregiver' });
        }
    }

    async deleteCaregiver(req, res) {
        try {
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                const [caregiver] = await connection.query(
                    'SELECT user_id FROM caregivers WHERE id = ?',
                    [req.params.id]
                );

                if (caregiver.length === 0) {
                    await connection.rollback();
                    return res.status(404).json({ message: 'Caregiver not found' });
                }

                await connection.query('DELETE FROM caregivers WHERE id = ?', [req.params.id]);
                await connection.query('DELETE FROM users WHERE id = ?', [caregiver[0].user_id]);

                await connection.commit();
                res.json({ message: 'Caregiver deleted successfully' });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error deleting caregiver:', error);
            res.status(500).json({ message: 'Error deleting caregiver' });
        }
    }
}

module.exports = new CaregiverController();