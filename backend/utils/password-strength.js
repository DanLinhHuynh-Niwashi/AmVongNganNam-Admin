export function validatePassword(password) {
    const minLength = 8;
    const errors = [];

    if (password.length < minLength) {
        errors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("one lowercase letter");
    }
    if (!/\d/.test(password)) {
        errors.push("one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("one special character");
    }

    if (errors.length > 0) {
        return { 
            isValid: false, 
            error: `Password must contain ${errors.join(", ")}.` 
        };
    }
    return { isValid: true };
}
