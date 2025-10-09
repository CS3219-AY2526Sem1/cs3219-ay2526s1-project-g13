import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { redisConfig } from './config/redis';
import { MatchHandler } from './socketHandlers/matchHandler';
import { MatchingService } from './services/matchingService';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'matching-service' });
});

// Queue statistics endpoint
app.get('/stats', async (req, res) => {
  try {
    const stats = await MatchingService.getQueueStats();
    res.json({ queueStats: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  new MatchHandler(socket);
});

// Initialize Redis connection
async function startServer() {
  try {
    await redisConfig.connect();
    
    const port = process.env.PORT || 8002;
    httpServer.listen(port, () => {
      console.log(`Matching service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await redisConfig.disconnect();
  process.exit(0);
});

startServer();