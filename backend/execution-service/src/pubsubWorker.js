const { PubSub } = require("@google-cloud/pubsub");
const { processSubmission, resultCallback } = require("./jobProcessor");

const JOB_EXECUTION_TOPIC = "job_execution_topic";
const JOB_EXECUTION_SUBSCRIPTION = "job_execution_sub";

class PubSubWorker {
  constructor() {
    this.pubsub = new PubSub({
      projectId: process.env.PUBSUB_PROJECT_ID,
    });
    this.subscription = null;
  }

  async start() {
    try {
      const topic = this.pubsub.topic(JOB_EXECUTION_TOPIC);

      // Ensure topic exists
      const [topicExists] = await topic.exists();
      if (!topicExists) {
        await topic.create();
        console.log(`Created topic: ${JOB_EXECUTION_TOPIC}`);
      }

      // Get or create subscription
      this.subscription = topic.subscription(JOB_EXECUTION_SUBSCRIPTION);
      const [subExists] = await this.subscription.exists();
      if (!subExists) {
        [this.subscription] = await topic.createSubscription(JOB_EXECUTION_SUBSCRIPTION);
        console.log(`Created subscription: ${JOB_EXECUTION_SUBSCRIPTION}`);
      }

      console.log(">>> Consumer connected to Pub/Sub");

      // Handle messages
      const messageHandler = async (message) => {
        try {
          const job = JSON.parse(message.data.toString());
          console.log(">>> Got job: ", job.room_id);

          const result = await processSubmission(job);

          // callback
          try {
            await resultCallback(result);
          } catch (callbackError) {
            console.log(">>> Error when callback ", callbackError.message);
          } finally {
            message.ack();
          }
        } catch (error) {
          console.error("Error processing message:", error);
          message.nack();
        }
      };

      this.subscription.on("message", messageHandler);
      this.subscription.on("error", (error) => {
        console.error("Subscription error:", error);
      });
    } catch (error) {
      console.log(">>> Worker's error: ", error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.subscription) {
      await this.subscription.close();
    }
    if (this.pubsub) {
      await this.pubsub.close();
    }
  }
}

module.exports = PubSubWorker;
