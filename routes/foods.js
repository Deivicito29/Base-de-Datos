const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Get all foods with filters
router.get('/', async (req, res) => {
    try {
        const { search, category_id, maxCalories, sortBy } = req.query;
        let query = 'SELECT * FROM foods WHERE 1=1';
        const values = [];
        let valueIndex = 1;

        if (search) {
            query += ` AND name ILIKE $${valueIndex}`;
            values.push(`%${search}%`);
            valueIndex++;
        }

        if (category_id && category_id !== 'todos') {
            query += ` AND category_id = $${valueIndex}`;
            values.push(category_id);
            valueIndex++;
        }

        if (maxCalories) {
            query += ` AND calories <= $${valueIndex}`;
            values.push(maxCalories);
            valueIndex++;
        }

        switch (sortBy) {
            case 'nombre':
                query += ' ORDER BY name';
                break;
            case 'calorias':
                query += ' ORDER BY calories';
                break;
            case 'proteinas':
                query += ' ORDER BY protein';
                break;
            default:
                query += ' ORDER BY name';
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener alimentos:', error);
        res.status(500).json({ error: 'Error al obtener alimentos' });
    }
});

// Get specific food
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM foods WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Alimento no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el alimento:', error);
        res.status(500).json({ error: 'Error al obtener el alimento' });
    }
});

module.exports = router;