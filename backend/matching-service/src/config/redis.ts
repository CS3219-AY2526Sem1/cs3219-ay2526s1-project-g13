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
}

export const redisConfig = new RedisConfig();
export const redis = redisConfig.getClient();