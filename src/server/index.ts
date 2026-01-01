import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import searchRouter from './routes/search';
import { jiosaavnService } from './services/jiosaavn';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRouter);

// Lyrics endpoint
app.get('/api/lyrics/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const lyrics = await jiosaavnService.getLyrics(songId);
    
    if (!lyrics) {
      return res.status(404).json({ error: 'not_found', message: 'Lyrics not available for this song' });
    }
    
    res.json(lyrics);
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch lyrics' });
  }
});

// Download endpoint - get download URLs for a song
app.get('/api/download/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const downloadUrls = await jiosaavnService.getDownloadUrls(songId);
    
    if (!downloadUrls || downloadUrls.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Download not available for this song' });
    }
    
    res.json({ downloadUrls });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch download URLs' });
  }
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const apiOk = await jiosaavnService.healthCheck();
  if (apiOk) {
    res.json({ status: 'ok', jiosaavn: 'connected' });
  } else {
    res.status(503).json({ status: 'error', jiosaavn: 'disconnected' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
