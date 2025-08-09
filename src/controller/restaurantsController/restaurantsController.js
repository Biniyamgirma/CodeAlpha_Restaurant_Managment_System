import { parse } from 'dotenv';
import pool from '../../database/connection.js';

// @desc    Create a new restaurant
// @route   POST /api/restaurants
// @access  Private 
const createRestaurant = async (req, res) => {
    const { name, address, contact_info, operating_hours, tax_rate, service_charge } = req.body;

    if (!name || !address || !contact_info || !operating_hours) {
        return res.status(400).json({ message: 'Please provide all required fields: name, address, contact_info, operating_hours' });
    }
    
    // The 'pg' driver automatically handles serializing JS objects to JSONB
    const { rows } = await pool.query(
        'INSERT INTO restaurants (name, address, contact_info, operating_hours, tax_rate, service_charge) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, address, contact_info, operating_hours, tax_rate, service_charge]
    );

    res.status(201).json(rows[0]);
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM restaurants ORDER BY created_at DESC');
    res.status(200).json(rows);
};

// @desc    Get a single restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM restaurants WHERE restaurant_id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Update a restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (should be protected)
const updateRestaurant = async (req, res) => {
    const { id } = req.params;
    const { name, address, contact_info, operating_hours, tax_rate, service_charge } = req.body;

    // For a PUT request, we expect all fields. For PATCH, you would build the query dynamically.
    const { rows } = await pool.query(
        'UPDATE restaurants SET name = $1, address = $2, contact_info = $3, operating_hours = $4, tax_rate = $5, service_charge = $6, updated_at = NOW() WHERE restaurant_id = $7 RETURNING *',
        [name, address, contact_info, operating_hours, tax_rate, service_charge, id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Delete a restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private 
const deleteRestaurant = async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM restaurants WHERE restaurant_id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json({ message: 'Restaurant deleted successfully' });
};

export {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant
};