export const config = {
  // Server Ports
  WS_PORT: process.env.WS_PORT || 8005,
  HTTP_PORT: process.env.HTTP_PORT || 8004,
  // Database
  MONGO_URI:
    process.env.MONGODB_URI ||
    "mongodb://admin:password@localhost:27017/peerprepCollabService?authSource=admin",
  // Room Management
  ROOM_TIMEOUT_MINUTES: parseInt(process.env.ROOM_TIMEOUT_MINUTES) || 10,
  // Question service
  QUESTION_SERVICE_URL: process.env.QUESTION_SERVICE_URL || "http://localhost:8003",
  // Yjs MongoDB Provider Persistence Settings
  PERSISTENCE_CONFIG: {
    multipleCollections: true, // each document gets an own collection in the database
  },
  // JWT Token (Should match the user-service JWT secret)
  JWT_SECRET: process.env.JWT_SECRET || "your-jwt-secret-here",
  // WebSocket Close Codes
  WS_CLOSE_CODES: {
    AUTH_FAILED: 4000, // Invalid/missing token
    UNAUTHORIZED: 4001, // User not in room
    ROOM_NOT_FOUND: 4002, // Room doesn't exist
    ROOM_INACTIVE: 4003, // Room is closed
  },
};

export default config;
