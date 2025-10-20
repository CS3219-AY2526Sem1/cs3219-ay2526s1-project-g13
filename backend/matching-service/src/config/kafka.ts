import { Kafka, Admin, Consumer, Producer, EachMessagePayload } from 'kafkajs';

export const MATCH_TOPIC = 'match_topic';
export const COLLAB_TOPIC = 'collaboration_topic';
export const QUESTION_TOPIC = 'question_topic';

type MessageHandler = (message: { key?: string | null; value?: string | null }) => Promise<void> | void;

export class KafkaManager {
  private kafka: Kafka;
  private admin: Admin;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    console.log('KafkaManager constructor');
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
    this.consumer = this.kafka.consumer({ groupId: 'matching-service-group' });
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000): Promise<void> {
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
        if (!existing.includes(COLLAB_TOPIC)) {
          topicsToCreate.push({ topic: COLLAB_TOPIC, numPartitions: 1, replicationFactor: 1 });
        }
        if (!existing.includes(QUESTION_TOPIC)) {
          topicsToCreate.push({ topic: QUESTION_TOPIC, numPartitions: 1, replicationFactor: 1 });
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
  }): Promise<void> {
    await this.initWithRetry();

    await this.consumer.subscribe({ topic: COLLAB_TOPIC, fromBeginning: true });
    await this.consumer.subscribe({ topic: QUESTION_TOPIC, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        if (topic === COLLAB_TOPIC && handlers.onCollabMessage) {
          await handlers.onCollabMessage({
            key: message.key?.toString(),
            value: message.value?.toString(),
          });
          return;
        }
        if (topic === QUESTION_TOPIC && handlers.onQuestionMessage) {
          await handlers.onQuestionMessage({
            key: message.key?.toString(),
            value: message.value?.toString(),
          });
        }
      },
    });
  }

  async disconnect(): Promise<void> {
    try { await this.consumer.disconnect(); } catch {}
    try { await this.producer.disconnect(); } catch {}
    try { await this.admin.disconnect(); } catch {}
  }
}

// Optional singleton instance for convenience
export const kafkaManager = new KafkaManager();
