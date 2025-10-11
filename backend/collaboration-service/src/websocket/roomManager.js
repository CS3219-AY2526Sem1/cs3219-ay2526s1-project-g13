import * as Y from "yjs";

class RoomManager {
  constructor() {
    this.roomDocs = new Map(); // roomId -> Y.Doc
    this.roomClients = new Map(); // roomId -> Set<WebSocket>
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
