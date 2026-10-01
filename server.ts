import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { parseAudioOrTextForRdo } from './src/server/geminiBackend.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API endpoint for parsing audio / text RDO
app.post('/api/parse-audio-rdo', async (req, res) => {
  try {
    const result = await parseAudioOrTextForRdo(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API Error /api/parse-audio-rdo:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar RDO com IA' });
  }
});

// Serve static frontend files
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT} (0.0.0.0)`);
});
