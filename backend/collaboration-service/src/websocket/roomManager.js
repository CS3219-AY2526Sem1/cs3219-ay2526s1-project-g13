import * as Y from "yjs";
import config from "../config.js";

class RoomManager {
  constructor() {
    this.roomDocs = new Map(); // roomId -> Y.Doc
    this.roomClients = new Map(); // roomId -> Set<WebSocket>
    this.roomTimeouts = new Map(); // roomId -> setTimeout ID
  }

  /**
   * Initialize room in memory (Y.Doc and client set)
   * @param {string} roomId - Room ID
   * @returns {Promise<boolean>} - Success status
   */
  async initializeRoom(roomId) {
    try {
      if (!this.roomDocs.has(roomId)) {
        const doc = new Y.Doc();
        this.roomDocs.set(roomId, doc);
        this.roomClients.set(roomId, new Set());
        this.startRoomTimeout(roomId);
      }
      return true;
    } catch (error) {
      console.error(`Failed to initialize room ${roomId}:`, error);
      return false;
    }
  }

  /**
   * Add client to room
   * @param {string} roomId - Room ID
   * @param {WebSocket} ws - WebSocket connection
   */
  addClient(roomId, ws) {
    const clientsInRoom = this.roomClients.get(roomId);
    if (clientsInRoom) {
      clientsInRoom.add(ws);

      // Clear any existing timeout since a client has joined
      this.clearRoomTimeout(roomId);
    }
  }

  /**
   * Remove client from room
   * @param {string} roomId - Room ID
   * @param {WebSocket} ws - WebSocket connection
   */
  removeClient(roomId, ws) {
    const clientsInRoom = this.roomClients.get(roomId);
    if (clientsInRoom) {
      clientsInRoom.delete(ws);

      // If no clients remain, start the timeout for room closure
      if (clientsInRoom.size === 0) {
        this.startRoomTimeout(roomId);
      }
    }
  }

  /**
   * Get all clients in a room
   * @param {string} roomId - Room ID
   * @returns {Set<WebSocket>|null} - Set of WebSocket connections or null
   */
  getRoomClients(roomId) {
    return this.roomClients.get(roomId) || null;
  }

  /**
   * Get room document
   * @param {string} roomId - Room ID
   * @returns {Y.Doc|null} - Yjs document or null
   */
  getRoomDocument(roomId) {
    return this.roomDocs.get(roomId) || null;
  }

  /**
   * Start timeout for room closure when no clients are connected
   * @param {string} roomId - Room ID
   */
  startRoomTimeout(roomId) {
    const timeoutId = setTimeout(
      async () => {
        try {
          const clientsInRoom = this.roomClients.get(roomId);
          if (!clientsInRoom || clientsInRoom.size === 0) {
            await this.autoCloseRoom(roomId);
          }
        } catch (error) {
          console.error(`Error during timeout closure of room ${roomId}:`, error);
        }
      },
      config.ROOM_TIMEOUT_MINUTES * 60 * 1000,
    );
    this.roomTimeouts.set(roomId, timeoutId);
  }

  /**
   * Clear the timeout for room closure
   * @param {string} roomId - Room ID
   */
  clearRoomTimeout(roomId) {
    const timeoutId = this.roomTimeouts.get(roomId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.roomTimeouts.delete(roomId);
    }
  }

  /**
   * Remove room from memory and broadcast closure, this is expected to be called by roomController
   * @param {string} roomId - Room ID\
   * @param {Object} closedAt - Timestamp of closure
   */
  async closeRoom(roomId, closedAt) {
    // Clean up room data from memory
    this.roomDocs.delete(roomId);
    this.roomClients.delete(roomId);
    this.clearRoomTimeout(roomId);

    // Broadcast room closure to all connected clients
    this.broadcastRoomClosure(roomId, closedAt);
  }

  /**
   * Automatically close a room due to inactivity, needs to call roomController to update DB
   * @param {string} roomId - Room ID
   */
  async autoCloseRoom(roomId) {
    try {
      // Import roomController here to avoid circular dependency
      const { roomController } = await import("../controllers/roomController.js");
      await roomController.closeRoom(roomId);
    } catch (error) {
      console.error(`Error during auto-closure of room ${roomId}:`, error);
    }
  }

  /**
   * Broadcast a message to all clients in a room
   * @param {string} roomId - Room ID
   * @param {Object} message - Message to broadcast
   */
  broadcastToRoom(roomId, message) {
    const clientsInRoom = this.getRoomClients(roomId);
    if (clientsInRoom) {
      const messageStr = JSON.stringify(message);
      clientsInRoom.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  /**
   * Broadcast room closure to all clients in a room
   * @param {string} roomId - Room ID
   * @param {Object} closedAt - Timestamp of closure
   */
  broadcastRoomClosure(roomId, closedAt) {
    const message = {
      type: "room-close-notification",
      data: {
        closedAt,
      },
    };
    this.broadcastToRoom(roomId, message);
  }

  /**
   * Broadcast programming language change to all clients in a room
   * @param {string} roomId - Room ID
   * @param {string} language - New programming language
   */
  broadcastLanguageChange(roomId, language) {
    const message = {
      type: "language-change-notification",
      data: {
        language,
      },
    };
    this.broadcastToRoom(roomId, message);
  }
}

export const roomManager = new RoomManager();
export default roomManager;
