import express from "express";
import roomController from "../controllers/roomController.js";
import { authenticateHttp } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/v1/rooms
 * Create a new room
 * @deprecated This route is disabled since room creation is now handled by matching service through Kafka
 */
// router.post("/", async (req, res) => {
//   try {
//     const { questionId, userIds, programmingLanguage } = req.body;

//     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: "userIds is required and must be a non-empty array",
//       });
//     }

//     const room = await roomController.create(null, questionId, userIds, programmingLanguage);
//     res.json({
//       success: true,
//       room,
//     });
//   } catch (error) {
//     console.error("Failed to create room:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

/**
 * GET /api/v1/rooms/:roomId
 * Get room information and document content
 * Requires authentication and authorization (user must be in room)
 */
router.get("/:roomId", authenticateHttp, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId; // Set by authenticateHttp middleware

    const room = await roomController.get(roomId);

    // Check if room exists
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if user is authorized (part of the room)
    if (!room.userIds.includes(userId)) {
      // Return 404 to maintain privacy (don't reveal room exists)
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    const documentContent = await roomController.getDocumentContent(roomId);
    res.json({
      success: true,
      room: room,
      document: {
        content: documentContent,
      },
    });
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
 * Requires authentication and authorization (user must be in room)
 * @deprecated This route is disabled since room closing is automated by collaboration service
 *             when no users are left in the room for a certain period
 */
// router.patch("/:roomId/close", authenticateHttp, async (req, res) => {
//   try {
//     const { roomId } = req.params;
//     const userId = req.userId; // Set by authenticateHttp middleware

//     const room = await roomController.get(roomId);

//     // Check if room exists
//     if (!room) {
//       return res.status(404).json({
//         success: false,
//         error: "Room not found",
//       });
//     }

//     // Check if user is authorized (part of the room)
//     if (!room.userIds.includes(userId)) {
//       return res.status(404).json({
//         success: false,
//         error: "Room not found",
//       });
//     }

//     if (!room.isActive) {
//       return res.status(400).json({
//         success: false,
//         error: "Room is already closed",
//       });
//     }

//     await roomController.closeRoom(roomId);
//     res.json({
//       success: true,
//       message: "Room closed successfully. All clients have been notified.",
//     });
//   } catch (error) {
//     console.error("Failed to close room:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

/**
 * PATCH /api/v1/rooms/:roomId/language
 * Set programming language for a room
 * Requires authentication and authorization (user must be in room)
 */
router.patch("/:roomId/language", authenticateHttp, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { language } = req.body;
    const userId = req.userId; // Set by authenticateHttp middleware

    if (!language) {
      return res.status(400).json({
        success: false,
        error: "Programming language is required",
      });
    }

    const room = await roomController.get(roomId);

    // Check if room exists
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if user is authorized (part of the room)
    if (!room.userIds.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    if (!room.isActive) {
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
