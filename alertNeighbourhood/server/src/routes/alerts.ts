import express from 'express';
import multer from 'multer';
import path from 'path';
import { analyzeAlert } from '../services/azureOpenAI';
import { info } from '../utils/logger';

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
};

const alerts: Alert[] = [];

// uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
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

router.get('/', (req, res) => {
  res.json(alerts);
});

router.post('/', upload.single('image'), async (req, res) => {
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
    };
    alerts.push(alert);
    res.status(201).json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

router.post('/:id/resolve', (req, res) => {
  const { id } = req.params;
  const a = alerts.find(x => x.id === id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.resolved = true;
  res.json(a);
});

export default router;
