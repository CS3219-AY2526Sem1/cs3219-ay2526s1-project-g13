import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import Room from "../models/roomModel.js";
import roomManager from "../websocket/roomManager.js";

class RoomController {
  /**
   * Create a new room
   * @param {string|null} roomId - Optional room ID, generates UUID if not provided
   * @returns {Promise<Object>} - Created room object
   */
  async create(roomId = null) {
    try {
      const id = roomId || uuidv4();
      const room = await Room.create({
        roomId: id,
      });
      return room.toObject();
    } catch (error) {
      console.error(`Failed to create room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Update room fields
   * @param {string} roomId - Room ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated room object
   */
  async update(roomId, updates) {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { ...updates },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );
      return room;
    } catch (error) {
      console.error(`Failed to save room state for ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Get room information
   * @param {string} roomId - Room ID
   * @returns {Promise<Object|null>} - Room information or null
   */
  async get(roomId) {
    try {
      const room = await Room.findRoomByRoomId(roomId);
      return room ? room.toObject() : null;
    } catch (error) {
      console.error(`Failed to get room info for ${roomId}:`, error);
      return null;
    }
  }

  /**
   * Get document content from Yjs persistence
   * @param {string} roomId - Room ID
   * @returns {Promise<string>} - Document content as string
   */
  async getDocumentContent(roomId) {
    try {
      const persistenceProvider = db.getPersistenceProvider();
      const ydoc = await persistenceProvider.getYDoc(roomId);
      const yText = ydoc.getText("monaco");
      const content = yText.toString();
      return content;
    } catch (error) {
      console.error(`Failed to get document content for ${roomId}:`, error);
      return "";
    }
  }

  /**
   * Close a room for collaboration
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} - Updated room information
   */
  async closeRoom(roomId) {
    try {
      const room = await Room.findRoomByRoomId(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }
      const closedRoom = await room.closeRoom();
      await roomManager.broadcastRoomClosure(roomId, closedRoom.closedAt);
      return closedRoom.toObject();
    } catch (error) {
      console.error(`Failed to close collaboration for ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Set programming language for a room
   * @param {string} roomId - Room ID
   * @param {string} language - New programming language
   * @returns {Promise<Object>} - Updated room information
   */
  async setProgrammingLanguage(roomId, language) {
    try {
      const room = await Room.findRoomByRoomId(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }
      const updatedRoom = await room.setProgrammingLanguage(language);
      await roomManager.broadcastLanguageChange(roomId, language);
      return updatedRoom.toObject();
    } catch (error) {
      console.error(`Failed to set programming language for ${roomId}:`, error);
      throw error;
    }
  }
}

export const roomController = new RoomController();
export default roomController;
