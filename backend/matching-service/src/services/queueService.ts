import { DIFFICULTY, QUESTION_TOPIC, USER_STATUS } from '../models/types';
import { redis } from '../config/redis';

export class QueueService {
  private static readonly QUEUE_PREFIX = 'queue';
  private static readonly USER_PREFIX = 'user';
  private static readonly MATCH_TIMEOUT = 30; 

  // Generate queue key for difficulty + topic combination
  private static getQueueKey(difficulty: DIFFICULTY, topic: QUESTION_TOPIC): string {
    return `${this.QUEUE_PREFIX}:${difficulty}:${topic}`;
  }

  // Generate user key
  private static getUserKey(socketId: string): string {
    return `${this.USER_PREFIX}:${socketId}`;
  }

  // Get all queue keys that a user should be added to based on their preferences
  private static getQueuesForUser(difficulty?: DIFFICULTY, topic?: QUESTION_TOPIC): string[] {
    const queues: string[] = [];
    
    if (difficulty && topic) {
      // User has both preferences - add to exact match queue
      queues.push(this.getQueueKey(difficulty, topic));
    } else if (difficulty) {
      // User has only difficulty - add to all queues with this difficulty
      for (const t of Object.values(QUESTION_TOPIC)) {
        queues.push(this.getQueueKey(difficulty, t));
      }
    } else if (topic) {
      // User has only topic - add to all queues with this topic
      for (const d of Object.values(DIFFICULTY)) {
        queues.push(this.getQueueKey(d, topic));
      }
    }
    
    return queues;
  }

  // Determine final difficulty when two users match
  private static determineFinalDifficulty(user1Diff?: DIFFICULTY, user2Diff?: DIFFICULTY): DIFFICULTY | undefined {
    if (user1Diff && user2Diff && user1Diff === user2Diff) {
      return user1Diff;
    }
    // If only one has a difficulty preference, use that
    if (user1Diff && !user2Diff) {
      return user1Diff;
    }
    if (!user1Diff && user2Diff) {
      return user2Diff;
    }
    // If both have different difficulties, this shouldn't happen in our matching logic
    // but we'll return the first one as fallback
    return user1Diff || user2Diff;
  }

  // Determine final topic when two users match
  private static determineFinalTopic(user1Topic?: QUESTION_TOPIC, user2Topic?: QUESTION_TOPIC): QUESTION_TOPIC | undefined {
    // If both have the same topic, use it
    if (user1Topic && user2Topic && user1Topic === user2Topic) {
      return user1Topic;
    }
    // If only one has a topic preference, use that
    if (user1Topic && !user2Topic) {
      return user1Topic;
    }
    if (!user1Topic && user2Topic) {
      return user2Topic;
    }
    // If both have different topics, this shouldn't happen in our matching logic
    // but we'll return the first one as fallback
    return user1Topic || user2Topic;
  }

  // Check if two users can match based on their preferences
  private static canUsersMatch(
    user1Diff?: DIFFICULTY, 
    user1Topic?: QUESTION_TOPIC,
    user2Diff?: DIFFICULTY, 
    user2Topic?: QUESTION_TOPIC
  ): boolean {
    // If both have difficulty preferences, they must match
    if (user1Diff && user2Diff && user1Diff !== user2Diff) {
      return false;
    }
    
    // If both have topic preferences, they must match
    if (user1Topic && user2Topic && user1Topic !== user2Topic) {
      return false;
    }
    
    // If one has difficulty and the other has topic, they can match
    // If one has both and the other has one, they can match
    // If both have the same preference, they can match
    return true;
  }

  // Add user to queue
  static async addToQueue(socketId: string, difficulty?: DIFFICULTY, topic?: QUESTION_TOPIC): Promise<string> {
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

    // Add to multiple queues based on preferences
    const queuesToAdd = this.getQueuesForUser(difficulty, topic);
    
    for (const queueKey of queuesToAdd) {
      await redis.lPush(queueKey, JSON.stringify({
        socketId,
        roomId,
      }));
      // Set queue expiration
      await redis.expire(queueKey, this.MATCH_TIMEOUT);
    }

    return roomId;
  }

  // Try to find a match
  static async findMatch(socketId: string, difficulty?: DIFFICULTY, topic?: QUESTION_TOPIC): Promise<{
    matched: boolean;
    roomId?: string;
    waitingUser?: string;
    finalDifficulty?: DIFFICULTY;
    finalTopic?: QUESTION_TOPIC;
  }> {
    // Get all possible queues to search for matches
    const queuesToSearch = this.getQueuesForUser(difficulty, topic);
    
    for (const queueKey of queuesToSearch) {
      // Try to pop a waiting user from the queue
      const waitingUserData = await redis.rPop(queueKey);
      
      if (!waitingUserData) {
        continue; // Try next queue
      }

      const waitingUser = JSON.parse(waitingUserData);
      
      // Verify the waiting user is still valid
      const userKey = this.getUserKey(waitingUser.socketId);
      const userExists = await redis.exists(userKey);
      
      if (!userExists) {
        // User no longer exists, continue searching
        continue;
      }

      // Get waiting user's preferences
      const waitingUserData_full = await redis.get(userKey);
      if (!waitingUserData_full) continue;
      
      const waitingUserPrefs = JSON.parse(waitingUserData_full);
      
      // Check if these users can actually match
      if (!this.canUsersMatch(difficulty, topic, waitingUserPrefs.difficulty, waitingUserPrefs.topic)) {
        // Put the user back in the queue and continue searching
        await redis.rPush(queueKey, waitingUserData);
        continue;
      }

      await this.removeFromQueue(waitingUser.socketId);
    
      await this.removeFromQueue(socketId);
      
      // Determine final difficulty and topic for the match
      const finalDifficulty = this.determineFinalDifficulty(difficulty, waitingUserPrefs.difficulty);
      const finalTopic = this.determineFinalTopic(topic, waitingUserPrefs.topic);

      // Update both users' status to indicate they're matched
      await this.updateUserStatus(waitingUser.socketId, USER_STATUS.IN_ROOM);
      await this.updateUserStatus(socketId, USER_STATUS.IN_ROOM);

      return {
        matched: true,
        roomId: waitingUser.roomId, // Keep roomId for socket.io room joining
        waitingUser: waitingUser.socketId,
        finalDifficulty,
        finalTopic,
      };
    }

    return { matched: false };
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
      const queuesToRemove = this.getQueuesForUser(user.difficulty, user.topic);
      
      // Remove user from all queues they were added to
      for (const queueKey of queuesToRemove) {
        // Get all items in the queue
        const queueItems = await redis.lRange(queueKey, 0, -1);
        
        // Remove items that match this socketId
        for (const item of queueItems) {
          const itemData = JSON.parse(item);
          if (itemData.socketId === socketId) {
            await redis.lRem(queueKey, 1, item);
          }
        }
      }
      
      await redis.del(userKey);
    }
  }

  static async getQueueLength(difficulty: DIFFICULTY, topic: QUESTION_TOPIC): Promise<number> {
    const queueKey = this.getQueueKey(difficulty, topic);
    return await redis.lLen(queueKey);
  }
}