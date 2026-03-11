import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_EXPIRY = '7d';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email: (email as string).toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const payload: AuthPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name || undefined,
      role: user.role as 'user' | 'admin',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name || '', role: user.role } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = (req as typeof req & { user: AuthPayload }).user;
  const dbUser = await User.findById(user.userId).select('-passwordHash').lean();
  if (!dbUser) return res.status(401).json({ error: 'User not found' });
  res.json({ id: dbUser._id, email: dbUser.email, name: dbUser.name || '', role: dbUser.role });
});

export default router;
