const validatePatient = (data) => {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (data.address && data.address.trim().length < 5) {
        errors.push('Address must be at least 5 characters long');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateCaregiver = (data) => {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (data.specialization && data.specialization.trim().length < 2) {
        errors.push('Specialization must be at least 2 characters long');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateAppointment = (data) => {
    const errors = [];
    
    if (!data.patient_id) {
        errors.push('Patient ID is required');
    }
    
    if (!data.caregiver_id) {
        errors.push('Caregiver ID is required');
    }
    
    if (!data.appointment_date) {
        errors.push('Appointment date is required');
    }
    
    const appointmentDate = new Date(data.appointment_date);
    if (appointmentDate < new Date()) {
        errors.push('Appointment date must be in the future');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validatePatient,
    validateCaregiver,
    validateAppointment
};