export function validatePassword(password) {
    const minLength = 8;
    const errors = [];

    if (password.length < minLength) {
        errors.push("ít nhất 8 ký tự");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("01 ký tự hoa");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("01 ký tự thường");
    }
    if (!/\d/.test(password)) {
        errors.push("01 chữ số");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("01 ký tự đặc biệt");
    }

    if (errors.length > 0) {
        return { 
            isValid: false, 
            error: `Password phải bao gồm ${errors.join(", ")}.` 
        };
    }
    return { isValid: true };
}
