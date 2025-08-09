import pool from '../../database/connection.js';

// @desc    Create a new dining table
// @route   POST /api/v1/dining-tables
// @access  Private (Manager/Admin)
const createDiningTable = async (req, res) => {
    const { zone_id, table_number, capacity, status, position_x, position_y } = req.body;

    // --- Input Validation ---
    if (!zone_id || !table_number || !capacity) {
        return res.status(400).json({ message: 'zone_id, table_number, and capacity are required fields.' });
    }
    if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity <= 0) {
        return res.status(400).json({ message: 'Capacity must be a positive integer.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO dining_tables (zone_id, table_number, capacity, status, position_x, position_y) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [zone_id, table_number, capacity, status || 'available', position_x, position_y]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        // --- Specific Error Handling ---
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: `Table number "${table_number}" already exists in this zone.` });
        }
        if (error.code === '23503') { // foreign_key_violation
             return res.status(400).json({ message: 'The specified dining zone (zone_id) does not exist.' });
        }
        console.error(error); // Log unexpected errors
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get all dining tables, optionally filtered by zone
// @route   GET /api/v1/dining-tables?zone_id=<uuid>
// @access  Public/Private
const getAllDiningTables = async (req, res) => {
    const { zone_id } = req.query;
    let query = 'SELECT * FROM dining_tables';
    const params = [];

    if (zone_id) {
        query += ' WHERE zone_id = $1';
        params.push(zone_id);
    }

    query += ' ORDER BY table_number ASC';

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);
};

// @desc    Get a single dining table by ID
// @route   GET /api/v1/dining-tables/:id
// @access  Public/Private
const getDiningTableById = async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM dining_tables WHERE table_id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Dining table not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Update a dining table's details (partial updates)
// @route   PATCH /api/v1/dining-tables/:id
// @access  Private (Manager/Admin)
const updateDiningTable = async (req, res) => {
    const { id } = req.params;

    const { rows: currentRows } = await pool.query('SELECT * FROM dining_tables WHERE table_id = $1', [id]);
    if (currentRows.length === 0) {
        return res.status(404).json({ message: 'Dining table not found' });
    }

    // Merge existing data with new data from request body for a true PATCH experience
    const updatedData = { ...currentRows[0], ...req.body };
    const { zone_id, table_number, capacity, status, position_x, position_y } = updatedData;

    try {
        const { rows } = await pool.query(
            'UPDATE dining_tables SET zone_id = $1, table_number = $2, capacity = $3, status = $4, position_x = $5, position_y = $6 WHERE table_id = $7 RETURNING *',
            [zone_id, table_number, capacity, status, position_x, position_y, id]
        );
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: `Table number "${table_number}" already exists in this zone.` });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Delete a dining table
// @route   DELETE /api/v1/dining-tables/:id
// @access  Private (Manager/Admin)
const deleteDiningTable = async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM dining_tables WHERE table_id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ message: 'Dining table not found' });
    }

    // Use 204 No Content for successful deletions, as no body is returned.
    res.status(204).send();
};

export { createDiningTable, getAllDiningTables, getDiningTableById, updateDiningTable, deleteDiningTable };

