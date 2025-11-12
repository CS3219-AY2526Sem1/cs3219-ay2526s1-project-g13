const http = require("http");
const RabbitMQWorker = require("./rabbitmqWorker");
const PubSubWorker = require("./pubsubWorker");

const useGcp = !!process.env.PUBSUB_PROJECT_ID;
const PORT = process.env.PORT || 8080;

async function main() {
  let worker;
  let server = null;

  // Start HTTP server first for Cloud Run health checks
  if (useGcp) {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: 'Hello World!',
        status: 'ok',
      }));
    });
    server.listen(PORT, () => {
      console.log(`HTTP server listening on port ${PORT}`);
    });
  }


  try {
    if (useGcp) {
      console.log("Starting Pub/Sub worker...");
      worker = new PubSubWorker();
    } else {
      console.log("Starting RabbitMQ worker...");
      worker = new RabbitMQWorker();
    }


    worker.start().catch((error) => {
      console.error("Failed to start worker:", error);
    });
  } catch (error) {
    console.error("Error initializing worker:", error);
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
