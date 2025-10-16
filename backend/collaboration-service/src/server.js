import db from "./db.js";
import httpServer from "./http/httpServer.js";
import webSocketServer from "./websocket/websocketServer.js";

async function startServer() {
  try {
    // Step 1: Connect to MongoDB
    await db.connect();

    // Step 2: Start HTTP server
    await httpServer.start();

    // Step 3: Start WebSocket server
    await webSocketServer.start();

    console.log("Collaboration service started successfully");
  } catch (error) {
    console.error("Fatal error starting collaboration service:", error);
    process.exit(1);
  }
}

startServer();
