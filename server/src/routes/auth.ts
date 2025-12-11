import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, sanitizeUser } from '../models/User';
import { createUser, findUserByEmail, findUserByUsername, findUserById } from '../services/userService';
import { info, warn } from '../utils/logger';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    if (findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (findUserByUsername(username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    createUser(newUser);
    info(`New user registered: ${username} (${email})`);

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeUser(newUser),
      token,
    });
  } catch (err: any) {
    warn('Registration error:', err?.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    info(`User logged in: ${user.username}`);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      token,
    });
  } catch (err: any) {
    warn('Login error:', err?.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
