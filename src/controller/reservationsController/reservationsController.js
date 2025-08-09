import pool from '../../database/connection.js';

/**
 * Creates a new reservation.
 */
export const createReservation = async (req, res) => {
    const {
        restaurant_id,
        table_id,
        customer_name,
        contact_phone,
        contact_email,
        party_size,
        reservation_time,
        duration = 90,
        status = 'confirmed',
        special_requests
    } = req.body;

    if (!restaurant_id || !customer_name || !contact_phone || !party_size || !reservation_time) {
        return res.status(400).json({ message: 'Missing required fields for reservation.' });
    }

    const query = `
        INSERT INTO reservations (restaurant_id, table_id, customer_name, contact_phone, contact_email, party_size, reservation_time, duration, status, special_requests)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
    `;
    const values = [restaurant_id, table_id, customer_name, contact_phone, contact_email, party_size, reservation_time, duration, status, special_requests];

    try {
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ message: 'Failed to create reservation', error: error.message });
    }
};

/**
 * Retrieves all reservations, with optional filtering.
 * Filters can include restaurant_id, date, status.
 */
export const getAllReservations = async (req, res) => {
    const { restaurant_id, date, status } = req.query;
    let query = 'SELECT * FROM reservations';
    const values = [];
    const conditions = [];
    let paramCount = 1;

    if (restaurant_id) {
        conditions.push(`restaurant_id = $${paramCount++}`);
        values.push(restaurant_id);
    }
    if (status) {
        conditions.push(`status = $${paramCount++}`);
        values.push(status);
    }
    if (date) {
        // Filter for a specific day
        conditions.push(`DATE(reservation_time) = $${paramCount++}`);
        values.push(date);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY reservation_time DESC';

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
};

/**
 * Retrieves a single reservation by its ID.
 */
export const getReservationById = async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM reservations WHERE reservation_id = $1';

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json(rows[0]);
};

/**
 * Updates a reservation's details (e.g., status, time).
 */
export const updateReservation = async (req, res) => {
    const { id } = req.params;
    const { table_id, customer_name, contact_phone, contact_email, party_size, reservation_time, duration, status, special_requests } = req.body;

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (table_id !== undefined) { fields.push(`table_id = $${paramCount++}`); values.push(table_id); }
    if (customer_name) { fields.push(`customer_name = $${paramCount++}`); values.push(customer_name); }
    if (contact_phone) { fields.push(`contact_phone = $${paramCount++}`); values.push(contact_phone); }
    if (contact_email) { fields.push(`contact_email = $${paramCount++}`); values.push(contact_email); }
    if (party_size) { fields.push(`party_size = $${paramCount++}`); values.push(party_size); }
    if (reservation_time) { fields.push(`reservation_time = $${paramCount++}`); values.push(reservation_time); }
    if (duration) { fields.push(`duration = $${paramCount++}`); values.push(duration); }
    if (status) { fields.push(`status = $${paramCount++}`); values.push(status); }
    if (special_requests !== undefined) { fields.push(`special_requests = $${paramCount++}`); values.push(special_requests); }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update provided.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE reservations SET ${fields.join(', ')} WHERE reservation_id = $${paramCount} RETURNING *`;

    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json(rows[0]);
};

/**
 * Deletes a reservation.
 */
export const deleteReservation = async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM reservations WHERE reservation_id = $1 RETURNING *';

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json({ message: 'Reservation deleted successfully', reservation: rows[0] });
};

