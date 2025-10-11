export const config = {
  // Server Ports
  WS_PORT: process.env.WS_PORT || 8005,
  HTTP_PORT: process.env.HTTP_PORT || 8004,
  // Database
  MONGO_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/peerprep",
  // Yjs MongoDB Provider Persistence Settings
  PERSISTENCE_CONFIG: {
    multipleCollections: true, // each document gets an own collection in the database
  },
};

export default config;
