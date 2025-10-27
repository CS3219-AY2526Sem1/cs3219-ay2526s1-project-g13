import { getSocket } from '../config/socket';
import { redisConfig, redis } from '../config/redis';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { AuthenticatedSocket } from '../middleware/auth-socket';

class MatchingController {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  private sanitizeRedisData(data: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        sanitized[key] = String(value);
      }
    }
    return sanitized;
  }

  async setupSocketListeners() {
    const io = getSocket();
    console.log('Socket listeners setup');
    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('Socket connected:', socket.id, 'for userId:', socket.data.userId);
      socket.on(SOCKET_EVENTS.MATCH_START, async (requestData: { topic: string; difficulty: string }) => {
        let { topic, difficulty } = requestData
        
        if (topic === '') topic = 'all';
        if (difficulty === '') difficulty = 'all';

        console.log('matchStart request received:', { topic, difficulty, userId: socket.data.userId });
        const socketId = socket.id;
        const userId = socket.data.userId;

        const userKey = `user:${socketId}`;
        
        // Check if user is already in the matching queue
        const isAlreadyInQueue = await redis.zRank('matching_queue', userKey);
        if (isAlreadyInQueue !== null) {
          console.log('User already in matching queue, ignoring duplicate request:', userId);
          return;
        }

        const requestedAt = Date.now();

        const userData = {
          socketId,
          userId,
          requestedAt,
          topic,
          difficulty,
        };

        const pipeline = redis.multi();
        pipeline.hSet(userKey, this.sanitizeRedisData(userData));
        pipeline.zAdd('matching_queue', [{ score: requestedAt, value: userKey }]);
        await pipeline.exec();
        
        this.startCountdown(socketId);
      });

      socket.on(SOCKET_EVENTS.STOP_QUEUING, async () => {
        console.log('stopQueuing request received:', { userId: socket.data.userId });
        const socketId = socket.id;
        this.clearTimerFor(socket.id)
        const userKey = `user:${socketId}`;
        const pipeline = redis.multi();
        pipeline.zRem('matching_queue', userKey);
        pipeline.del(userKey);
        await pipeline.exec();
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
        const socketId = socket.id;
        const userKey = `user:${socketId}`;
        this.clearTimerFor(socketId);

        try {
          const pipeline = redis.multi();
          pipeline.zRem('matching_queue', userKey);
          pipeline.del(userKey);
          await pipeline.exec();
          console.log('Removed user from queue on disconnect:', socketId);
        } catch (error) {
          console.error('Error removing user from queue on disconnect:', error);
        }
      });
    });
  }

  private async startCountdown(socketId: string) {
    this.clearTimerFor(socketId);
    let counter = Number(process.env.MATCH_COUNTDOWN_SECONDS) || 60;

    const interval = setInterval(async () => {
      const io = getSocket();

      const socket = io.sockets.sockets.get(socketId);
      if (!socket) {
        this.clearTimerFor(socketId);
        return;
      }

      if (!MatchingController.timers.has(socketId)) {
        return;
      }

      socket.emit(SOCKET_EVENTS.MATCH_COUNTDOWN, counter);

      counter--;
      if (counter < 0) {
        this.clearTimerFor(socketId);
        const queueLength = await redis.zCard('matching_queue');
        if (queueLength == 1) {
          socket.emit(SOCKET_EVENTS.MATCH_TIMEOUT, { message: 'There are no active match requests. Please try at another time' })
        } else {
          socket.emit(SOCKET_EVENTS.MATCH_TIMEOUT, { message: 'There are no active match requests that is suitable for your criteria. Please try with a different criteria.' })
        }
        const userKey = `user:${socketId}`;
        const pipeline = redis.multi();
        pipeline.zRem('matching_queue', userKey);
        pipeline.del(userKey);
        await pipeline.exec();
        
      }
    }, 1000);

    MatchingController.timers.set(socketId, interval);
  }

  clearTimerFor(socketId: string) {
    const t = MatchingController.timers.get(socketId);
    if (t) {
      clearInterval(t);
      MatchingController.timers.delete(socketId);
    }
  }

  async cleanupConsumerGroup(): Promise<void> {
    try {
      const streamKey = 'match_events';
      const consumerGroup = 'match_consumers';
      
      // Delete the consumer group
      await redis.xGroupDestroy(streamKey, consumerGroup);
      console.log(`Cleaned up Redis consumer group: ${consumerGroup}`);
    } catch (error) {
      console.error('Error cleaning up consumer group:', error);
    }
  }
}

export const matchingController = new MatchingController();
export const setupSocketListeners = matchingController.setupSocketListeners.bind(matchingController);
export const clearMatchCountdownFor = matchingController.clearTimerFor.bind(matchingController);
export const cleanupConsumerGroup = matchingController.cleanupConsumerGroup.bind(matchingController);