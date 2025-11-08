import { PubSub, Message, Subscription } from "@google-cloud/pubsub";

export const MATCH_TOPIC = "match_topic";
export const QUESTION_TOPIC = "question_topic";
export const ROOM_CREATION_TOPIC = "room_creation_topic";
export const ROOM_CREATED_TOPIC = "room_created_topic";

export const QUESTION_SUBSCRIPTION = "question_sub";
export const ROOM_CREATED_SUBSCRIPTION = "room_created_sub";

type MessageHandler = (message: {
  key?: string | null;
  value?: string | null;
}) => Promise<void> | void;

export class PubSubManager {
  private pubsub: PubSub;
  private isConnected = false;
  private subscriptions: Map<string, Subscription> = new Map();
  private useGcp: boolean;

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
      // In development without GCP, we'll create a stub
      this.pubsub = null as any;
    }
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000): Promise<void> {
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
        await this.ensureTopicsExist([
          MATCH_TOPIC,
          QUESTION_TOPIC,
          ROOM_CREATION_TOPIC,
          ROOM_CREATED_TOPIC,
        ]);

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

  private async ensureTopicsExist(topicNames: string[]): Promise<void> {
    for (const topicName of topicNames) {
      try {
        const topic = this.pubsub.topic(topicName);
        const [exists] = await topic.exists();

        if (!exists) {
          await topic.create();
          console.log(`Created topic: ${topicName}`);
        }
      } catch (error) {
        console.error(`Error ensuring topic ${topicName}:`, error);
      }
    }
  }

  async publishMessage(
    topicName: string,
    data: any,
    attributes?: Record<string, string>,
  ): Promise<void> {
    if (!this.useGcp) {
      console.log(`[Fallback] Would publish to ${topicName}:`, data);
      return;
    }

    try {
      const topic = this.pubsub.topic(topicName);
      const dataBuffer = Buffer.from(JSON.stringify(data));

      await topic.publishMessage({
        data: dataBuffer,
        attributes: attributes || {},
      });

      console.log(`Published message to ${topicName}`);
    } catch (error) {
      console.error(`Error publishing to ${topicName}:`, error);
      throw error;
    }
  }

  async setupSubscribers(handlers: {
    onCollabMessage?: MessageHandler;
    onQuestionMessage?: MessageHandler;
    onRoomCreatedMessage?: MessageHandler;
  }): Promise<void> {
    await this.initWithRetry();

    if (!this.useGcp) {
      console.log("Skipping Pub/Sub subscribers setup (not on GCP)");
      return;
    }

    // Setup question topic subscription
    if (handlers.onQuestionMessage) {
      await this.setupSubscription(QUESTION_TOPIC, QUESTION_SUBSCRIPTION, handlers.onQuestionMessage);
    }

    // Setup room created topic subscription
    if (handlers.onRoomCreatedMessage) {
      await this.setupSubscription(
        ROOM_CREATED_TOPIC,
        ROOM_CREATED_SUBSCRIPTION,
        handlers.onRoomCreatedMessage,
      );
    }
  }

  private async setupSubscription(
    topicName: string,
    subscriptionName: string,
    handler: MessageHandler,
  ): Promise<void> {
    try {
      const topic = this.pubsub.topic(topicName);
      let subscription = topic.subscription(subscriptionName);

      const [exists] = await subscription.exists();
      if (!exists) {
        [subscription] = await topic.createSubscription(subscriptionName);
        console.log(`Created subscription: ${subscriptionName}`);
      }

      // Handle messages
      const messageHandler = async (message: Message) => {
        try {
          const value = message.data.toString();
          const key = message.attributes.key || null;

          await handler({ key, value });
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

  async clearAllTopics(): Promise<void> {
    // Not applicable for Pub/Sub - topics are managed externally
    console.log("clearAllTopics: Not applicable for Pub/Sub");
  }

  async resetConsumerOffsets(): Promise<void> {
    // Not applicable for Pub/Sub - no concept of offsets
    console.log("resetConsumerOffsets: Not applicable for Pub/Sub");
  }

  async disconnect(): Promise<void> {
    if (!this.useGcp) {
      return;
    }

    try {
      for (const [name, subscription] of this.subscriptions) {
        await subscription.close();
        console.log(`Closed subscription: ${name}`);
      }
      this.subscriptions.clear();

      await this.pubsub.close();
      console.log("Disconnected from Pub/Sub");
    } catch (error) {
      console.error("Error disconnecting from Pub/Sub:", error);
    }
  }

  // Legacy method name compatibility
  getProducer(): any {
    return {
      send: async ({ topic, messages }: any) => {
        if (!messages || messages.length === 0) return;

        const message = messages[0];
        const data = message.value ? JSON.parse(message.value) : {};
        const attributes = message.key ? { key: message.key } : undefined;

        await this.publishMessage(topic, data, attributes);
      },
    };
  }
}

export const pubsubManager = new PubSubManager();
