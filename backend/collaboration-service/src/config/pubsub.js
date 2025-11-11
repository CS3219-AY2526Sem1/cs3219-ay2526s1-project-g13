import { PubSub } from "@google-cloud/pubsub";

// Room creation topics
export const ROOM_CREATION_TOPIC = "room_creation_topic";
export const ROOM_CREATED_TOPIC = "room_created_topic";
export const ROOM_CREATION_SUBSCRIPTION = "room_creation_sub";

// Code execution topics
export const JOB_EXECUTION_TOPIC = "job_execution_topic";

export class PubSubManager {
  constructor() {
    console.log("Collaboration Service PubSubManager constructor");

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
        await this.ensureTopicsExist([
          ROOM_CREATION_TOPIC,
          ROOM_CREATED_TOPIC,
          JOB_EXECUTION_TOPIC,
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

  async ensureTopicsExist(topicNames) {
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

  async setupConsumer(handler) {
    await this.initWithRetry();

    if (!this.useGcp) {
      console.log("Skipping Pub/Sub consumer setup (not on GCP)");
      return;
    }

    await this.setupSubscription(ROOM_CREATION_TOPIC, ROOM_CREATION_SUBSCRIPTION, handler);
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

          await handler({
            key,
            value,
          });

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

  async publishRoomCreated(matchId, roomId) {
    if (!this.useGcp) {
      console.log(`[Fallback] Would publish room created: ${matchId} -> ${roomId}`);
      return;
    }

    try {
      const topic = this.pubsub.topic(ROOM_CREATED_TOPIC);
      const data = { roomId };
      const dataBuffer = Buffer.from(JSON.stringify(data));

      await topic.publishMessage({
        data: dataBuffer,
        attributes: { key: matchId },
      });

      console.log("Published room created event:", { matchId, roomId });
    } catch (error) {
      console.error("Error publishing room created event:", error);
      throw error;
    }
  }

  async publishJob(job) {
    if (!this.useGcp) {
      console.log(`[Fallback] Would publish job: ${job.room_id}`);
      return;
    }

    try {
      const topic = this.pubsub.topic(JOB_EXECUTION_TOPIC);
      const dataBuffer = Buffer.from(JSON.stringify(job));

      await topic.publishMessage({
        data: dataBuffer,
        attributes: { room_id: job.room_id },
      });

      console.log(">>> Sent job: ", job.room_id);
    } catch (error) {
      console.error("Error publishing job:", error);
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

export const pubsubManager = new PubSubManager();
