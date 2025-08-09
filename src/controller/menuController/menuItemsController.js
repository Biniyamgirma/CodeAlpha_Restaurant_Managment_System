import pool from '../../database/connection.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new menu item
// @route   POST /api/v1/menu-items
// @access  Private (Manager/Admin)
const createMenuItem = async (req, res) => {
    const { category_id, name, description, price, cost, preparation_time, is_available, is_vegetarian, is_gluten_free } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!category_id || !name || !price || !cost || !preparation_time) {
        return res.status(400).json({ message: 'category_id, name, price, cost, and preparation_time are required.' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO menu_items (category_id, name, description, price, cost, preparation_time, is_available, is_vegetarian, is_gluten_free, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [category_id, name, description, price, cost, preparation_time, is_available, is_vegetarian, is_gluten_free, image_url]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') { 
            return res.status(400).json({ message: 'The specified menu category (category_id) does not exist.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get all menu items, optionally filtered by category
// @route   GET /api/v1/menu-items?category_id=<uuid>
// @access  Public
const getAllMenuItems = async (req, res) => {
    const { category_id } = req.query;
    let query = 'SELECT * FROM menu_items';
    const params = [];

    if (category_id) {
        query += ' WHERE category_id = $1';
        params.push(category_id);
    }

    query += ' ORDER BY name ASC';

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);
};

// @desc    Get a single menu item by ID
// @route   GET /api/v1/menu-items/:id
// @access  Public
const getMenuItemById = async (req, res) => {
    const { id } = req.params;
    if(!id){
        res.status(400).json({ message: 'id is required.' });
        return;
    }
    const { rows } = await pool.query('SELECT * FROM menu_items WHERE item_id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json(rows[0]);
};

// @desc    Update a menu item
// @route   PATCH /api/v1/menu-items/:id
// @access  Private (Manager/Admin)
const updateMenuItem = async (req, res) => {
    const { id } = req.params;

    const { rows: currentRows } = await pool.query('SELECT * FROM menu_items WHERE item_id = $1', [id]);
    if (currentRows.length === 0) {
        return res.status(404).json({ message: 'Menu item not found' });
    }

    const currentItem = currentRows[0];
    const updatedData = { ...currentItem, ...req.body };

    if (req.file) {
        updatedData.image_url = req.file.filename;
        if (currentItem.image_url) {
            const oldImagePath = path.join(__dirname, '../uploads', currentItem.image_url);
            fs.unlink(oldImagePath).catch(err => console.error(`Failed to delete old image: ${err.message}`));
        }
    }

    const { category_id, name, description, price, cost, preparation_time, is_available, is_vegetarian, is_gluten_free, image_url } = updatedData;

    const { rows } = await pool.query(
        `UPDATE menu_items SET category_id = $1, name = $2, description = $3, price = $4, cost = $5, preparation_time = $6, is_available = $7, is_vegetarian = $8, is_gluten_free = $9, image_url = $10, updated_at = NOW()
         WHERE item_id = $11 RETURNING *`,
        [category_id, name, description, price, cost, preparation_time, is_available, is_vegetarian, is_gluten_free, image_url, id]
    );

    res.status(200).json(rows[0]);
};

// @desc    Delete a menu item
// @route   DELETE /api/v1/menu-items/:id
// @access  Private (Manager/Admin)
const deleteMenuItem = async (req, res) => {
    const { id } = req.params;

    // First, get the image_url to delete the file later
    const { rows } = await pool.query('SELECT image_url FROM menu_items WHERE item_id = $1', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'Menu item not found' });
    }
    const imageUrl = rows[0].image_url;

    // Delete the database record
    await pool.query('DELETE FROM menu_items WHERE item_id = $1', [id]);

    // If an image was associated, delete it from the filesystem
    if (imageUrl) {
        const imagePath = path.join(__dirname, '../uploads', imageUrl);
        await fs.unlink(imagePath).catch(err => console.error(`Failed to delete image file: ${err.message}`));
    }

    res.status(204).send();
};

// --- Menu Item Modifier Associations ---

// @desc    Associate a modifier with a menu item
// @route   POST /api/v1/menu-items/:itemId/modifiers
const addModifierToItem = async (req, res) => {
    const { itemId } = req.params;
    const { modifier_id } = req.body;

    if (!modifier_id) {
        return res.status(400).json({ message: 'modifier_id is required.' });
    }

    const { rows } = await pool.query(
        'INSERT INTO menu_item_modifiers (item_id, modifier_id) VALUES ($1, $2) RETURNING *',
        [itemId, modifier_id]
    );
    res.status(201).json(rows[0]);
};

// @desc    Remove a modifier from a menu item
// @route   DELETE /api/v1/menu-items/:itemId/modifiers/:modifierId
const removeModifierFromItem = async (req, res) => {
    const { itemId, modifierId } = req.params;
    await pool.query('DELETE FROM menu_item_modifiers WHERE item_id = $1 AND modifier_id = $2', [itemId, modifierId]);
    res.status(204).send();
};

export { createMenuItem, getAllMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem, addModifierToItem, removeModifierFromItem };

