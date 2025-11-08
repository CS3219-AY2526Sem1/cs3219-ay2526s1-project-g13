import { Kafka, Admin, Consumer, Producer, EachMessagePayload } from 'kafkajs';

export const MATCH_TOPIC = 'match_topic';
export const QUESTION_TOPIC = 'question_topic';
export const ROOM_CREATION_TOPIC = 'room_creation_topic';
export const ROOM_CREATED_TOPIC = 'room_created_topic';

export const CONSUMER_GROUP_QUESTION = 'matching.question-consumer';
export const CONSUMER_GROUP_ROOM_CREATED = 'matching.room-created-consumer';

type MessageHandler = (message: { key?: string | null; value?: string | null }) => Promise<void> | void;

export class KafkaManager {
  private kafka: Kafka;
  private admin: Admin;
  private producer: Producer;
  private consumer_of_question_topic: Consumer;
  private consumer_of_room_created_topic: Consumer;
  private isConnected = false;

  constructor() {
    console.log('KafkaManager constructor');
    const isGCP = !!process.env.PUBSUB_PROJECT_ID;
    if (isGCP) {
      console.log('GCP environment detected, Kafka not configured for GCP');
      this.kafka = null as unknown as Kafka;
      this.admin = null as unknown as Admin;
      this.producer = null as unknown as Producer;
      this.consumer_of_question_topic = null as unknown as Consumer;
      this.consumer_of_room_created_topic = null as unknown as Consumer;
      return;
    }
    const host = process.env.KAFKA_HOST || 'localhost';
    const port = process.env.KAFKA_PORT || '9092';
    const brokers = (process.env.KAFKA_BROKERS || `${host}:${port}`).split(',');
    console.log('brokers', brokers);
    console.log('KAFKA_HOST env var:', process.env.KAFKA_HOST);
    this.kafka = new Kafka({
      clientId: 'matching-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.admin = this.kafka.admin();
    this.producer = this.kafka.producer();
    this.consumer_of_question_topic = this.kafka.consumer({ groupId: CONSUMER_GROUP_QUESTION });
    this.consumer_of_room_created_topic = this.kafka.consumer({ groupId: CONSUMER_GROUP_ROOM_CREATED });
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to Kafka');
      return;
    }
    
    let attempt = 0;
    // retry with linear backoff
    while (attempt < maxRetries) {
      try {
        await this.admin.connect();

        const existing = await this.admin.listTopics();
        const topicsToCreate: { topic: string; numPartitions?: number; replicationFactor?: number }[] = [];

        if (!existing.includes(MATCH_TOPIC)) {
          topicsToCreate.push({ topic: MATCH_TOPIC, numPartitions: 1, replicationFactor: 1 });
        }
        if (!existing.includes(QUESTION_TOPIC)) {
          topicsToCreate.push({ topic: QUESTION_TOPIC, numPartitions: 1, replicationFactor: 1 });
        }
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
        await this.consumer_of_question_topic.connect();
        await this.consumer_of_room_created_topic.connect();
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

  getProducer(): Producer {
    return this.producer;
  }

  async setupSubscribers(handlers: {
    onCollabMessage?: MessageHandler;
    onQuestionMessage?: MessageHandler;
    onRoomCreatedMessage?: MessageHandler;
  }): Promise<void> {
    await this.initWithRetry();

    await this.consumer_of_question_topic.subscribe({ topic: QUESTION_TOPIC, fromBeginning: false });

    this.consumer_of_question_topic.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        if (topic === QUESTION_TOPIC && handlers.onQuestionMessage) {
          await handlers.onQuestionMessage({
            key: message.key?.toString(),
            value: message.value?.toString(),
          });
        }
      },
    });

    await this.consumer_of_room_created_topic.subscribe({ topic: ROOM_CREATED_TOPIC, fromBeginning: false });

    this.consumer_of_room_created_topic.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        if (topic === ROOM_CREATED_TOPIC && handlers.onRoomCreatedMessage) {
          await handlers.onRoomCreatedMessage({
            key: message.key?.toString(),
            value: message.value?.toString(),
          });
        }
      },
    });
  }

  async clearAllTopics(): Promise<void> {
    try {
      console.log('Clearing Kafka topics...');
      
      if (!this.isConnected) {
        await this.admin.connect();
      }
      
      const topicsToDelete = [MATCH_TOPIC, QUESTION_TOPIC, ROOM_CREATION_TOPIC, ROOM_CREATED_TOPIC];
      const existingTopics = await this.admin.listTopics();
      const topicsToRemove = topicsToDelete.filter(topic => existingTopics.includes(topic));
      
      if (topicsToRemove.length > 0) {
        await this.admin.deleteTopics({
          topics: topicsToRemove,
          timeout: 5000
        });
        console.log(`Deleted Kafka topics: ${topicsToRemove.join(', ')}`);
      } else {
        console.log('No Kafka topics to delete');
      }
      
      console.log('Kafka topics cleared');
    } catch (error) {
      console.error('Error clearing Kafka topics:', error);
    }
  }

  async resetConsumerOffsets(): Promise<void> {
    try {
      console.log('Resetting Kafka consumer offsets...');
      
      if (!this.isConnected) {
        await this.admin.connect();
      }
      
      const groupId = 'matching-service-group';
      const topics = [MATCH_TOPIC, QUESTION_TOPIC];
      
      for (const topic of topics) {
        try {
          await this.admin.resetOffsets({
            groupId,
            topic,
            earliest: false 
          });
          console.log(`Reset offsets for topic: ${topic}`);
        } catch (error) {
          console.log(`No offsets to reset for topic: ${topic}`);
        }
      }
      
      console.log('Kafka consumer offsets reset');
    } catch (error) {
      console.error('Error resetting Kafka consumer offsets:', error);
    }
  }

  async disconnect(): Promise<void> {
    try { await this.consumer_of_question_topic.disconnect(); } catch {}
    try { await this.consumer_of_room_created_topic.disconnect(); } catch {}
    try { await this.producer.disconnect(); } catch {}
    try { await this.admin.disconnect(); } catch {}
  }
}

export const kafkaManager = new KafkaManager();
