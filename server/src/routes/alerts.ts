import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeAlert } from '../services/azureOpenAI';
import { info } from '../utils/logger';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// simple in-memory store
type Alert = {
  id: string;
  title: string;
  description: string;
  image?: string;
  lat: number;
  lng: number;
  risk?: 'High' | 'Medium' | 'Low' | 'Unknown';
  reason?: string;
  analysisSource?: 'azure' | 'mock' | 'error';
  resolved?: boolean;
  createdAt: string;
  userId?: string;
  username?: string;
};

const alerts: Alert[] = [];

// Export alerts for admin access
export function getAllAlerts() {
  return alerts;
}

export function deleteAlertById(id: string): boolean {
  const index = alerts.findIndex(x => x.id === id);
  if (index === -1) return false;
  alerts.splice(index, 1);
  return true;
}

export function updateAlertById(id: string, updates: Partial<Alert>): Alert | null {
  const alert = alerts.find(x => x.id === id);
  if (!alert) return null;
  Object.assign(alert, updates);
  return alert;
}

// uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
console.log('📁 Upload directory:', uploadsDir);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, name);
  }
});
const upload = multer({ storage });

router.get('/', optionalAuth, (req: AuthRequest, res) => {
  res.json(alerts);
});

router.post('/', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { title, description, lat, lng } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();

    // call azure openai to analyze
    const inputForAI = `${description || ''} ${image ? `image:${req.file?.originalname}` : ''}`;
    const analysis = await analyzeAlert(inputForAI);

    info('Alert analysis result', { id, source: analysis.source, risk: analysis.risk });

    const alert = {
      id,
      title,
      description,
      image,
      lat: Number(lat) || 0,
      lng: Number(lng) || 0,
      risk: analysis?.risk || 'Unknown',
      reason: analysis?.reason || '',
      analysisSource: analysis?.source || 'mock',
      resolved: false,
      createdAt,
      userId: req.user?.id,
      username: req.user?.username,
    };
    alerts.push(alert);
    res.status(201).json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

router.post('/:id/resolve', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const a = alerts.find(x => x.id === id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.resolved = true;
  res.json(a);
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const index = alerts.findIndex(x => x.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  // Optional: Check if user owns the alert or is admin
  const alert = alerts[index];
  if (alert.userId && alert.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Not authorized to delete this alert' });
  }
  
  alerts.splice(index, 1);
  info(`Alert deleted: ${id} by user ${req.user?.username}`);
  res.json({ message: 'Alert deleted successfully' });
});

export default router;
