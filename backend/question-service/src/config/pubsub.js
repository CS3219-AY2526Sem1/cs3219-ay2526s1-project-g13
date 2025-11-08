const { PubSub } = require("@google-cloud/pubsub");
const { getQuestion } = require("../controllers/questionController");

const MATCH_TOPIC = "match_topic";
const QUESTION_TOPIC = "question_topic";

const MATCH_SUBSCRIPTION = "match_sub";

class PubSubManager {
  constructor() {
    console.log("PubSubManager constructor");

    // Check if running on GCP (PUBSUB_PROJECT_ID is set)
    this.useGcp = !!process.env.PUBSUB_PROJECT_ID;

    if (this.useGcp) {
      console.log("Using GCP Pub/Sub");
      this.pubsub = new PubSub({
        projectId: process.env.PUBSUB_PROJECT_ID,
      });
    } else {
      console.log("GCP Pub/Sub not configured, using fallback mode");
      this.pubsub = null;
    }

    this.subscriptions = new Map();
    this.isConnected = false;
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000) {
    if (this.isConnected) {
      console.log("Already connected to Pub/Sub");
      return;
    }

    if (!this.useGcp) {
      console.log("Skipping Pub/Sub initialization (not on GCP)");
      this.isConnected = true;
      return;
    }

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        // Verify connection by listing topics
        const [topics] = await this.pubsub.getTopics();
        console.log(`Connected to Pub/Sub. Found ${topics.length} topics`);

        // Ensure topics exist
        await this.ensureTopicsExist([MATCH_TOPIC, QUESTION_TOPIC]);

        this.isConnected = true;
        console.log("Connected to Pub/Sub");
        return;
      } catch (err) {
        attempt += 1;
        console.error(`Failed to connect to Pub/Sub (attempt ${attempt} of ${maxRetries}):`, err);
        if (attempt >= maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  async ensureTopicsExist(topicNames) {
    for (const topicName of topicNames) {
      try {
        const topic = this.pubsub.topic(topicName);
        const [exists] = await topic.exists();

        if (!exists) {
          await topic.create();
        }
      } catch (error) {
        console.error(`Error ensuring topic ${topicName}:`, error);
      }
    }
  }

  async publishMessage(topicName, data, attributes = {}) {
    if (!this.useGcp) {
      console.log(`[Fallback] Would publish to ${topicName}:`, data);
      return;
    }

    try {
      const topic = this.pubsub.topic(topicName);
      const dataBuffer = Buffer.from(JSON.stringify(data));

      await topic.publishMessage({
        data: dataBuffer,
        attributes,
      });

      console.log(`Published message to ${topicName}`);
    } catch (error) {
      console.error(`Error publishing to ${topicName}:`, error);
      throw error;
    }
  }

  getProducer() {
    return {
      send: async ({ topic, messages }) => {
        if (!messages || messages.length === 0) return;

        const message = messages[0];
        const data = message.value ? JSON.parse(message.value) : {};
        const attributes = message.key ? { key: message.key } : {};

        await this.publishMessage(topic, data, attributes);
      },
    };
  }

  async setupSubscribers() {
    await this.initWithRetry();

    if (!this.useGcp) {
      console.log("Skipping Pub/Sub subscribers setup (not on GCP)");
      return;
    }

    await this.setupSubscription(MATCH_TOPIC, MATCH_SUBSCRIPTION, async (message) => {
      await getQuestion(message, this, QUESTION_TOPIC);
    });
  }

  async setupSubscription(topicName, subscriptionName, handler) {
    try {
      const topic = this.pubsub.topic(topicName);
      let subscription = topic.subscription(subscriptionName);

      const [exists] = await subscription.exists();
      if (!exists) {
        [subscription] = await topic.createSubscription(subscriptionName);
        console.log(`Created subscription: ${subscriptionName}`);
      }

      // Handle messages
      const messageHandler = async (message) => {
        try {
          const value = message.data.toString();
          const key = message.attributes.key || null;

          // Create message object compatible with Kafka format
          const kafkaCompatibleMessage = {
            key: key ? Buffer.from(key) : null,
            value: Buffer.from(value),
          };

          await handler(kafkaCompatibleMessage);
          message.ack();
        } catch (error) {
          console.error(`Error handling message from ${topicName}:`, error);
          message.nack();
        }
      };

      subscription.on("message", messageHandler);
      subscription.on("error", (error) => {
        console.error(`Subscription ${subscriptionName} error:`, error);
      });

      this.subscriptions.set(subscriptionName, subscription);
      console.log(`Subscribed to ${topicName} (${subscriptionName})`);
    } catch (error) {
      console.error(`Error setting up subscription for ${topicName}:`, error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.useGcp) {
      return;
    }

    try {
      for (const [name, subscription] of this.subscriptions) {
        await subscription.close();
        console.log(`Closed subscription: ${name}`);
      }
      this.subscriptions.clear();

      if (this.pubsub) {
        await this.pubsub.close();
      }
      console.log("Disconnected from Pub/Sub");
    } catch (error) {
      console.error("Error disconnecting from Pub/Sub:", error);
    }
  }
}

const pubsubManager = new PubSubManager();

module.exports = {
  PubSubManager,
  pubsubManager,
  MATCH_TOPIC,
  QUESTION_TOPIC,
};
