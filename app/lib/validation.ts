// Common validation functions for the gym application

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (7-15 digits)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\d{7,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

/**
 * Validates age (must be minimumAge or older)
 */
export const isValidAge = (dob: string, minimumAge: number = 16): boolean => {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= minimumAge;
  }
  return age >= minimumAge;
};

/**
 * Validates time range (end time must be after start time)
 */
export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  return end > start;
};

/**
 * Validates weight (reasonable range)
 */
export const isValidWeight = (weight: string): boolean => {
  const num = parseFloat(weight);
  return !isNaN(num) && num > 0 && num <= 500;
};

/**
 * Validates height (reasonable range in cm)
 */
export const isValidHeight = (height: string): boolean => {
  const num = parseFloat(height);
  return !isNaN(num) && num > 0 && num <= 300;
};

/**
 * Validates experience years (reasonable range)
 */
export const isValidExperience = (experience: string): boolean => {
  const num = parseInt(experience);
  return !isNaN(num) && num >= 0 && num <= 50;
};

/**
 * Validates skill level (1-100 range)
 */
export const isValidSkillLevel = (level: number): boolean => {
  return level >= 1 && level <= 100;
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates password strength (minimum 6 characters)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validates that passwords match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Validates required fields
 */
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '') || 
        (Array.isArray(value) && value.length === 0)) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
};

/**
 * Validates numeric fields
 */
export const validateNumericFields = (data: Record<string, any>, numericFields: string[]): string[] => {
  const invalidFields: string[] = [];
  
  for (const field of numericFields) {
    const value = data[field];
    if (value !== undefined && value !== '' && (isNaN(Number(value)) || Number(value) <= 0)) {
      invalidFields.push(field);
    }
  }
  
  return invalidFields;
}; 