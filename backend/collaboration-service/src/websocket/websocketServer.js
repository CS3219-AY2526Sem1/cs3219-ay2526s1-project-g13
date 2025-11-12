import { WebSocketServer } from "ws";
import { setupWSConnection } from "@y/websocket-server/utils";
import config from "../config.js";
import roomController from "../controllers/roomController.js";
import roomManager from "./roomManager.js";
import { authenticateWebSocket } from "../middleware/auth.js";

class WebSocketServerManager {
  constructor() {
    this.wss = null;
  }

  /**
   * Start the WebSocket server by attaching to an existing HTTP server
   * @param {http.Server} httpServer - The HTTP server instance from Express
   */
  start(httpServer) {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ server: httpServer });
        this.wss.on("connection", this.handleConnection.bind(this));
        console.log(`WebSocket server is attached to HTTP server on port ${config.PORT}`);
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
    let userId = null;
    let roomId = null;

    try {
      // Step 1: Authenticate the user
      const authResult = await authenticateWebSocket(req);
      if (!authResult.success) {
        console.error("WebSocket authentication failed:", authResult.error);
        ws.close(config.WS_CLOSE_CODES.AUTH_FAILED, authResult.error);
        return;
      }
      userId = authResult.userId;

      // Step 2: Extract room ID from URL path
      roomId = this.extractRoomId(req);
      if (!roomId) {
        console.error("No room ID provided, closing connection");
        ws.close(config.WS_CLOSE_CODES.ROOM_NOT_FOUND, "Room ID required");
        return;
      }

      // Step 3: Validate room existence and status
      const room = await roomController.get(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found, closing connection`);
        ws.close(config.WS_CLOSE_CODES.ROOM_NOT_FOUND, "Room not found");
        return;
      }
      if (!room.isActive) {
        console.error(`Room ${roomId} is inactive, closing connection`);
        ws.close(config.WS_CLOSE_CODES.ROOM_INACTIVE, "Room is closed");
        return;
      }

      // Step 4: Authorize user - check if user is in room
      if (!room.userIds.includes(userId)) {
        console.error(`User ${userId} not authorized for room ${roomId}`);
        ws.close(config.WS_CLOSE_CODES.UNAUTHORIZED, "Room not found");
        return;
      }

      // Step 5: Add client and set up Y.js connection
      await roomManager.initializeRoom(roomId);
      roomManager.addClient(roomId, ws, userId);
      setupWSConnection(ws, req, {
        docName: roomId,
        gc: true,
      });

      // Handle client disconnect
      this.setupDisconnectHandling(ws, roomId, userId);

      // Handle WebSocket errors
      ws.on("error", (error) => {
        console.error(`WebSocket error in room ${roomId}:`, error);
      });
    } catch (error) {
      console.error("Error handling WebSocket connection:", error);
      ws.close(config.WS_CLOSE_CODES.AUTH_FAILED, "Internal server error");
      if (roomId) {
        await roomManager.removeClient(roomId, ws);
      }
    }
  }

  /**
   * Extract room ID from request URL
   * @param {IncomingMessage} req - HTTP request
   * @returns {string|null} - Room ID or null
   */
  extractRoomId(req) {
    try {
      // Assume URL path is like "/<roomId>?token=<jwt>"
      // const rawUrl = req.url || '';
      // // Remove query string explicitly to avoid edge-cases
      // const [pathOnly] = rawUrl.split('?');
      // // Path is like "/<roomId>"; split and take first non-empty segment
      // const segments = pathOnly.split('/').filter(Boolean);
      // const roomId = segments.length > 0 ? segments[0] : null;
      // return roomId;
      const roomId = req.url.split("?")[0].slice(1);
      return roomId;
    } catch (error) {
      console.error("Error extracting room ID from URL:", { url: req.url, error });
      return null;
    }
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
