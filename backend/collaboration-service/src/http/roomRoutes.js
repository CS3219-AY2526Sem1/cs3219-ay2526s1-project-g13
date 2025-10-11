import express from "express";
import roomController from "../controllers/roomController.js";

const router = express.Router();

/**
 * POST /api/v1/rooms
 * Create a new room
 */
router.post("/", async (req, res) => {
  try {
    const room = await roomController.create();
    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Failed to create room:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/rooms/:roomId
 * Get room information and document content
 */
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await roomController.get(roomId);
    if (room) {
      const documentContent = await roomController.getDocumentContent(roomId);
      res.json({
        success: true,
        room: room,
        document: {
          content: documentContent,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }
  } catch (error) {
    console.error("Failed to get room:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/v1/rooms/:roomId/close
 * Close (stop) a room for collaboration
 */
router.patch("/:roomId/close", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await roomController.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    } else if (!room.isActive) {
      return res.status(400).json({
        success: false,
        error: "Room is already closed",
      });
    }
    await roomController.closeRoom(roomId);
    res.json({
      success: true,
      message: "Room closed successfully. All clients have been notified.",
    });
  } catch (error) {
    console.error("Failed to close room:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/v1/rooms/:roomId/language
 * Set programming language for a room
 */
router.patch("/:roomId/language", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({
        success: false,
        error: "Programming language is required",
      });
    }
    const room = await roomController.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    } else if (!room.isActive) {
      return res.status(400).json({
        success: false,
        error: "Cannot set language for a closed room",
      });
    }
    await roomController.setProgrammingLanguage(roomId, language);
    res.json({
      success: true,
      message: `Programming language updated to ${language}. All clients have been notified.`,
    });
  } catch (error) {
    console.error("Failed to set programming language:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
