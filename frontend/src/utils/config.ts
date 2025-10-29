/**
 * Stores configuration constants for frontend to interact with the backend services.
 */

export const collaborationConfig = {
  HTTP_URL: process.env.COLLABORATION_SERVICE_HTTP_URL || "http://localhost:8004",
  WS_URL: process.env.COLLABORATION_SERVICE_WS_URL || "ws://localhost:8005",
};
