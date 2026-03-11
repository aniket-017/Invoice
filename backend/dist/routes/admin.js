import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const user = await User.findOne({
            email: email.toLowerCase(),
            role: 'admin',
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id.toString(), email: user.email, name: user.name || undefined, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name || '', role: 'admin' } });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password required' });
        }
        const normalizedEmail = email.toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            passwordHash: hash,
            role: role === 'admin' ? 'admin' : 'user',
        });
        res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/users', authMiddleware, adminOnly, async (_req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
        res.json(users);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        const normalizedEmail = email.toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.params.id } });
        if (existing) {
            return res.status(400).json({ error: 'Another user with this email already exists' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { name, email: normalizedEmail, role: role === 'admin' ? 'admin' : 'user' }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send();
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
