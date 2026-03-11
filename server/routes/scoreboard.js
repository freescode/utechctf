const express = require('express');
const db = require('../../database/db');

const router = express.Router();

router.get('/', (req, res) => {
    db.all(`
        SELECT u.username, u.total_points,
        COUNT(s.id) as solve_count
        FROM users u
        LEFT JOIN solves s ON u.id = s.user_id
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY u.total_points DESC
        LIMIT 50
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(rows);
    });
});

module.exports = router;