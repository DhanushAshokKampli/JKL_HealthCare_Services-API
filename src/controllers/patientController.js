const db = require('../config/database');
const bcrypt = require('bcrypt');

// Create Patient


// Get Own Profile
const getOwnProfile = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [users] = await db.query(
            `SELECT u.*, p.* 
             FROM users u 
             JOIN patients p ON u.id = p.user_id 
             WHERE u.email = ? AND u.role = 'patient'`,
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
            address: user.address,
            medical_record: user.medical_record
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            message: "Error fetching profile"
        });
    }
};


const getAllPatients = async (req, res) => {
    try {
        const [patients] = await db.query(`
            SELECT p.*, u.email, u.phone_number
            FROM patients p
            JOIN users u ON p.user_id = u.id
        `);
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Error fetching patients' });
    }
};

const getOwnAppointments = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // First, get user with password
        const [users] = await db.query(`
            SELECT 
                u.*,
                p.id as patient_id
            FROM users u 
            JOIN patients p ON u.id = p.user_id 
            WHERE u.email = ? AND u.role = 'patient'
        `, [email]);

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const user = users[0];

        // Verify password
        if (!user.password) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // Get appointments
        const [appointments] = await db.query(`
            SELECT 
                a.id,
                a.appointment_date,
                a.status,
                a.notes,
                c.name as caregiver_name,
                c.specialization
            FROM appointments a
            JOIN caregivers c ON a.caregiver_id = c.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        `, [user.patient_id]);

        const now = new Date();
        const response = {
            upcoming: appointments.filter(apt => new Date(apt.appointment_date) > now),
            past: appointments.filter(apt => new Date(apt.appointment_date) <= now)
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            message: "Error fetching appointments"
        });
    }
};
const deleteAccount = async (req, res) => {
    try {
        const { email, password, confirmDelete } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Verify delete confirmation
        if (!confirmDelete || confirmDelete !== "DELETE") {
            return res.status(400).json({
                message: 'Please type "DELETE" to confirm account deletion'
            });
        }

        // Get user with their patient ID
        const [users] = await db.query(
            `SELECT u.*, p.id as patient_id 
             FROM users u 
             JOIN patients p ON u.id = p.user_id 
             WHERE u.email = ? AND u.role = 'patient'`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        // Start transaction for deletion
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Delete appointments
            await connection.query(
                'DELETE FROM appointments WHERE patient_id = ?',
                [user.patient_id]
            );

            // Delete patient record
            await connection.query(
                'DELETE FROM patients WHERE id = ?',
                [user.patient_id]
            );

            // Delete user record
            await connection.query(
                'DELETE FROM users WHERE id = ?',
                [user.id]
            );

            await connection.commit();

            res.json({
                message: "Account deleted successfully",
                deletedAt: new Date().toISOString()
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({
            message: "Error deleting account",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create Patient (Registration)
const createPatient = async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phoneNumber, 
            password, 
            address, 
            medicalRecord 
        } = req.body;

        // Validate inputs
        if (!firstName || !lastName || !email || !phoneNumber || !password || !address) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if email exists
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and patient in transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Create user
            const [userResult] = await connection.query(
                `INSERT INTO users (first_name, last_name, email, phone_number, password, role) 
                 VALUES (?, ?, ?, ?, ?, 'patient')`,
                [firstName, lastName, email, phoneNumber, hashedPassword]
            );

            // Create patient profile
            await connection.query(
                `INSERT INTO patients (user_id, name, address, medical_record) 
                 VALUES (?, ?, ?, ?)`,
                [userResult.insertId, `${firstName} ${lastName}`, address, medicalRecord || null]
            );

            await connection.commit();

            res.status(201).json({
                message: "Registration successful",
                userId: userResult.insertId
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: "Error during registration"
        });
    }
};
const updateProfile = async (req, res) => {
    try {
        const { 
            email, 
            currentPassword,
            updates 
        } = req.body;

        // Validate input
        if (!email || !currentPassword) {
            return res.status(400).json({
                message: "Email and current password are required"
            });
        }

        // Get current user
        const [users] = await db.query(
            `SELECT u.*, p.id as patient_id 
             FROM users u 
             JOIN patients p ON u.id = p.user_id 
             WHERE u.email = ? AND u.role = 'patient'`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update user table
            if (updates.firstName || updates.lastName || updates.phoneNumber || updates.newEmail || updates.newPassword) {
                const userUpdates = [];
                const userValues = [];

                if (updates.firstName) {
                    userUpdates.push('first_name = ?');
                    userValues.push(updates.firstName);
                }

                if (updates.lastName) {
                    userUpdates.push('last_name = ?');
                    userValues.push(updates.lastName);
                }

                if (updates.phoneNumber) {
                    if (!updates.phoneNumber.match(/^\+?[0-9]{10,15}$/)) {
                        throw new Error('Invalid phone number format');
                    }
                    userUpdates.push('phone_number = ?');
                    userValues.push(updates.phoneNumber);
                }

                if (updates.newEmail) {
                    if (!updates.newEmail.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
                        throw new Error('Invalid email format');
                    }
                    // Check if new email already exists
                    const [existingEmail] = await connection.query(
                        'SELECT id FROM users WHERE email = ? AND id != ?',
                        [updates.newEmail, user.id]
                    );
                    if (existingEmail.length > 0) {
                        throw new Error('Email already in use');
                    }
                    userUpdates.push('email = ?');
                    userValues.push(updates.newEmail);
                }

                if (updates.newPassword) {
                    if (updates.newPassword.length < 8) {
                        throw new Error('Password must be at least 8 characters');
                    }
                    const hashedPassword = await bcrypt.hash(updates.newPassword, 10);
                    userUpdates.push('password = ?');
                    userValues.push(hashedPassword);
                }

                if (userUpdates.length > 0) {
                    await connection.query(
                        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
                        [...userValues, user.id]
                    );
                }
            }

            // Update patient table
            if (updates.address || updates.medicalRecord) {
                const patientUpdates = [];
                const patientValues = [];

                if (updates.address) {
                    patientUpdates.push('address = ?');
                    patientValues.push(updates.address);
                }

                if (updates.medicalRecord) {
                    patientUpdates.push('medical_record = ?');
                    patientValues.push(updates.medicalRecord);
                }

                if (patientUpdates.length > 0) {
                    await connection.query(
                        `UPDATE patients SET ${patientUpdates.join(', ')} WHERE id = ?`,
                        [...patientValues, user.patient_id]
                    );
                }
            }

            await connection.commit();

            // Get updated user data
            const [updatedUser] = await db.query(
                `SELECT 
                    u.first_name, 
                    u.last_name, 
                    u.email, 
                    u.phone_number,
                    p.address,
                    p.medical_record
                FROM users u
                JOIN patients p ON u.id = p.user_id
                WHERE u.id = ?`,
                [user.id]
            );

            res.json({
                message: "Profile updated successfully",
                user: updatedUser[0]
            });

        } catch (error) {
            await connection.rollback();
            if (error.message.includes('Invalid') || error.message.includes('already in use')) {
                return res.status(400).json({ message: error.message });
            }
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            message: "Error updating profile",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
module.exports = {
    createPatient,
    getOwnProfile,
    getOwnAppointments,
    getAllPatients,
    updateProfile,
    deleteAccount
   
};