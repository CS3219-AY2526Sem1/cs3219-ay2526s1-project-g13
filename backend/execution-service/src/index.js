const http = require("http");
const RabbitMQWorker = require("./rabbitmqWorker");
const PubSubWorker = require("./pubsubWorker");

const useGcp = !!process.env.PUBSUB_PROJECT_ID;
const PORT = process.env.PORT || 8080;

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

  let server = null;
  if (useGcp) {
    // Create a minimal HTTP server for GCP Cloud Run health checks
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: 'Hello World!',
      }));
    });
    server.listen(PORT);
  }

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received: closing worker");
    await worker.stop();
    if (server) {
      server.close();
    }
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT signal received: closing worker");
    await worker.stop();
    if (server) {
      server.close();
    }
    process.exit(0);
  });
}

main();
