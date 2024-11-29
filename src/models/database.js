const db = require('../config/database');
const bcrypt = require('bcrypt');

const initializeDatabase = async () => {
    try {
        // Disable foreign key checks
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop existing tables
        const dropQueries = [
            'DROP TABLE IF EXISTS appointments',
            'DROP TABLE IF EXISTS assignments',  // Added assignments table to drop list
            'DROP TABLE IF EXISTS patients',
            'DROP TABLE IF EXISTS caregivers',
            'DROP TABLE IF EXISTS users'
        ];

        for (const query of dropQueries) {
            await db.query(query);
            console.log(`Dropped table: ${query.split(' ').pop()}`);
        }

        // Create tables in correct order
        const createQueries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone_number VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'caregiver', 'patient') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS patients (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                medical_record TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            
            `CREATE TABLE IF NOT EXISTS caregivers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(255),
                availability BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Added assignments table
            `CREATE TABLE IF NOT EXISTS assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    caregiver_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE
)`,

            `CREATE TABLE IF NOT EXISTS appointments (
               id INT PRIMARY KEY AUTO_INCREMENT,
            assignment_id INT NOT NULL,
            patient_id INT NOT NULL,
            caregiver_id INT NOT NULL,
            appointment_date DATE NOT NULL,
            time_slot TIME NOT NULL,
            duration INT DEFAULT 30,
            status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS caregiver_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    caregiver_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE
)`
        ];

        for (const query of createQueries) {
            await db.query(query);
            const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
            console.log(`Created table: ${tableName}`);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const [existingAdmin] = await db.query('SELECT id FROM users WHERE email = ?', ['Admin@gmail.com']);

        if (existingAdmin.length === 0) {
            await db.query(
                `INSERT INTO users (
                    first_name, last_name, email, phone_number, password, role
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    'System',
                    'Admin',
                    'Admin@gmail.com',
                    '+447000000000',
                    hashedPassword,
                    'admin'
                ]
            );
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }

        // Re-enable foreign key checks
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        // Re-enable foreign key checks even if there's an error
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        throw error;
    }
};

module.exports = { initializeDatabase };




