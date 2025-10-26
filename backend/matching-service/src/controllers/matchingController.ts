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

        const pipeline = redis.multi();
        pipeline.zRem('matching_queue', userKey);
        pipeline.del(userKey);
        await pipeline.exec();

      });
    });
  }

  
  async setupSubscriber() {
    const streamKey = 'match_events';
    const consumerGroup = 'match_consumers';
    const consumerName = `consumer_${process.pid}`;
  
    const groups = await redis.xInfoGroups(streamKey).catch(() => []);
    const exists = groups.some((g: any) => g.name === consumerGroup);
  
    if (!exists) {
      await redis.xGroupCreate(streamKey, consumerGroup, '0', { MKSTREAM: true });
      console.log(`Created Redis consumer group: ${consumerGroup}`);
    } else {
      console.log(`Redis consumer group '${consumerGroup}' already exists. Using the existing one.`);
    }
  
    this.processMatchEvents(streamKey, consumerGroup, consumerName);
  }
  private async processMatchEvents(streamKey: string, consumerGroup: string, consumerName: string) {
    while (true) {
      try {
        const streams = await redis.xReadGroup(consumerGroup, consumerName, [{ key: streamKey, id: '>' }], {
          COUNT: 10,
          BLOCK: 5000,
        });

        if (streams) {
          for (const stream of streams) {
            for (const message of stream.messages) {
              const id = message.id;
              const fields = JSON.parse(message.message.data);

              const user1 = JSON.parse(fields.user1);
              const user2 = JSON.parse(fields.user2);
              const roomId = fields.roomId;
              const matchId = fields.matchId;
              const questionId = fields.questionId;

              console.log('Processing match event:', { user1: user1.socketId, user2: user2.socketId, roomId, matchId, questionId });

              this.handleMatchEvent(user1, user2, roomId, matchId, questionId);

              const pipeline = redis.multi();
              pipeline.xAck(streamKey, consumerGroup, id);
              pipeline.xDel(streamKey, id);
              await pipeline.exec();
            }
          }
        }
      } catch (err) {
        console.error('Error processing match events:', err);
      }
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  private async handleMatchEvent(user1: any, user2: any, roomId: string, matchId: string, questionId: string) {
    try {
      // Check if this match has already been processed to prevent duplicate events
      const processedKey = `match_processed:${matchId}`;
      const alreadyProcessed = await redis.get(processedKey);
      if (alreadyProcessed) {
        console.log('Match already processed, skipping duplicate matchSuccess events:', matchId);
        return;
      }

      // Mark this match as processed with a TTL of 1 hour
      await redis.setEx(processedKey, 3600, '1');

      const io = getSocket();
      const socket1 = io.sockets.sockets.get(user1.socketId);
      const socket2 = io.sockets.sockets.get(user2.socketId);
      if (socket1) {
        socket1.emit(SOCKET_EVENTS.MATCH_SUCCESS, {
          message: `You have been matched with User ID: ${user2.userId}`,
          topic: user1.topic || user2.topic || 'all',
          difficulty: user1.difficulty || user2.difficulty || 'all',
          attemptStartedAt: Date.now(),
          matchId,
          roomId,
          matchUserId: user2.userId,
          questionId,
        });

        this.clearTimerFor(user1.socketId);
        console.log(`Sending matchSuccess events for matchId: ${matchId} to sockets: ${user1.socketId}`);
      }
      if (socket2) {
        socket2.emit(SOCKET_EVENTS.MATCH_SUCCESS, {
          message: `You have been matched with User ID: ${user1.userId}`,
          topic: user2.topic || user1.topic || 'all',
          difficulty: user2.difficulty || user1.difficulty || 'all',
          attemptStartedAt: Date.now(),
          matchId,
          roomId,
          matchUserId: user1.userId,
          questionId,
        });
       
        this.clearTimerFor(user2.socketId);
        console.log(`Sending matchSuccess events for matchId: ${matchId} to sockets: ${user2.socketId}`);
      }
    } catch (error) {
      console.error('Error in handleMatchEvent:', error);
    }
  }

  private async startCountdown(socketId: string) {
    this.clearTimerFor(socketId);
    let counter = Number(process.env.MATCH_COUNTDOWN_SECONDS) || 60;

    const interval = setInterval(() => {
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
        socket.emit(SOCKET_EVENTS.MATCH_TIMEOUT, { message: 'Match timed out. Please try again.' })
        const userKey = `user:${socketId}`;
        const pipeline = redis.multi();
        pipeline.zRem('matching_queue', userKey);
        pipeline.del(userKey);
        pipeline.exec();
        
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
export const setupSubscriber = matchingController.setupSubscriber.bind(matchingController);
export const clearMatchCountdownFor = matchingController.clearTimerFor.bind(matchingController);
export const cleanupConsumerGroup = matchingController.cleanupConsumerGroup.bind(matchingController);