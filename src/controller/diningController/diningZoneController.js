import pool from '../../database/connection.js';

// @desc    Create a new dining zone
// @route   POST /api/v1/dining-zones
// @access  Private (Manager/Admin)
const createDiningZone = async (req, res) => {
    const { restaurant_id, name, description } = req.body;

    if (!restaurant_id || !name) {
        return res.status(400).json({ message: 'Please provide restaurant_id and name' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO dining_zones (restaurant_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [restaurant_id, name, description]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'A dining zone with this name already exists for this restaurant.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Get all dining zones for a restaurant
// @route   GET /api/v1/dining-zones?restaurant_id=<uuid>
// @access  Public/Private
const getAllDiningZones = async (req, res) => {
    const { restaurant_id } = req.query;

    if (!restaurant_id) {
        return res.status(400).json({ message: 'A restaurant_id query parameter is required.' });
    }

    const { rows } = await pool.query('SELECT * FROM dining_zones WHERE restaurant_id = $1 ORDER BY name', [restaurant_id]);
    res.status(200).json(rows);
};

// @desc    Get a single dining zone by ID
// @route   GET /api/v1/dining-zones/:id
// @access  Public/Private
const getDiningZoneById = async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM dining_zones WHERE zone_id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Dining zone not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Update a dining zone
// @route   PUT /api/v1/dining-zones/:id
// @access  Private (Manager/Admin)
const updateDiningZone = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const { rows } = await pool.query(
        'UPDATE dining_zones SET name = $1, description = $2 WHERE zone_id = $3 RETURNING *',
        [name, description, id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Dining zone not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Delete a dining zone
// @route   DELETE /api/v1/dining-zones/:id
// @access  Private (Manager/Admin)
const deleteDiningZone = async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM dining_zones WHERE zone_id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ message: 'Dining zone not found' });
    }

    res.status(200).json({ message: 'Dining zone deleted successfully' });
};

export {
    createDiningZone,
    getAllDiningZones,
    getDiningZoneById,
    updateDiningZone,
    deleteDiningZone
};

