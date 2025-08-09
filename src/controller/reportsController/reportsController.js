import pool from '../../database/connection.js';

export const getDailySalesSummary = async (req, res) => {
    const { restaurant_id, start_date, end_date } = req.query;

    if (!restaurant_id) {
        return res.status(400).json({ message: 'A restaurant_id query parameter is required.' });
    }

    const queryParts = ['SELECT * FROM daily_sales_summary WHERE restaurant_id = $1'];
    const values = [restaurant_id];
    let paramIndex = 2;

    if (start_date) {
        queryParts.push(`AND sale_date >= $${paramIndex++}`);
        values.push(start_date);
    }

    if (end_date) {
        queryParts.push(`AND sale_date <= $${paramIndex++}`);
        values.push(end_date);
    }

    const query = `${queryParts.join(' ')} ORDER BY sale_date DESC;`;

    try {
        const { rows } = await pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No sales data found for the given criteria.' });
        }
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching daily sales summary:', error);
        res.status(500).json({ message: 'Failed to fetch daily sales summary', error: error.message });
    }
};

