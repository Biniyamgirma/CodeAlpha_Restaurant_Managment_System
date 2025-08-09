import pool from '../database/connection.js';
import bcrypt from 'bcrypt';

// Helper function to remove the password hash from the staff object before sending it in a response
const sanitizeStaff = (staff) => {
    const { password_hash, ...sanitized } = staff;
    return sanitized;
};

// @desc    Create a new staff member
// @route   POST /api/v1/staff
// @access  Private (Admin/Manager)
const createStaff = async (req, res) => {
    const { restaurant_id, first_name, last_name, email, password, role } = req.body;

    if (!restaurant_id || !first_name || !last_name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields: restaurant_id, first_name, last_name, email, password, role' });
    }

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { rows } = await pool.query(
        'INSERT INTO staff (restaurant_id, first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [restaurant_id, first_name, last_name, email, password_hash, role]
    );

    res.status(201).json(sanitizeStaff(rows[0]));
};

// @desc    Get all staff for a specific restaurant
// @route   GET /api/v1/staff?restaurant_id=<uuid>
// @access  Private (Admin/Manager)
const getAllStaff = async (req, res) => {
    const { restaurant_id } = req.query;

    if (!restaurant_id) {
        return res.status(400).json({ message: 'A restaurant_id query parameter is required.' });
    }

    const { rows } = await pool.query('SELECT * FROM staff WHERE restaurant_id = $1 ORDER BY created_at DESC', [restaurant_id]);
    
    const sanitizedResult = rows.map(staff => sanitizeStaff(staff));
    res.status(200).json(sanitizedResult);
};

// @desc    Get a single staff member by ID
// @route   GET /api/v1/staff/:id
// @access  Private
const getStaffById = async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM staff WHERE staff_id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
    }

    res.status(200).json(sanitizeStaff(rows[0]));
};

// @desc    Update a staff member's details
// @route   PUT /api/v1/staff/:id
// @access  Private (Admin/Manager)
const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, role, is_active } = req.body;

    // Note: Password updates should be handled via a separate, dedicated endpoint for security.
    const { rows } = await pool.query(
        'UPDATE staff SET first_name = $1, last_name = $2, email = $3, role = $4, is_active = $5 WHERE staff_id = $6 RETURNING *',
        [first_name, last_name, email, role, is_active, id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
    }

    res.status(200).json(sanitizeStaff(rows[0]));
};

// @desc    Delete a staff member
// @route   DELETE /api/v1/staff/:id
// @access  Private (Admin)
const deleteStaff = async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM staff WHERE staff_id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
    }

    res.status(200).json({ message: 'Staff member deleted successfully' });
};

export { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff };

