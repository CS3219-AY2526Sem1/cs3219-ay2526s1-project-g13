// @ts-nocheck
import { redis, redisConfig } from '../config/redis';
import { getSocket } from '../utils/socket';
import { kafkaManager, MATCH_TOPIC } from '../config/kafka';
import { User } from '../models/types';
import { MatchingEventModel } from '../models/MatchingEvent';

const MATCHING_INTERVAL_MS = Number(process.env.MATCHING_INTERVAL_MS || 1000);
const MATCH_TIMEOUT_MS = Number(process.env.MATCH_TIMEOUT || 60_000);


function categoriesCompatible(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === 'all' || b === 'all' || a === b;
}

function difficultiesCompatible(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === 'all' || b === 'all' || a === b;
}

function pickFinal(categoryA: string, categoryB: string): string {
  return categoryA === 'all' ? categoryB : categoryA;
}
function pickFinalDifficulty(diffA: string, diffB: string): string {
  return diffA === 'all' ? diffB : diffA;
}

async function handleMatch(u1: any, u2: any) {
  const producer = kafkaManager.getProducer();

  const category = pickFinal(u1.category, u2.category);
  const difficulty = pickFinalDifficulty(u1.difficulty, u2.difficulty);

  // Persist matching event in Mongo to obtain a matchId
  const matchingEvent = new MatchingEventModel({ category, difficulty });
  const savedEvent = await matchingEvent.save();
  const matchId = savedEvent._id.toString();

  const matchEvent = {
    user1: { userId: u1.userId, socketId: u1.socketId },
    user2: { userId: u2.userId, socketId: u2.socketId },
    category,
    difficulty,
    matchId,
  };

  // Persist initial room data in Redis under the matchId
  const roomObject = {
    user1: JSON.stringify({
      userId: u1.userId,
      socketId: u1.socketId,
      category: u1.category,
      difficulty: u1.difficulty,
    }),
    user2: JSON.stringify({
      userId: u2.userId,
      socketId: u2.socketId,
      category: u2.category,
      difficulty: u2.difficulty,
    }),
    category,
    difficulty,
    matchId,
  };

  await redis.hSet(matchId, 'data', JSON.stringify(roomObject));

  // Send event to Kafka for other services to act on (collab/question)
  await producer.send({
    topic: MATCH_TOPIC,
    messages: [
      {
        key: matchId,
        value: JSON.stringify(matchEvent),
      },
    ],
  });
}

export function startMatchingWorker(): void {
  setInterval(async () => {
    try {
      const now = Date.now();
      const userKeys = await redis.zRange('matching_queue', 0, -1);
      if (userKeys.length < 2) return;

      const users: Array<{ userKey: string; data: User }> = [];
      for (const key of userKeys) {
        const h = await redis.hGetAll(key);
        if (!h.socketId) continue;
        users.push({ userKey: key, data: h as unknown as User });
      }

      // Sort by requestedAt oldest first
      users.sort((a, b) => Number(a.data.requestedAt) - Number(b.data.requestedAt));

      const matched = new Set<string>();

      for (let i = 0; i < users.length; i++) {
        const a = users[i];
        if (matched.has(a.userKey)) continue;

        // Ensure the candidate is still in the queue
        const rankA = await redis.zRank('matching_queue', a.userKey);
        if (rankA === null) continue;

        for (let j = i + 1; j < users.length; j++) {
          const b = users[j];
          if (matched.has(b.userKey)) continue;

          // Ensure the candidate is still in the queue
          const rankB = await redis.zRank('matching_queue', b.userKey);
          if (rankB === null) continue;

          const canMatch = categoriesCompatible(a.data.category, b.data.category) &&
                           difficultiesCompatible(a.data.difficulty, b.data.difficulty);

          if (!canMatch) continue;

          matched.add(a.userKey);
          matched.add(b.userKey);

          await redis.zRem('matching_queue', a.userKey);
          await redis.zRem('matching_queue', b.userKey);
          await handleMatch(a.data, b.data);
          break;
        }
      }

      // Handle timeouts for users still in queue
      const io = getSocket();
      for (const u of users) {
        if (matched.has(u.userKey)) continue;
        const requestedAt = Number(u.data.requestedAt);
        if (!Number.isFinite(requestedAt)) continue;
        if (now - requestedAt >= MATCH_TIMEOUT_MS) {
          const socketId = u.data.socketId;
          const socket = io.sockets.sockets.get(socketId);
          if (socket && socket.connected) {
            socket.emit('matchTimeout', { message: 'Match timed out. Please try again.' });
          }
          await redis.zRem('matching_queue', u.userKey);
          await redis.del(u.userKey);
        }
      }

      await redisConfig.logQueueStatus();
    } catch (err) {
      console.error('Error in matching worker:', err);
    }
  }, MATCHING_INTERVAL_MS);
}

// Handlers for Kafka messages from collaboration and question services
export async function handleCollabMessage(message: { key?: string | null; value?: string | null }) {
  const matchId = message.key || undefined;
  const room = message.value || undefined;
  if (!matchId || !room) return;

  const data = await redis.hGet(matchId, 'data');
  if (!data) return;

  const roomObject = JSON.parse(data);
  try {
    const parsed = JSON.parse(room);
    roomObject.roomId = parsed.sessionId || parsed.roomId;
  } catch {
    return;
  }
  await redis.hSet(matchId, 'data', JSON.stringify(roomObject));
  await emitMatchEvent(matchId);
}

export async function handleQuestionMessage(message: { key?: string | null; value?: string | null }) {
  const matchId = message.key || undefined;
  const question = message.value || undefined;
  if (!matchId || !question) return;

  const data = await redis.hGet(matchId, 'data');
  if (!data) return;

  const roomObject = JSON.parse(data);
  try {
    const parsed = JSON.parse(question);
    roomObject.questionId = parsed.question || parsed.questionId;
  } catch {
    return;
  }
  await redis.hSet(matchId, 'data', JSON.stringify(roomObject));
  await emitMatchEvent(matchId);
}

export async function emitMatchEvent(matchId: string) {
  const io = getSocket();
  const data = await redis.hGet(matchId, 'data');
  if (!data) return;
  const roomObject = JSON.parse(data);

  if (roomObject.roomId && roomObject.questionId) {
    // Notify both users only when room and question are ready
    try {
      const u1 = JSON.parse(roomObject.user1);
      const u2 = JSON.parse(roomObject.user2);

      const payload = {
        matchId,
        category: roomObject.category,
        difficulty: roomObject.difficulty,
        roomId: roomObject.roomId,
        questionId: roomObject.questionId,
        user1: { socketId: u1.socketId, userId: u1.userId },
        user2: { socketId: u2.socketId, userId: u2.userId },
      };

      if (u1.socketId) io.to(u1.socketId).emit('match_found', payload);
      if (u2.socketId) io.to(u2.socketId).emit('match_found', payload);
    } catch {
      
    }
  }
}