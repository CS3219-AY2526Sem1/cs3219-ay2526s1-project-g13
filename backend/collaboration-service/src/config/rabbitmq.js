import amqp from "amqplib";

export const JOB_EXECUTION_QUEUE = "job_execution_queue";

export class RabbitMQManager {
  constructor() {
    console.log("Collaboration Service RabbitMQManager constructor");
    const isGCP = !!process.env.PUBSUB_PROJECT_ID;
    if (isGCP) {
      console.log("GCP environment detected, RabbitMQ not configured for GCP");
      this.connection = null;
      this.channel = null;
      return;
    }
    this.rabbitMQUrl = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq";
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async initWithRetry(maxRetries = 5, retryDelayMs = 2000) {
    if (this.isConnected) {
      console.log("Already connected to RabbitMQ");
      return;
    }

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        this.connection = await amqp.connect(this.rabbitMQUrl);
        this.channel = await this.connection.createChannel();

        await this.channel.assertQueue(JOB_EXECUTION_QUEUE, { durable: true });

        console.log("Connected to RabbitMQ");
        this.isConnected = true;
        return;
      } catch (err) {
        attempt += 1;
        console.error(`Failed to connect to RabbitMQ (attempt ${attempt} of ${maxRetries}):`, err);
        if (attempt >= maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  async sendJob(job) {
    if (!this.isConnected || !this.channel) {
      throw new Error("RabbitMQ not connected");
    }

    try {
      this.channel.sendToQueue(JOB_EXECUTION_QUEUE, Buffer.from(JSON.stringify(job)), {
        persistent: true,
      });
      console.log(">>> Sent job: ", job.room_id);
    } catch (error) {
      console.error("Error while sending job: ", error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("Disconnected from RabbitMQ");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    }
  }
}

export const rabbitmqManager = new RabbitMQManager();
