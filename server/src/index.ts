
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import alertsRouter from './routes/alerts';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import { info } from './utils/logger';

dotenv.config();

const app = express();
app.use(cors({ 
	origin: 'http://localhost:5173', 
	credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// serve uploaded images - fix path to be relative to project root
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('📁 Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/alerts', alertsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
	info(`Server listening on http://localhost:${port}`);
});
