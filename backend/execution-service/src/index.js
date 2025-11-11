const RabbitMQWorker = require("./rabbitmqWorker");
const PubSubWorker = require("./pubsubWorker");

const useGcp = !!process.env.PUBSUB_PROJECT_ID;

async function main() {
  let worker;

  if (useGcp) {
    console.log("Starting Pub/Sub worker...");
    worker = new PubSubWorker();
  } else {
    console.log("Starting RabbitMQ worker...");
    worker = new RabbitMQWorker();
  }

  await worker.start();

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received: closing worker");
    await worker.stop();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT signal received: closing worker");
    await worker.stop();
    process.exit(0);
  });
}

main();
