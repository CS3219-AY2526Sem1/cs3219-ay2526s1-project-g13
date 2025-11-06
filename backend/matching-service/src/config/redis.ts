import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisConfig {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async clearAllMatchingData(): Promise<void> {
    try {
      console.log('Clearing all matching-related Redis data...');
      
      // Get all user keys and match keys
      const userKeys = await this.client.keys('user:*');
      const matchKeys = await this.client.keys('*');
      const lockKeys = await this.client.keys('lock:*');
      
      // Filter match keys
      const actualMatchKeys = matchKeys.filter(key => 
        key.length === 36 && 
        !key.startsWith('user:') && 
        !key.startsWith('lock:') && 
        key !== 'matching_queue'
      );
      
      // Clear matching queue
      await this.client.del('matching_queue');
      console.log('Cleared matching_queue');
      
      // Clear all user data
      if (userKeys.length > 0) {
        await this.client.del(userKeys);
        console.log(`Cleared ${userKeys.length} user keys`);
      }
      
      // Clear all match data
      if (actualMatchKeys.length > 0) {
        await this.client.del(actualMatchKeys);
        console.log(`Cleared ${actualMatchKeys.length} match keys`);
      }
      
      // Clear all lock keys
      if (lockKeys.length > 0) {
        await this.client.del(lockKeys);
        console.log(`Cleared ${lockKeys.length} lock keys`);
      }
      
      console.log('All matching-related Redis data cleared');
    } catch (error) {
      console.error('Error clearing Redis data:', error);
    }
  }

  async logQueueStatus(): Promise<void> {
    const items = await this.client.zRangeWithScores('matching_queue', 0, -1);
    console.log('matching_queue:', items);
  }

  async getDetailedQueueStatus(): Promise<void> {
    const items = await this.client.zRangeWithScores('matching_queue', 0, -1);
    console.log('=== Detailed Queue Status ===');
    console.log(`Total users in queue: ${items.length}`);
    
    for (const item of items) {
      const userData = await this.client.hGetAll(item.value);
      console.log(`  ${item.value}: score=${item.score}, data=`, userData);
    }
    console.log('============================');
  }
}

export const redisConfig = new RedisConfig();
export const redis = redisConfig.getClient();