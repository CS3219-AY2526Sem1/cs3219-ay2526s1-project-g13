const amqp = require("amqplib");
const { processSubmission, resultCallback } = require("./jobProcessor");

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = process.env.QUEUE_NAME || "job_execution_queue";

class RabbitMQWorker {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async start() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(QUEUE_NAME, { durable: true });

      console.log(">>> Consumer connected to RabbitMQ");

      this.channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (msg != null) {
            const job = JSON.parse(msg.content.toString());
            console.log(">>> Got job: ", job.room_id);

            const result = await processSubmission(job);

            // callback
            try {
              await resultCallback(result);
            } catch (callbackError) {
              console.log(">>> Error when callback ", callbackError.message);
            } finally {
              this.channel.ack(msg);
            }
          }
        },
        {
          noAck: false,
        },
      );
    } catch (error) {
      console.log(">>> Worker's error: ", error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = RabbitMQWorker;
