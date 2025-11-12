import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';

import { redisConfig } from './config/redis';
import { initSocket } from './config/socket';
import { startMatchingWorker } from './workers/matchingWorker';
import { kafkaManager } from './config/kafka';
import { pubsubManager } from './config/pubsub';
import { handleQuestionMessage, handleRoomCreatedMessage } from './workers/matchingWorker';
import { matchingController, cleanupConsumerGroup } from './controllers/matchingController';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'OK', service: 'matching-service' });
});

const useGcp = !!process.env.PUBSUB_PROJECT_ID;

async function startServer() {
  try {
    const httpServer = createServer(app);
    await initSocket(httpServer);
    await redisConfig.connect();
    await matchingController.setupSocketListeners();
    // Start background matching worker
    startMatchingWorker();

    // Subscribe to topics for question services and room creation
    if (useGcp) {
      await pubsubManager.setupSubscribers({
        onQuestionMessage: handleQuestionMessage,
        onRoomCreatedMessage: handleRoomCreatedMessage,
      });
    } else {
      await kafkaManager.setupSubscribers({
        onQuestionMessage: handleQuestionMessage,
        onRoomCreatedMessage: handleRoomCreatedMessage,
      });
    }

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
  
  try {
    await redisConfig.clearAllMatchingData();
    await cleanupConsumerGroup();
    
    if (useGcp) {
      await pubsubManager.disconnect();
    } else {
      await kafkaManager.resetConsumerOffsets();
      await kafkaManager.clearAllTopics();
      await kafkaManager.disconnect();
    }
    
    await redisConfig.disconnect();
    
    console.log('Shutdown completed successfully');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  process.exit(0);
});

startServer();