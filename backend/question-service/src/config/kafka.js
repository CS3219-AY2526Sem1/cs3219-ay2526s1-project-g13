const { Kafka } = require('kafkajs');
const { getQuestion } = require('../controllers/questionController');


const MATCH_TOPIC = 'match_topic';
const QUESTION_TOPIC = 'question_topic';

class KafkaManager {
  kafka;
  producer;
  consumer;

  constructor() {
    console.log('KafkaManager constructor');
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
    console.log('brokers', brokers);
    console.log('KAFKA_HOST env var:', process.env.KAFKA_HOST);
    this.kafka = new Kafka({
      clientId: 'question-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'question-service-group' });
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000) {
    let attempt = 0;
    // retry with linear backoff
    while (attempt < maxRetries) {
      try {
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

  getProducer() {
    return this.producer;
  }

  async setupSubscribers() {
    await this.initWithRetry();

    await this.consumer.subscribe({ topic: MATCH_TOPIC, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await getQuestion(message, this, QUESTION_TOPIC);
      },
    });
  }

  async disconnect() {
    try { await this.consumer.disconnect(); } catch {}
    try { await this.producer.disconnect(); } catch {}
  }
}

const kafkaManager = new KafkaManager();

module.exports = {
  KafkaManager,
  kafkaManager,
  MATCH_TOPIC,
  QUESTION_TOPIC
};
