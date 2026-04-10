/*
process.on('uncaughtException', (err) => {
    console.error('CRASH ERROR:', err);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./server/routes/auth');
console.log('Auth routes loaded');
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'UTech CTF Server is running!' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
*/
process.on('uncaughtException', (err) => {
    console.error('CRASH ERROR:', err);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from /public (so /pages/login.html works)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./server/routes/auth');
const challengeRoutes = require('./server/routes/challenges');
const scoreboardRoutes = require('./server/routes/scoreboard');
const adminRoutes = require('./server/routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/test', (req, res) => {
    res.json({ message: 'UTech CTF Server is running!' });
});

// Optional: neat shortcuts for pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

app.get('/challenges', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/challenges.html'));
});

// Catch‑all 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});