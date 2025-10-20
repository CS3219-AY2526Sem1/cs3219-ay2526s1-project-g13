// @ts-nocheck
import { getSocket, isValidSocketId } from '../utils/socket';
import { MATCHING_STATUS } from '../constants/matchingStatus';
import { redisConfig, redis } from '../config/redis';


class MatchingController {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  async startMatching(request: any, response: any) {
    try {
      const io = getSocket();
      const { category = '', difficulty = '', socketId } = request.body ?? {};

      if (!socketId || !isValidSocketId(io, socketId)) {
        return response.status(400).json({ message: 'Invalid socket ID. Please ensure you are connected.' });
      }

      const userKey = `user:${socketId}`;
      const requestedAt = Date.now();

      const userData = {
        category,
        difficulty,
        socketId,
        requestedAt: String(requestedAt),
      };

      await redis.hSet(userKey, userData);
      await redis.zAdd('matching_queue', [{ score: requestedAt, value: userKey }]);

      await redisConfig.logQueueStatus();

      this.startCountdown(socketId);

      return response.status(200).json({
        message: 'Searching for a match...',
        matchingStatus: MATCHING_STATUS.IS_MATCHING,
      });
    } catch (error) {
      console.error('startMatching error:', error);
      return response.status(500).json({ message: 'Internal server error' });
    }
  }

  async cancelMatch(request: any, response: any) {
    try {
      const socketId = request.params?.socketId || request.body?.socketId;
      if (!socketId) return response.status(400).json({ message: 'socketId required' });

      const userKey = `user:${socketId}`;
      await redis.zRem('matching_queue', userKey);
      await redis.del(userKey);

      this.clearTimerFor(socketId);

      return response.status(200).json({
        message: 'Match cancelled',
        matchingStatus: MATCHING_STATUS.CANCELLED,
      });
    } catch (error) {
      console.error('cancelMatch error:', error);
      return response.status(500).json({ message: 'Internal server error' });
    }
  }


  setupSocketListeners() {
    const io = getSocket();

    io.on('connection', (socket) => {
      socket.on('matchStart', async (requestData: { category: string; difficulty: string }) => {
        let { category, difficulty } = requestData ?? { category: '', difficulty: '' };
        if (category === '') category = 'all';
        if (difficulty === '') difficulty = 'all';

        const socketId = socket.id;
        if (!isValidSocketId(io, socketId)) {
          socket.emit('error', { message: 'Invalid socket ID. Please ensure you are connected.' });
          return;
        }

        const userKey = `user:${socketId}`;
        const requestedAt = Date.now();

        const userData = {
          socketId,
          requestedAt,
          category,
          difficulty,
        };

        await redis.hSet(userKey, userData);
        await redis.zAdd('matching_queue', [{ score: requestedAt, value: userKey }]);
        await redisConfig.logQueueStatus();
      });

      socket.on('stopQueuing', async () => {
        const socketId = socket.id;
        const userKey = `user:${socketId}`;
        await redis.zRem('matching_queue', userKey);
        await redis.del(userKey);
      });

      socket.on('disconnect', async () => {
        const socketId = socket.id;
        const userKey = `user:${socketId}`;
        await redis.zRem('matching_queue', userKey);
        await redis.del(userKey);
      });
    });
  }

  
  async setupSubscriber() {
    const streamKey = 'match_events';
    const consumerGroup = 'match_consumers';
    const consumerName = `consumer_${process.pid}`;

    try {
      await redis.xGroupCreate(streamKey, consumerGroup, '0', { MKSTREAM: true });
    } catch (err: any) {
      if (err?.code !== 'BUSYGROUP') {
        console.error('Error creating consumer group:', err);
      }
    }

    void this.processMatchEvents(streamKey, consumerGroup, consumerName);
    startInvalidUserCleaningWorker();
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

              await this.handleMatchEvent(user1, user2, roomId, matchId, questionId);

              await redis.xAck(streamKey, consumerGroup, id);
              await redis.xDel(streamKey, id);
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
      const io = getSocket();
      const socket1 = io.sockets.sockets.get(user1.socketId);
      const socket2 = io.sockets.sockets.get(user2.socketId);

      if (socket1 && socket2) {
        socket1.emit('match_found', {
          message: `You have been matched with User ID: ${user2.userId}`,
          category: user1.category || user2.category || 'all',
          difficulty: user1.difficulty || user2.difficulty || 'all',
          attemptStartedAt: Date.now(),
          matchId,
          roomId,
          matchUserId: user2.userId,
          questionId,
        });

        socket2.emit('match_found', {
          message: `You have been matched with User ID: ${user1.userId}`,
          category: user2.category || user1.category || 'all',
          difficulty: user2.difficulty || user1.difficulty || 'all',
          attemptStartedAt: Date.now(),
          matchId,
          roomId,
          matchUserId: user1.userId,
          questionId,
        });
      }
    } catch (error) {
      console.error('Error in handleMatchEvent:', error);
    }
  }

  private startCountdown(socketId: string) {
    this.clearTimerFor(socketId);
    let counter = Number(process.env.MATCH_COUNTDOWN_SECONDS) || 30;
    const interval = setInterval(() => {
      const io = getSocket();
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) {
        this.clearTimerFor(socketId);
        return;
      }
      socket.emit('matchCountdown', counter);
      counter--;
      if (counter < 0) {
        this.clearTimerFor(socketId);
      }
    }, 1000);
    MatchingController.timers.set(socketId, interval);
  }

  private clearTimerFor(socketId: string) {
    const t = MatchingController.timers.get(socketId);
    if (t) {
      clearInterval(t);
      MatchingController.timers.delete(socketId);
    }
  }
}

export const matchingController = new MatchingController();
export const startMatching = matchingController.startMatching.bind(matchingController);
export const cancelMatch = matchingController.cancelMatch.bind(matchingController);
export const setupSocketListeners = matchingController.setupSocketListeners.bind(matchingController);
export const setupSubscriber = matchingController.setupSubscriber.bind(matchingController);
export const clearMatchCountdownFor = matchingController.clearTimerFor.bind(matchingController);