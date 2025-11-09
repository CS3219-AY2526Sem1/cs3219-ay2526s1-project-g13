import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import db from "../db.js";
import config from "../config.js";
import Room from "../models/roomModel.js";
import roomManager from "../websocket/roomManager.js";

class RoomController {
  /**
   * Create a new room
   * @param {string|null} roomId - Optional room ID, generates UUID if not provided
   * @param {string|null} questionId - Optional question ID
   * @param {Array<string>} userIds - Array of user IDs
   * @param {string|null} programmingLanguage - Optional programming language
   * @returns {Promise<Object>} - Created room object
   */
  async create(roomId = null, questionId = null, userIds = [], programmingLanguage = null) {
    try {
      const id = roomId || uuidv4();
      const roomData = {
        roomId: id,
        userIds: userIds,
      };
      
      if (questionId) {
        roomData.questionId = questionId;
      }
      
      if (programmingLanguage) {
        roomData.programmingLanguage = programmingLanguage;
      }
      
      const room = await Room.create(roomData);
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
   * Fetch question details from question service
   * @param {string} questionId - Question ID
   * @returns {Promise<Object|null>} - Question details (title, difficulty, topic) or null if not found
   */
  async fetchQuestionDetails(questionId) {
    try {
      const response = await axios.get(
        `${config.QUESTION_SERVICE_URL}/v1/questions/${questionId}`,
        { timeout: 5000 }
      );
      return {
        _id: response.data._id,
        title: response.data.title,
        difficulty: response.data.difficulty,
        topic: response.data.topic,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(`Question ${questionId} not found`);
        return null;
      }
      
      if (error.response) {
        console.error(
          `Failed to fetch question ${questionId}:`,
          `Status ${error.response.status}`,
          error.response.data?.error || error.response.statusText
        );
      } else if (error.request) {
        console.error(
          `Failed to fetch question ${questionId}:`,
          `No response from question service at ${config.QUESTION_SERVICE_URL}.`,
          `Error: ${error.message || 'Network error'}`
        );
      } else {
        console.error(
          `Failed to fetch question ${questionId}:`,
          error.message || 'Unknown error'
        );
      }
      
      return null;
    }
  }

  /**
   * Get all rooms for a user with question details
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Array of room objects with question details
   */
  async getRoomsByUserId(userId) {
    try {
      const rooms = await Room.findRoomsByUserId(userId);
      const roomsArray = rooms.map((room) => room.toObject());

      const roomsWithQuestions = await Promise.all(
        roomsArray.map(async (room) => {
          if (room.questionId) {
            const questionDetails = await this.fetchQuestionDetails(room.questionId);
            return {
              ...room,
              question: questionDetails,
            };
          }
          return {
            ...room,
            question: null,
          };
        })
      );

      return roomsWithQuestions;
    } catch (error) {
      console.error(`Failed to get rooms for user ${userId}:`, error);
      throw error;
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
      await roomManager.closeRoom(roomId, closedRoom.closedAt);
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
