const bcrypt = require('bcrypt');
const db = require('../config/database');

const createAdminUser = async () => {
    try {
        // Check if admin already exists
        const [existingAdmin] = await db.query('SELECT * FROM users WHERE email = ?', ['Admin@gmail.com']);
        
        if (existingAdmin.length === 0) {
            // Hash password
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            
            // Create admin user
            const [result] = await db.query(
                `INSERT INTO users (
                    first_name, 
                    last_name, 
                    email, 
                    phone_number, 
                    password, 
                    role
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
            return true;
        } else {
            console.log('Admin user already exists');
            return true;
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
        return false;
    }
};

module.exports = { createAdminUser };