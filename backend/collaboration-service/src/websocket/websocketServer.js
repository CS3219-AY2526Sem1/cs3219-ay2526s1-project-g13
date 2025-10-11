import { WebSocketServer } from "ws";
import { setupWSConnection } from "@y/websocket-server/utils";
import config from "../config.js";
import roomController from "../controllers/roomController.js";
import roomManager from "./roomManager.js";

class WebSocketServerManager {
  constructor() {
    this.wss = null;
  }

  /**
   * Start the WebSocket server
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: config.WS_PORT });
        this.wss.on("connection", this.handleConnection.bind(this));
        console.log(`WebSocket server running on ws://localhost:${config.WS_PORT}`);
        resolve(this.wss);
      } catch (error) {
        console.error("Failed to start WebSocket server:", error);
        reject(error);
      }
    });
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {IncomingMessage} req - HTTP request
   */
  async handleConnection(ws, req) {
    try {
      // Extract room ID from URL path
      const roomId = this.extractRoomId(req);
      if (!roomId) {
        logger.error("No room ID provided, closing connection");
        ws.close(1008, "Room ID required");
        return;
      }

      // Validate room existence and status
      const room = await roomController.get(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found, closing connection`);
        ws.close(1008, "Room not found");
        return;
      }
      if (!room.isActive) {
        console.error(`Room ${roomId} is read-only, closing connection`);
        ws.close(1008, "Room is read-only");
        return;
      }

      // Initialize room and add client
      await roomManager.initializeRoom(roomId);
      roomManager.addClient(roomId, ws);
      setupWSConnection(ws, req, {
        docName: roomId,
        gc: true,
      });

      // Handle client disconnect
      this.setupDisconnectHandling(ws, roomId);

      // Handle WebSocket errors
      ws.on("error", (error) => {
        console.error(`WebSocket error in room ${roomId}:`, error);
      });
    } catch (error) {
      console.error("Error handling WebSocket connection:", error);
      ws.close(1011, "Internal server error");
    }
  }

  /**
   * Extract room ID from request URL
   * @param {IncomingMessage} req - HTTP request
   * @returns {string|null} - Room ID or null
   */
  extractRoomId(req) {
    // Assumes URL path is of the form /roomId
    const roomId = req.url.substring(1);
    return roomId || null;
  }

  /**
   * Set up disconnect handling
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} roomId - Room ID
   */
  setupDisconnectHandling(ws, roomId) {
    ws.on("close", async () => {
      await roomManager.removeClient(roomId, ws);
    });
  }
}

export const webSocketServer = new WebSocketServerManager();
export default webSocketServer;
