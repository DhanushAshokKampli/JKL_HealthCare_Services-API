# JKL_Healthcare_services_backend_API
# JKL Healthcare Services - Patient Management System

## Overview
A secure healthcare management system built with Node.js, Express, and MySQL, focusing on managing patient data and caregiver assignments. The system provides role-based access control (Admin, Caregiver, Patient) with secure authentication and data protection.

## Features
- 🔐 Secure Authentication & Authorization
- 👥 Role-Based Access Control
- 🏥 Patient Management
- 👨‍⚕️ Caregiver Assignment
- 📅 Appointment Scheduling
- 🔒 Data Protection & Security

## Tech Stack
- Backend: Node.js + Express.js
- Database: MySQL
- Authentication: JWT (JSON Web Tokens)
- Security: bcrypt (password hashing)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'caregiver', 'patient') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Patients Table
```sql
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    medical_record TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Caregivers Table
```sql
CREATE TABLE caregivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    caregiver_id INT,
    appointment_date DATETIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id)
);
```

## API Endpoints

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

### Patient Management
```http
# Create Patient
POST /api/patients
Authorization: Bearer <token>
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+447123456789",
    "password": "Patient123!",
    "address": "123 Main St",
    "medical_record": "Initial checkup"
}

# Get Patient Profile
GET /api/patients/profile
Authorization: Bearer <token>

# Update Patient
PUT /api/patients/profile/update
Authorization: Bearer <token>
{
    "address": "New Address",
    "medical_record": "Updated record"
}
```

### Caregiver Management
```http
# Get All Caregivers
GET /api/caregivers
Authorization: Bearer <token>

# Update Caregiver Availability
PUT /api/caregivers/availability
Authorization: Bearer <token>
{
    "availability": true
}
```

### Appointment Management
```http
# Create Appointment
POST /api/appointments
Authorization: Bearer <token>
{
    "patient_id": 1,
    "caregiver_id": 1,
    "appointment_date": "2024-01-15T14:30:00Z",
    "notes": "Regular checkup"
}

# Get Appointments
GET /api/appointments
Authorization: Bearer <token>
```

## Setup Instructions

1. Clone the repository
```bash
git clone <repository-url>
cd healthcare-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create .env file
cp .env.example .env

# Update .env with your values
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=healthcare_db
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. Create database tables
```bash
# Run database migrations
node src/models/database.js
```

5. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## Security Features
- Password Hashing (bcrypt)
- JWT Authentication
- Role-Based Access Control
- Input Validation
- SQL Injection Prevention
- XSS Protection
- Rate Limiting

## Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure
```
healthcare-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── 
│   │   ├── 
│   │   
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── database.js
│   ├── routes/
│   │   └── index.js
│   └── server.js
├── tests/
├── .env
└── package.json
```

## Error Handling
The API uses standard HTTP response codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Contact
Your Name - your.email@example.com
Project Link: [https://github.com/yourusername/healthcare-api](https://github.com/yourusername/healthcare-api)

## Acknowledgments
* JWT Authentication
* Express.js
* MySQL
* Security Best Practices
* Here is a concise README file for the provided authentication code and API endpoints:

# Healthcare System API

This API provides authentication and administrative functionality for a healthcare system.

## Authentication

- **Login**: `POST /api/auth/login`
- **Register Patient**: `POST /api/auth/register/patient` 
- **Register Caregiver**: `POST /api/auth/register/caregiver`

## Admin Dashboard
- **Get Dashboard Counts**: `GET /api/admin/dashboard/counts`
- **Get Dashboard Stats**: `GET /api/admin/dashboard/stats`

## Admin Assignments
- **Get Available for Assignment**: `GET /api/admin/assignments/available`
- **Create Assignment**: `POST /api/admin/assignments`
- **Get Recent Assignments**: `GET /api/admin/assignments/recent`
- **Update Assignment Status**: `PUT /api/admin/assignments/:id/status`
- **Assign Caregiver to Patient**: `POST /api/admin/assignments/assign`
- **Get All Assignments**: `GET /api/admin/assignments/all`

## Admin Patients
- **Get Patient by ID**: `GET /api/admin/patients/:id`
- **Create Patient**: `POST /api/admin/patients`
- **Get All Patients**: `GET /api/admin/patients`

## Admin Caregivers
- **Get All Caregivers**: `GET /api/admin/caregivers`

## Patient Routes
- **Get Own Profile**: `POST /api/patients/profile`
- **Get Own Appointments**: `POST /api/patients/appointments`
- **Update Profile**: `PUT /api/patients/profile/update`
- **Delete Account**: `POST /api/patients/profile/delete`

## Caregiver Routes
- **Get Own Profile**: `POST /api/caregivers/profile`
- **Get Own Appointments**: `POST /api/caregivers/appointments`

## Database
The API uses a `healthcare_db` database.
## Database Schema

The `healthcare_db` database has the following schema:

**Users Table**
- `id` (integer, primary key)
- `firstName` (string)
- `lastName` (string)
- `email` (string, unique)
- `password` (string, hashed)
- `role` (string, enum: 'admin', 'patient', 'caregiver')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Assignments Table** 
- `id` (integer, primary key)
- `patientId` (integer, foreign key referencing Users table)
- `caregiverId` (integer, foreign key referencing Users table) 
- `status` (string, enum: 'pending', 'active', 'completed')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Appointments Table**
- `id` (integer, primary key)
- `patientId` (integer, foreign key referencing Users table)
- `caregiverId` (integer, foreign key referencing Users table)
- `date` (datetime)
- `status` (string, enum: 'scheduled', 'completed', 'cancelled')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## API Endpoints

The API has the following endpoints:

### Authentication
- **Login**: `POST /api/auth/login`
- **Register Patient**: `POST /api/auth/register/patient`
- **Register Caregiver**: `POST /api/auth/register/caregiver`

### Admin Dashboard
- **Get Dashboard Counts**: `GET /api/admin/dashboard/counts`
- **Get Dashboard Stats**: `GET /api/admin/dashboard/stats`

### Admin Assignments
- **Get Available for Assignment**: `GET /api/admin/assignments/available`
- **Create Assignment**: `POST /api/admin/assignments`
- **Get Recent Assignments**: `GET /api/admin/assignments/recent`
- **Update Assignment Status**: `PUT /api/admin/assignments/:id/status`
- **Assign Caregiver to Patient**: `POST /api/admin/assignments/assign`
- **Get All Assignments**: `GET /api/admin/assignments/all`

### Admin Patients
- **Get Patient by ID**: `GET /api/admin/patients/:id`
- **Create Patient**: `POST /api/admin/patients`
- **Get All Patients**: `GET /api/admin/patients`

### Admin Caregivers
- **Get All Caregivers**: `GET /api/admin/caregivers`

### Patient Routes
- **Get Own Profile**: `POST /api/patients/profile`
- **Get Own Appointments**: `POST /api/patients/appointments`
- **Update Profile**: `PUT /api/patients/profile/update`
- **Delete Account**: `POST /api/patients/profile/delete`

### Caregiver Routes
- **Get Own Profile**: `POST /api/caregivers/profile`
- **Get Own Appointments**: `POST /api/caregivers/appointments`
