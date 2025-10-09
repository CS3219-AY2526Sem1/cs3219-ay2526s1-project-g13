import { DIFFICULTY, QUESTION_TOPIC, USER_STATUS } from '../models/types';
import { redis } from '../config/redis';

export class QueueService {
  private static readonly QUEUE_PREFIX = 'queue';
  private static readonly USER_PREFIX = 'user';
  private static readonly ROOM_PREFIX = 'room';
  private static readonly MATCH_TIMEOUT = 30; 

  // Generate queue key for difficulty + topic combination
  private static getQueueKey(difficulty: DIFFICULTY, topic: QUESTION_TOPIC): string {
    return `${this.QUEUE_PREFIX}:${difficulty}:${topic}`;
  }

  // Generate user key
  private static getUserKey(socketId: string): string {
    return `${this.USER_PREFIX}:${socketId}`;
  }

  // Generate room key
  private static getRoomKey(roomId: string): string {
    return `${this.ROOM_PREFIX}:${roomId}`;
  }

  // Add user to queue
  static async addToQueue(socketId: string, difficulty: DIFFICULTY, topic: QUESTION_TOPIC): Promise<string> {
    const queueKey = this.getQueueKey(difficulty, topic);
    const userKey = this.getUserKey(socketId);
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store user data with expiration
    await redis.setEx(userKey, this.MATCH_TIMEOUT, JSON.stringify({
      socketId,
      status: USER_STATUS.IN_QUEUE,
      difficulty,
      topic,
      joinedAt: Date.now(),
    }));

    // Add to queue with room ID as value
    await redis.lPush(queueKey, JSON.stringify({
      socketId,
      roomId,
      joinedAt: Date.now(),
    }));

    // Set queue expiration
    await redis.expire(queueKey, this.MATCH_TIMEOUT);

    return roomId;
  }

  // Try to find a match
  static async findMatch(socketId: string, difficulty: DIFFICULTY, topic: QUESTION_TOPIC): Promise<{
    matched: boolean;
    roomId?: string;
    waitingUser?: string;
  }> {
    const queueKey = this.getQueueKey(difficulty, topic);

    // Try to pop a waiting user from the queue
    const waitingUserData = await redis.rPop(queueKey);
    
    if (!waitingUserData) {
      return { matched: false };
    }

    const waitingUser = JSON.parse(waitingUserData);
    
    // Verify the waiting user is still valid
    const userKey = this.getUserKey(waitingUser.socketId);
    const userExists = await redis.exists(userKey);
    
    if (!userExists) {
      // User no longer exists, try to find another match
      return this.findMatch(socketId, difficulty, topic);
    }

    // Create room with both users
    const roomId = waitingUser.roomId;
    const roomKey = this.getRoomKey(roomId);
    
    await redis.hSet(roomKey, {
      user1: waitingUser.socketId,
      user2: socketId,
      difficulty,
      topic,
      createdAt: Date.now().toString(),
    });

    // Set room expiration (1 hour)
    await redis.expire(roomKey, 3600);

    // Update both users' status
    await this.updateUserStatus(waitingUser.socketId, USER_STATUS.IN_ROOM);
    await this.updateUserStatus(socketId, USER_STATUS.IN_ROOM);

    return {
      matched: true,
      roomId,
      waitingUser: waitingUser.socketId,
    };
  }

  static async updateUserStatus(socketId: string, status: USER_STATUS): Promise<void> {
    const userKey = this.getUserKey(socketId);
    const userData = await redis.get(userKey);
    
    if (userData) {
      const user = JSON.parse(userData);
      user.status = status;
      await redis.setEx(userKey, this.MATCH_TIMEOUT, JSON.stringify(user));
    }
  }

  static async removeFromQueue(socketId: string): Promise<void> {
    const userKey = this.getUserKey(socketId);
    const userData = await redis.get(userKey);
    
    if (userData) {
      const user = JSON.parse(userData);
      const queueKey = this.getQueueKey(user.difficulty, user.topic);
      
      await redis.del(userKey);
    }
  }

  static async getRoomData(roomId: string): Promise<any> {
    const roomKey = this.getRoomKey(roomId);
    return await redis.hGetAll(roomKey);
  }

  static async cleanupRoom(roomId: string): Promise<void> {
    const roomKey = this.getRoomKey(roomId);
    await redis.del(roomKey);
  }

  static async getQueueLength(difficulty: DIFFICULTY, topic: QUESTION_TOPIC): Promise<number> {
    const queueKey = this.getQueueKey(difficulty, topic);
    return await redis.lLen(queueKey);
  }

  static async getActiveRooms(): Promise<string[]> {
    const pattern = `${this.ROOM_PREFIX}:*`;
    return await redis.keys(pattern);
  }
}