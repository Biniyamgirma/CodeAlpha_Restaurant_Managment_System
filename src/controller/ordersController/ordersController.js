import pool from '../../database/connection.js'
/**
 * Creates a new order in a transaction.
 * It calculates totals server-side to ensure data integrity.
 */
export const createOrder = async (req, res) => {
    const {
        restaurant_id,
        table_id,
        staff_id,
        order_type,
        discount_amount = 0,
        customer_notes,
        items // Expected: [{ menu_item_id, quantity, item_notes, modifiers: [{ modifier_option_id }] }]
    } = req.body;

    if (!restaurant_id || !order_type || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields for order creation.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // --- 1. Fetch all prices and restaurant data from pool ---
        const menuItemIds = items.map(item => item.menu_item_id).filter(Boolean);
        const modifierOptionIds = items.flatMap(item => item.modifiers?.map(mod => mod.modifier_option_id) || []).filter(Boolean);

        const menuItemsDataPromise = client.query('SELECT item_id, price FROM menu_items WHERE item_id = ANY($1::uuid[])', [menuItemIds]);
        const modifiersDataPromise = client.query('SELECT option_id, name, additional_price FROM modifier_options WHERE option_id = ANY($1::uuid[])', [modifierOptionIds]);
        const restaurantDataPromise = client.query('SELECT tax_rate, service_charge FROM restaurants WHERE restaurant_id = $1', [restaurant_id]);

        const [menuItemsResult, modifiersResult, restaurantResult] = await Promise.all([menuItemsDataPromise, modifiersDataPromise, restaurantDataPromise]);

        const menuItemsMap = new Map(menuItemsResult.rows.map(i => [i.item_id, i.price]));
        const modifiersMap = new Map(modifiersResult.rows.map(m => [m.option_id, { name: m.name, additional_price: m.additional_price }]));
        const restaurant = restaurantResult.rows[0];

        if (!restaurant) {
            throw new Error('Restaurant not found');
        }

        // --- 2. Calculate totals ---
        let subtotal = 0;
        for (const item of items) {
            const itemPrice = menuItemsMap.get(item.menu_item_id);
            if (itemPrice === undefined) throw new Error(`Menu item ${item.menu_item_id} not found.`);
            
            let itemSubtotal = parseFloat(itemPrice) * item.quantity;
            
            if (item.modifiers) {
                for (const mod of item.modifiers) {
                    // Skip if modifier is null or has no ID, making the API more robust.
                    if (!mod || !mod.modifier_option_id) continue;

                    const modifierPrice = modifiersMap.get(mod.modifier_option_id)?.additional_price;
                    if (modifierPrice === undefined) throw new Error(`Modifier option '${mod.modifier_option_id}' not found or is invalid.`);
                    itemSubtotal += parseFloat(modifierPrice);
                }
            }
            subtotal += itemSubtotal;
        }

        const tax_amount = subtotal * (restaurant.tax_rate / 100);
        const service_charge = subtotal * (restaurant.service_charge / 100);
        const total_amount = subtotal + tax_amount + service_charge - discount_amount;

        // --- 3. Insert Order ---
        const orderQuery = `
            INSERT INTO orders (restaurant_id, table_id, staff_id, order_type, subtotal, tax_amount, service_charge, discount_amount, total_amount, customer_notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const orderValues = [restaurant_id, table_id, staff_id, order_type, subtotal, tax_amount, service_charge, discount_amount, total_amount, customer_notes];
        const orderResult = await client.query(orderQuery, orderValues);
        const newOrder = orderResult.rows[0];

        // --- 4. Insert Order Items and Modifiers ---
        newOrder.items = [];
        for (const item of items) {
            const unit_price = menuItemsMap.get(item.menu_item_id);
            const orderItemQuery = `
                INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, item_notes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const orderItemValues = [newOrder.order_id, item.menu_item_id, item.quantity, unit_price, item.item_notes];
            const orderItemResult = await client.query(orderItemQuery, orderItemValues);
            const newOrderItem = orderItemResult.rows[0];
            newOrderItem.modifiers = [];

            if (item.modifiers) {
                for (const mod of item.modifiers) {
                    // Also skip invalid modifiers here to prevent crashes.
                    if (!mod || !mod.modifier_option_id) continue;

                    const modifierData = modifiersMap.get(mod.modifier_option_id);
                    // This should be caught by the calculation loop, but as a safeguard:
                    if (!modifierData) continue;

                    const modifierQuery = `
                        INSERT INTO order_item_modifiers (order_item_id, modifier_option_id, name, additional_price)
                        VALUES ($1, $2, $3, $4)
                        RETURNING *;
                    `;
                    const modifierValues = [newOrderItem.order_item_id, mod.modifier_option_id, modifierData.name, modifierData.additional_price];
                    const modifierResult = await client.query(modifierQuery, modifierValues);
                    newOrderItem.modifiers.push(modifierResult.rows[0]);
                }
            }
            newOrder.items.push(newOrderItem);
        }

        await client.query('COMMIT');
        res.status(201).json(newOrder);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    } finally {
        client.release();
    }
};

/**
 * Retrieves all orders, with optional filtering by status.
 */
export const getAllOrders = async (req, res) => {
    const { status, restaurant_id } = req.query;
    let query = 'SELECT * FROM orders';
    const values = [];

    if (restaurant_id) {
        query += ' WHERE restaurant_id = $1';
        values.push(restaurant_id);
        if (status) {
            query += ' AND status = $2';
            values.push(status);
        }
    } else if (status) {
        query += ' WHERE status = $1';
        values.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
};

/**
 * Retrieves a single order by its ID, including all items and modifiers.
 */
export const getOrderById = async (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT
            o.*,
            (
                SELECT json_agg(oi_details)
                FROM (
                    SELECT
                        oi.*,
                        (
                            SELECT json_agg(oim)
                            FROM order_item_modifiers oim
                            WHERE oim.order_item_id = oi.order_item_id
                        ) AS modifiers
                    FROM order_items oi
                    WHERE oi.order_id = o.order_id
                ) AS oi_details
            ) AS items
        FROM orders o
        WHERE o.order_id = $1;
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(rows[0]);
};

/**
 * Updates an order's status or other details.
 */
export const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    // Build query dynamically based on provided fields
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (status) {
        fields.push(`status = $${paramCount++}`);
        values.push(status);
    }
    if (payment_status) {
        fields.push(`payment_status = $${paramCount++}`);
        values.push(payment_status);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update provided.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE orders SET ${fields.join(', ')} WHERE order_id = $${paramCount} RETURNING *`;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(rows[0]);
};

/**
 * Updates the status of a specific item within an order.
 * This is useful for kitchen display systems or waiter apps.
 * e.g., 'pending' -> 'preparing' -> 'ready' -> 'served'
 */
export const updateOrderItemStatus = async (req, res) => {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    // Validate the status against the allowed enum values from your schema
    const allowedStatuses = ['pending', 'preparing', 'ready', 'served', 'canceled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const query = `
        UPDATE order_items
        SET status = $1, completed_at = CASE WHEN $1 = 'served' THEN NOW() ELSE completed_at END
        WHERE order_item_id = $2 AND order_id = $3
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, itemId, orderId]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Order item not found in the specified order.' });
    }

    res.status(200).json(rows[0]);
};
