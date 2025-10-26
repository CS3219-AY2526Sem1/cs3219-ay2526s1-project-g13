import { redis, redisConfig } from '../config/redis';
import { getSocket } from '../config/socket';
import { kafkaManager, MATCH_TOPIC } from '../config/kafka';
import { User } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import fetch from 'node-fetch';
import { clearMatchCountdownFor } from '../controllers/matchingController';
import { acquireLock, releaseLock } from '../config/redislock';
import { MATCHING_INTERVAL_MS, MATCHING_LOCK_KEY, MATCHING_LOCK_TTL } from '../constants/matchingStatus';

function topicsCompatible(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === 'all' || b === 'all' || a === b;
}

function difficultiesCompatible(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === 'all' || b === 'all' || a === b;
}

function pickFinal(topicA: string, topicB: string): string {
  return topicA === 'all' ? topicB : topicA;
}
function pickFinalDifficulty(diffA: string, diffB: string): string {
  return diffA === 'all' ? diffB : diffA;
}

async function handleMatch(u1: User, u2: User) {
  const io = getSocket();
  const s1 = io.sockets.sockets.get(u1.socketId);
  const s2 = io.sockets.sockets.get(u2.socketId);

  if (s1) {
    s1.emit(SOCKET_EVENTS.ROOM_PREPARING, {
      message: 'Preparing your room...'
    });
    clearMatchCountdownFor(u1.socketId);
  }

  if (s2) {
    s2.emit(SOCKET_EVENTS.ROOM_PREPARING, {
      message: 'Preparing your room...',
    });
    clearMatchCountdownFor(u2.socketId);
  }

  const producer = kafkaManager.getProducer();
  console.log(`Match found: ${u1.socketId} + ${u2.socketId} (${u1.topic}/${u1.difficulty})`);
  const topic = pickFinal(u1.topic, u2.topic);
  const difficulty = pickFinalDifficulty(u1.difficulty, u2.difficulty);

  const matchId = uuidv4();

  const matchEvent = {
    user1: { userId: u1.userId, socketId: u1.socketId },
    user2: { userId: u2.userId, socketId: u2.socketId },
    topic,
    difficulty,
    matchId,
  };

  const roomObject = {
    user1: JSON.stringify({
      userId: u1.userId,
      socketId: u1.socketId,
      topic: u1.topic,
      difficulty: u1.difficulty,
    }),
    user2: JSON.stringify({
      userId: u2.userId,
      socketId: u2.socketId,
      topic: u2.topic,
      difficulty: u2.difficulty,
    }),
    topic,
    difficulty,
    matchId,
  };

  await redis.hSet(matchId, 'data', JSON.stringify(roomObject));
  console.log(`Match event created: ${matchId} for topic ${topic}, difficulty ${difficulty}`);
  
  // Send event to Kafka for question service to act on
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
  const tick = async () => {
    let token: string | undefined;
    try {
      const res = await acquireLock(MATCHING_LOCK_KEY, MATCHING_LOCK_TTL);
      if (!res.ok) {
        return;
      }
      token = res.token;
      await runMatchingOnce();

    } catch (err) {
      console.error('Error in matching worker:', err);
    } finally {
      if (token) await releaseLock(MATCHING_LOCK_KEY, token);
      setTimeout(tick, MATCHING_INTERVAL_MS); 
    }
  };

  setTimeout(tick, MATCHING_INTERVAL_MS);
}

export async function runMatchingOnce(): Promise<void> {
  try {
      const userKeys = await redis.zRange('matching_queue', 0, -1);
      if (userKeys.length < 2) {
        console.log('Not enough users in queue to match');
        return;
      }
      const pipeline = redis.multi();
      for (const key of userKeys) {
        pipeline.hGetAll(key);
      }

      const results = await pipeline.exec();
  
      const users: Array<{ userKey: string; data: User }> = [];
      for (let i = 0; i < userKeys.length; i++) {
        if (results[i]) {
          users.push({ userKey: userKeys[i], data: results[i] as unknown as User });
        }
      }
      
      if (process.env.DEBUG_MATCHING === 'true' || userKeys.length > 0) {
        console.log('Users in queue details:');
        const io = getSocket();
        for (const user of users) {
          const socket = io.sockets.sockets.get(user.data.socketId);
          const isConnected = socket && socket.connected;
          console.log(`  ${user.userKey}: socketId=${user.data.socketId}, userId=${user.data.userId}, connected=${isConnected}, topic=${user.data.topic}, difficulty=${user.data.difficulty}`);
        }
      }
      const matched = new Set<string>();

      for (let i = 0; i < users.length; i++) {
        const a = users[i];
        if (matched.has(a.userKey)) continue;

        // Ensure the user is still in the queue
        const rankA = await redis.zRank('matching_queue', a.userKey);
        if (rankA === null) continue;
        
        for (let j = i + 1; j < users.length; j++) {
          const b = users[j];
          if (matched.has(b.userKey)) continue;

          // Ensure the user is still in the queue
          const rankB = await redis.zRank('matching_queue', b.userKey);
          if (rankB === null) continue;

          const canMatch = topicsCompatible(a.data.topic, b.data.topic) &&
                           difficultiesCompatible(a.data.difficulty, b.data.difficulty);

          if (!canMatch) continue;

          matched.add(a.userKey);
          matched.add(b.userKey);

          const pipeline = redis.multi();
          pipeline.zRem('matching_queue', a.userKey);
          pipeline.zRem('matching_queue', b.userKey);
          await pipeline.exec();

          handleMatch(a.data, b.data).catch(err => console.error('Error in handleMatch:', err));
          break;
        }
        if (matched.size >= users.length) break;
      }
    } catch (err) {
      console.error('Error in matching worker:', err);
    }
}

export async function handleQuestionMessage(message: { key?: string | null; value?: string | null }) {
  const matchId = message.key || undefined;
  const question = message.value || undefined;
  console.log('handleQuestionMessage:', { matchId, question });
  if (!matchId || !question) return;

  const data = await redis.hGet(matchId, 'data');
  if (!data) return;

  // Check if this match has already been processed to prevent duplicates
  const roomObject = JSON.parse(data);
  if (roomObject.questionId && roomObject.roomId) {
    console.log('Match already processed, skipping duplicate:', matchId);
    return;
  }

  const parsed = JSON.parse(question);
  roomObject.questionId = parsed.questionId;
  
  await redis.hSet(matchId, 'data', JSON.stringify(roomObject));

  // Call collaboration service to create room
  try {
    const collaborationServiceUrl = process.env.COLLABORATION_SERVICE_URL || 'http://localhost:8003';
    
    const u1 = JSON.parse(roomObject.user1);
    const u2 = JSON.parse(roomObject.user2);
    const userIds = [u1.userId, u2.userId];
    
    const requestBody = {
      questionId: roomObject.questionId,
      userIds: userIds,
      programmingLanguage: 'python'
    };
    
    const response = await fetch(`${collaborationServiceUrl}/api/v1/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Failed to create room in collaboration service:', response.status, response.statusText);
      const io = getSocket();
      const socket_1 = io.sockets.sockets.get(u1.socketId);
      const socket_2 = io.sockets.sockets.get(u2.socketId);
      if (socket_1) {
        socket_1.emit(SOCKET_EVENTS.MATCH_CANCELLED, { message: 'Match cancelled. Please try again.' });
      }
      if (socket_2) {
        socket_2.emit(SOCKET_EVENTS.MATCH_CANCELLED, { message: 'Match cancelled. Please try again.' });
      }
      return;
    }

    const roomData = await response.json();
    const roomId = roomData.room?.roomId;
    
    if (!roomId) {
      console.error('No room ID returned from collaboration service');
      return;
    }

    roomObject.roomId = roomId;
    await redis.hSet(matchId, 'data', JSON.stringify(roomObject));
    
    const streamData = {
      user1: JSON.stringify(u1),
      user2: JSON.stringify(u2),
      roomId: roomId,
      matchId: matchId,
      questionId: roomObject.questionId,
      topic: roomObject.topic,
      difficulty: roomObject.difficulty,
    };

    await redis.xAdd('match_events', '*', { data: JSON.stringify(streamData) });
    console.log('Added match event to Redis stream:', streamData);

  } catch (error) {
    console.error('Error creating room or adding to stream:', error);
  }
}