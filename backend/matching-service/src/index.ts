import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { redisConfig } from './config/redis';
import { initSocket } from './utils/socket';
import matchingRoutes from './routes/matchingRoutes';
import { startMatchingWorker } from './workers/matchingWorker';
import { kafkaManager } from './config/kafka';
import { handleCollabMessage, handleQuestionMessage } from './workers/matchingWorker';
import { connectMongo, disconnectMongo } from './config/mongo';


const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = initSocket(httpServer);

app.use('/api/match', matchingRoutes);

// Health check endpoint
app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'OK', service: 'matching-service' });
});

// Initialize Redis connection
async function startServer() {
  try {
    await connectMongo();
    await redisConfig.connect();

    // Start background matching worker
    startMatchingWorker();

    // Subscribe to Kafka topics for collab/question services
    await kafkaManager.setupSubscribers({
      onCollabMessage: handleCollabMessage,
      onQuestionMessage: handleQuestionMessage,
    });

    const port = Number(process.env.PORT) || 8002;
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
  await disconnectMongo();
  process.exit(0);
});

startServer();