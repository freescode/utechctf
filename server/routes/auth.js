const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
        [username, email, password_hash],
        function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }
            res.json({ message: 'Account created successfully!' });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'utechctfsecret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                total_points: user.total_points
            }
        });
    });
});

module.exports = router;