import poop from '../../database/connection';

// Create a new inventory category
export const createInventoryCategory = async (req, res) => {
    const { restaurant_id, name } = req.body;
    if (!restaurant_id || !name) {
        return res.status(400).json({ error: 'Restaurant ID and name are required.' });
    }
    const query = 'INSERT INTO inventory_categories (restaurant_id, name) VALUES ($1, $2) RETURNING *';
    const values = [restaurant_id, name];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
};

// Get all inventory categories for a restaurant
export const getAllInventoryCategories = async (req, res) => {
    const { restaurant_id } = req.query;
    if (!restaurant_id) {
        return res.status(400).json({ error: 'Restaurant ID is required as a query parameter.' });
    }
    const query = 'SELECT * FROM inventory_categories WHERE restaurant_id = $1 ORDER BY name';
    const { rows } = await db.query(query, [restaurant_id]);
    res.status(200).json(rows);
};

// Get a single inventory category by ID
export const getInventoryCategoryById = async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM inventory_categories WHERE category_id = $1';
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Inventory category not found.' });
    }
    res.status(200).json(rows[0]);
};

// Update an inventory category
export const updateInventoryCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required.' });
    }
    const query = 'UPDATE inventory_categories SET name = $1 WHERE category_id = $2 RETURNING *';
    const { rows } = await db.query(query, [name, id]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Inventory category not found.' });
    }
    res.status(200).json(rows[0]);
};

// Delete an inventory category
export const deleteInventoryCategory
