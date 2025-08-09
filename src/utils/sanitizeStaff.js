// Helper function to remove the password hash from the staff object before sending it in a response
export default (staff) => {
    const { password_hash, ...sanitized } = staff;
    return sanitized;
};