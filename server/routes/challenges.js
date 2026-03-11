const express = require('express');
const db = require('../../database/db');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get all challenges
router.get('/', (req, res) => {
    db.all(`SELECT id, title, category, difficulty, points, description, hint, is_enabled 
            FROM challenges WHERE is_enabled = 1`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(rows);
    });
});

// Get single challenge
router.get('/:id', (req, res) => {
    db.get(`SELECT id, title, category, difficulty, points, description, hint, is_enabled 
            FROM challenges WHERE id = ?`, [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Challenge not found' });
        res.json(row);
    });
});

// Submit flag
router.post('/:id/submit', (req, res) => {
    const { flag, user_id } = req.body;

    if (!flag || !user_id) {
        return res.status(400).json({ error: 'Flag and user ID required' });
    }

    // Check if already solved
    db.get(`SELECT * FROM solves WHERE user_id = ? AND challenge_id = ?`,
        [user_id, req.params.id], (err, existing) => {
            if (existing) return res.status(400).json({ error: 'Already solved!' });

            // Get challenge flag
            db.get(`SELECT * FROM challenges WHERE id = ?`, [req.params.id], (err, challenge) => {
                if (err || !challenge) return res.status(404).json({ error: 'Challenge not found' });

                const validFlag = bcrypt.compareSync(flag.trim(), challenge.flag_hash);

                if (!validFlag) return res.status(400).json({ error: 'Wrong flag! Try again.' });

                // Record solve
                db.run(`INSERT INTO solves (user_id, challenge_id, points_awarded) VALUES (?, ?, ?)`,
                    [user_id, challenge.id, challenge.points], function (err) {
                        if (err) return res.status(500).json({ error: 'Server error' });

                        // Update user points
                        db.run(`UPDATE users SET total_points = total_points + ? WHERE id = ?`,
                            [challenge.points, user_id], (err) => {
                                if (err) return res.status(500).json({ error: 'Server error' });
                                res.json({ 
                                    message: 'Correct flag!', 
                                    points: challenge.points 
                                });
                            });
                    });
            });
        });
});

module.exports = router;