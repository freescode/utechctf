const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');

const router = express.Router();

// Middleware to verify admin
function isAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'utechctfsecret');
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// Get stats
router.get('/stats', isAdmin, (req, res) => {
    db.get(`SELECT 
        (SELECT COUNT(*) FROM challenges) as totalChallenges,
        (SELECT COUNT(*) FROM challenges WHERE is_enabled=1) as enabledChallenges,
        (SELECT COUNT(*) FROM users WHERE role='user') as totalUsers,
        (SELECT COUNT(*) FROM solves) as totalSolves
    `, (err, row) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(row);
    });
});

// Get all challenges (admin)
router.get('/challenges', isAdmin, (req, res) => {
    db.all(`SELECT * FROM challenges ORDER BY difficulty, category`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(rows);
    });
});

// Get single challenge (admin)
router.get('/challenges/:id', isAdmin, (req, res) => {
    db.get(`SELECT * FROM challenges WHERE id=?`, [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

// Add challenge
router.post('/challenges', isAdmin, (req, res) => {
    const { title, category, difficulty, points, flag, description, hint } = req.body;
    if (!title || !flag) return res.status(400).json({ error: 'Title and flag required' });
    const flag_hash = bcrypt.hashSync(flag, 10);
    db.run(`INSERT INTO challenges (title, category, difficulty, points, description, flag_hash, hint)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, category, difficulty, points, description, flag_hash, hint],
        function(err) {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Challenge added!' });
        });
});

// Edit challenge
router.put('/challenges/:id', isAdmin, (req, res) => {
    const { title, category, difficulty, points, flag, description, hint } = req.body;
    if (flag && flag.trim() !== '') {
        const flag_hash = bcrypt.hashSync(flag, 10);
        db.run(`UPDATE challenges SET title=?, category=?, difficulty=?, points=?, 
                description=?, flag_hash=?, hint=? WHERE id=?`,
            [title, category, difficulty, points, description, flag_hash, hint, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: 'Server error' });
                res.json({ message: 'Challenge updated!' });
            });
    } else {
        db.run(`UPDATE challenges SET title=?, category=?, difficulty=?, points=?, 
                description=?, hint=? WHERE id=?`,
            [title, category, difficulty, points, description, hint, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: 'Server error' });
                res.json({ message: 'Challenge updated!' });
            });
    }
});

// Toggle enable/disable
router.put('/challenges/:id/toggle', isAdmin, (req, res) => {
    db.run(`UPDATE challenges SET is_enabled = CASE WHEN is_enabled=1 THEN 0 ELSE 1 END WHERE id=?`,
        [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Challenge toggled!' });
        });
});

// Delete challenge
router.delete('/challenges/:id', isAdmin, (req, res) => {
    db.run(`DELETE FROM challenges WHERE id=?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json({ message: 'Challenge deleted!' });
    });
});

// Reset scoreboard
router.post('/reset', isAdmin, (req, res) => {
    db.run(`DELETE FROM solves`, (err) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        db.run(`UPDATE users SET total_points=0`, (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Scoreboard reset successfully!' });
        });
    });
});

module.exports = router;