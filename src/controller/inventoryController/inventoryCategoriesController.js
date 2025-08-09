import pool from '../../database/connection.js';

// @desc    Create a new inventory category
// @route   POST /api/v1/inventory-categories
// @access  Private (Manager/Admin)
const createInventoryCategory = async (req, res) => {
    const { restaurant_id, name } = req.body;

    if (!restaurant_id || !name) {
        return res.status(400).json({ message: 'restaurant_id and name are required fields.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO inventory_categories (restaurant_id, name) VALUES ($1, $2) RETURNING *',
            [restaurant_id, name]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: `An inventory category named "${name}" already exists for this restaurant.` });
        }
        if (error.code === '23503') { // foreign_key_violation
            return res.status(400).json({ message: 'The specified restaurant (restaurant_id) does not exist.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get all inventory categories for a restaurant
// @route   GET /api/v1/inventory-categories?restaurant_id=<uuid>
// @access  Public/Private
const getAllInventoryCategories = async (req, res) => {
    const { restaurant_id } = req.query;

    if (!restaurant_id) {
        return res.status(400).json({ message: 'A restaurant_id query parameter is required.' });
    }

    const { rows } = await pool.query(
        'SELECT * FROM inventory_categories WHERE restaurant_id = $1 ORDER BY name ASC',
        [restaurant_id]
    );
    res.status(200).json(rows);
};

// @desc    Get a single inventory category by ID
// @route   GET /api/v1/inventory-categories/:id
// @access  Public/Private
const getInventoryCategoryById = async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM inventory_categories WHERE category_id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Inventory category not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Update an inventory category
// @route   PATCH /api/v1/inventory-categories/:id
// @access  Private (Manager/Admin)
const updateInventoryCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is a required field.' });
    }

    const { rows } = await pool.query(
        'UPDATE inventory_categories SET name = $1 WHERE category_id = $2 RETURNING *',
        [name, id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Inventory category not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Delete an inventory category
// @route   DELETE /api/v1/inventory-categories/:id
// @access  Private (Manager/Admin)
const deleteInventoryCategory = async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM inventory_categories WHERE category_id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ message: 'Inventory category not found' });
    }

    res.status(204).send();
};

export {
    createInventoryCategory,
    getAllInventoryCategories,
    getInventoryCategoryById,
    updateInventoryCategory,
    deleteInventoryCategory,
};
