import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET ?? 'dev-secret-change-in-production'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});
