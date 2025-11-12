import kafkajs from 'kafkajs';
const { Kafka } = kafkajs;

export const ROOM_CREATION_TOPIC = 'room_creation_topic';
export const ROOM_CREATED_TOPIC = 'room_created_topic';

export class KafkaManager {
  constructor() {
    console.log('Collaboration Service KafkaManager constructor');
    const isGCP = !!process.env.PUBSUB_PROJECT_ID;
    if (isGCP) {
      console.log('GCP environment detected, Kafka not configured for GCP');
      this.kafka = null;
      this.producer = null;
      this.consumer = null;
      return;
    }
    const host = process.env.KAFKA_HOST || 'localhost';
    const port = process.env.KAFKA_PORT || '29092';
    const brokers = (process.env.KAFKA_BROKERS || `${host}:${port}`).split(',');
    console.log('Kafka brokers:', brokers);
    
    this.kafka = new Kafka({
      clientId: 'collaboration-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.admin = this.kafka.admin();
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'collaboration-service-group' });
    this.isConnected = false;
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000) {
    if (this.isConnected) {
      console.log('Already connected to Kafka');
      return;
    }
    
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await this.admin.connect();

        const existing = await this.admin.listTopics();
        const topicsToCreate = [];

        if (!existing.includes(ROOM_CREATION_TOPIC)) {
          topicsToCreate.push({ topic: ROOM_CREATION_TOPIC, numPartitions: 1, replicationFactor: 1 });
        }
        if (!existing.includes(ROOM_CREATED_TOPIC)) {
          topicsToCreate.push({ topic: ROOM_CREATED_TOPIC, numPartitions: 1, replicationFactor: 1 });
        }

        if (topicsToCreate.length > 0) {
          await this.admin.createTopics({ topics: topicsToCreate });
          console.log('Created missing topics:', topicsToCreate.map(t => t.topic));
        } else {
          console.log('All required topics exist.');
        }

        await this.admin.disconnect();
        await this.producer.connect();
        await this.consumer.connect();
        this.isConnected = true;
        console.log('Connected to Kafka');
        return;
      } catch (err) {
        attempt += 1;
        console.error(`Failed to connect to Kafka (attempt ${attempt} of ${maxRetries}):`, err);
        if (attempt >= maxRetries) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  async setupConsumer(handler) {
    await this.initWithRetry();

    await this.consumer.subscribe({ topic: ROOM_CREATION_TOPIC, fromBeginning: false });

    this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (topic === ROOM_CREATION_TOPIC) {
          await handler({
            key: message.key?.toString(),
            value: message.value?.toString(),
          });
        }
      },
    });
  }

  async publishRoomCreated(matchId, roomId) {
    try {
      await this.producer.send({
        topic: ROOM_CREATED_TOPIC,
        messages: [
          {
            key: matchId,
            value: JSON.stringify({ roomId }),
          },
        ],
      });
      console.log('Published room created event:', { matchId, roomId });
    } catch (error) {
      console.error('Error publishing room created event:', error);
      throw error;
    }
  }

  async disconnect() {
    try { 
      await this.consumer.disconnect(); 
    } catch {}
    try { 
      await this.producer.disconnect(); 
    } catch {}
    try { 
      await this.admin.disconnect(); 
    } catch {}
  }
}

export const kafkaManager = new KafkaManager();

