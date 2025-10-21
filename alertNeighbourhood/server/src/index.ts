
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import alertsRouter from './routes/alerts';
import { info } from './utils/logger';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

app.use('/api/alerts', alertsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
	info(`Server listening on http://localhost:${port}`);
});
