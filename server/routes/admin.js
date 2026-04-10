const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../database/db');

const router = express.Router();

// ── Ensure uploads folder exists ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        // challenge_<id>_<originalname> — keeps it traceable
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `challenge_${req.params.id}_${safeName}`);
    }
});

const ALLOWED_TYPES = ['.zip', '.pdf', '.txt', '.pcap', '.png', '.jpg'];

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_TYPES.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`));
        }
    }
});

// ── Admin auth middleware ──────────────────────────────────────────────────────
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

// ── Stats ─────────────────────────────────────────────────────────────────────
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

// ── Get all challenges (admin view) ──────────────────────────────────────────
router.get('/challenges', isAdmin, (req, res) => {
    db.all(`SELECT * FROM challenges ORDER BY difficulty, category`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Server error' });

        // Attach file info to each challenge
        const enriched = rows.map(c => {
            const files = fs.readdirSync(UPLOAD_DIR)
                .filter(f => f.startsWith(`challenge_${c.id}_`))
                .map(f => f.replace(`challenge_${c.id}_`, ''));
            return { ...c, files };
        });

        res.json(enriched);
    });
});

// ── Get single challenge (admin view) ────────────────────────────────────────
router.get('/challenges/:id', isAdmin, (req, res) => {
    db.get(`SELECT * FROM challenges WHERE id=?`, [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Not found' });

        const files = fs.readdirSync(UPLOAD_DIR)
            .filter(f => f.startsWith(`challenge_${req.params.id}_`))
            .map(f => f.replace(`challenge_${req.params.id}_`, ''));

        res.json({ ...row, files });
    });
});

// ── Add challenge ─────────────────────────────────────────────────────────────
router.post('/challenges', isAdmin, (req, res) => {
    const { title, category, difficulty, points, flag, description, hint } = req.body;
    if (!title || !flag) return res.status(400).json({ error: 'Title and flag required' });
    const flag_hash = bcrypt.hashSync(flag, 10);
    db.run(
        `INSERT INTO challenges (title, category, difficulty, points, description, flag_hash, hint)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, category, difficulty, points, description, flag_hash, hint],
        function (err) {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Challenge added!', id: this.lastID });
        }
    );
});

// ── Edit challenge ────────────────────────────────────────────────────────────
router.put('/challenges/:id', isAdmin, (req, res) => {
    const { title, category, difficulty, points, flag, description, hint } = req.body;
    if (flag && flag.trim() !== '') {
        const flag_hash = bcrypt.hashSync(flag, 10);
        db.run(
            `UPDATE challenges SET title=?, category=?, difficulty=?, points=?,
             description=?, flag_hash=?, hint=? WHERE id=?`,
            [title, category, difficulty, points, description, flag_hash, hint, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: 'Server error' });
                res.json({ message: 'Challenge updated!' });
            }
        );
    } else {
        db.run(
            `UPDATE challenges SET title=?, category=?, difficulty=?, points=?,
             description=?, hint=? WHERE id=?`,
            [title, category, difficulty, points, description, hint, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: 'Server error' });
                res.json({ message: 'Challenge updated!' });
            }
        );
    }
});

// ── Upload file for a challenge ───────────────────────────────────────────────
router.post('/challenges/:id/upload', isAdmin, (req, res) => {
    // Verify challenge exists first
    db.get(`SELECT id FROM challenges WHERE id=?`, [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Challenge not found' });

        upload.single('file')(req, res, (uploadErr) => {
            if (uploadErr) return res.status(400).json({ error: uploadErr.message });
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
            res.json({ message: 'File uploaded successfully!', filename: req.file.originalname });
        });
    });
});

// ── Download file for a challenge ─────────────────────────────────────────────
router.get('/challenges/:id/download/:filename', isAdmin, (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(UPLOAD_DIR, `challenge_${req.params.id}_${safeName}`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, req.params.filename);
});

// ── Delete file for a challenge ───────────────────────────────────────────────
router.delete('/challenges/:id/files/:filename', isAdmin, (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(UPLOAD_DIR, `challenge_${req.params.id}_${safeName}`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted!' });
});

// ── Toggle enable/disable ─────────────────────────────────────────────────────
router.put('/challenges/:id/toggle', isAdmin, (req, res) => {
    db.run(
        `UPDATE challenges SET is_enabled = CASE WHEN is_enabled=1 THEN 0 ELSE 1 END WHERE id=?`,
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Challenge toggled!' });
        }
    );
});

// ── Delete challenge ──────────────────────────────────────────────────────────
router.delete('/challenges/:id', isAdmin, (req, res) => {
    // Also delete any uploaded files for this challenge
    const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(`challenge_${req.params.id}_`));
    files.forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f)));

    db.run(`DELETE FROM challenges WHERE id=?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json({ message: 'Challenge deleted!' });
    });
});

// ── Reset scoreboard ──────────────────────────────────────────────────────────
router.post('/reset', isAdmin, (req, res) => {
    db.run(`DELETE FROM solves`, (err) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        db.run(`UPDATE users SET total_points=0`, (err2) => {
            if (err2) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Scoreboard reset successfully!' });
        });
    });
});

// ════════════════════════════════════════════════════════════════════════════
// ══  USER MANAGEMENT ROUTES  ════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════

// ── Get all users with solve counts and last active ───────────────────────────
router.get('/users', isAdmin, (req, res) => {
    db.all(`
        SELECT
            u.id,
            u.username,
            u.email,
            u.total_points,
            u.role,
            u.created_at,
            COUNT(s.id)      AS solve_count,
            MAX(s.solved_at) AS last_solve
        FROM users u
        LEFT JOIN solves s ON s.user_id = u.id
        WHERE u.role != 'admin'
        GROUP BY u.id
        ORDER BY u.total_points DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Server error', details: err.message });
        }
        console.log(`Admin fetched users: ${rows.length} found`);
        res.json(rows);
    });
});

// ── Get single user profile with full solve history ───────────────────────────
router.get('/users/:id', isAdmin, (req, res) => {
    db.get(
        `SELECT id, username, total_points, created_at FROM users WHERE id = ?`,
        [req.params.id],
        (err, user) => {
            if (err)   return res.status(500).json({ error: 'Server error' });
            if (!user) return res.status(404).json({ error: 'User not found' });

            // Fetch all solves for this user, joined with challenge details
            db.all(`
                SELECT
                    c.title,
                    c.category,
                    c.difficulty,
                    c.points,
                    s.solved_at
                FROM solves s
                JOIN challenges c ON c.id = s.challenge_id
                WHERE s.user_id = ?
                ORDER BY s.solved_at ASC
            `, [req.params.id], (err2, solves) => {
                if (err2) return res.status(500).json({ error: 'Server error' });
                res.json({ ...user, solves: solves || [] });
            });
        }
    );
});

module.exports = router;
