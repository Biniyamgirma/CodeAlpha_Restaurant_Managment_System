import pool from '../../database/connection.js'
// @desc    Create a new modifier group
// @route   POST /api/v1/modifiers
// @access  public for know
const createModifier = async (req, res) => {
    const { restaurant_id, name, is_required, min_selections, max_selections } = req.body;
    if (!restaurant_id || !name) {
        return res.status(400).json({ message: 'restaurant_id and name are required.' });
    }
    const { rows } = await pool.query(
        'INSERT INTO modifiers (restaurant_id, name, is_required, min_selections, max_selections) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [restaurant_id, name, is_required, min_selections, max_selections]
    );
    res.status(201).json(rows[0]);
};

// @desc    Get all modifiers for a restaurant
// @route   GET /api/v1/modifiers?restaurant_id=<uuid>
const getAllModifiers = async (req, res) => {
    const { restaurant_id } = req.query;
    if (!restaurant_id) {
        return res.status(400).json({ message: 'A restaurant_id query parameter is required.' });
    }
    const { rows } = await pool.query('SELECT * FROM modifiers WHERE restaurant_id = $1 ORDER BY name', [restaurant_id]);
    res.status(200).json(rows);
};

// @desc    Get a single modifier by ID
// @route   GET /api/v1/modifiers/:id
const getModifierById = async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM modifiers WHERE modifier_id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Modifier not found' });
    res.status(200).json(rows[0]);
};

// @desc    Update a modifier
// @route   PATCH /api/v1/modifiers/:id
const updateModifier = async (req, res) => {
    const { id } = req.params;
    const { rows: current } = await pool.query('SELECT * FROM modifiers WHERE modifier_id = $1', [id]);
    if (current.length === 0) return res.status(404).json({ message: 'Modifier not found' });

    const updatedData = { ...current[0], ...req.body };
    const { name, is_required, min_selections, max_selections } = updatedData;

    const { rows } = await pool.query(
        'UPDATE modifiers SET name = $1, is_required = $2, min_selections = $3, max_selections = $4 WHERE modifier_id = $5 RETURNING *',
        [name, is_required, min_selections, max_selections, id]
    );
    res.status(200).json(rows[0]);
};

// @desc    Delete a modifier
// @route   DELETE /api/v1/modifiers/:id
const deleteModifier = async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM modifiers WHERE modifier_id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Modifier not found' });
    res.status(204).send();
};

// --- Modifier Option CRUD (Nested) ---

// @desc    Create a new option for a modifier
// @route   POST /api/v1/modifiers/:modifierId/options
const createModifierOption = async (req, res) => {
    const { modifierId } = req.params;
    const { name, additional_price } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });

    const { rows } = await pool.query(
        'INSERT INTO modifier_options (modifier_id, name, additional_price) VALUES ($1, $2, $3) RETURNING *',
        [modifierId, name, additional_price || 0]
    );
    res.status(201).json(rows[0]);
};

// @desc    Get all options for a modifier
// @route   GET /api/v1/modifiers/:modifierId/options
const getAllModifierOptions = async (req, res) => {
    const { modifierId } = req.params;
    const { rows } = await pool.query('SELECT * FROM modifier_options WHERE modifier_id = $1 ORDER BY name', [modifierId]);
    res.status(200).json(rows);
};

// @desc    Update a modifier option
// @route   PATCH /api/v1/modifiers/:modifierId/options/:optionId
const updateModifierOption = async (req, res) => {
    const { optionId } = req.params;
    const { name, additional_price } = req.body;

    const { rows } = await pool.query(
        'UPDATE modifier_options SET name = $1, additional_price = $2 WHERE option_id = $3 RETURNING *',
        [name, additional_price, optionId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Modifier option not found' });
    res.status(200).json(rows[0]);
};

// @desc    Delete a modifier option
// @route   DELETE /api/v1/modifiers/:modifierId/options/:optionId
const deleteModifierOption = async (req, res) => {
    const { optionId } = req.params;
    const { rowCount } = await pool.query('DELETE FROM modifier_options WHERE option_id = $1', [optionId]);
    if (rowCount === 0) return res.status(404).json({ message: 'Modifier option not found' });
    res.status(204).send();
};

export {
    createModifier, getAllModifiers, getModifierById, updateModifier, deleteModifier,
    createModifierOption, getAllModifierOptions, updateModifierOption, deleteModifierOption
};

