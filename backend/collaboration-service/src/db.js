import mongoose from "mongoose";
import { MongodbPersistence } from "y-mongodb-provider";
import * as Y from "yjs";
import { setPersistence } from "@y/websocket-server/utils";
import config from "./config.js";

class MongoDatabase {
  constructor() {
    this.persistenceProvider = null;
  }

  /**
   * Initialize MongoDB connections
   */
  async connect() {
    try {
      await mongoose.connect(config.MONGO_URI);

      // Initialize Yjs MongoDB persistence provider
      this.persistenceProvider = new MongodbPersistence(
        config.MONGO_URI,
        config.PERSISTENCE_CONFIG,
      );
      this.setupPersistenceHooks();
    } catch (error) {
      console.error("Failed to connect to MongoDB with Mongoose:", error);
      throw error;
    }
  }

  /**
   * Get the Yjs persistence provider
   */
  getPersistenceProvider() {
    if (!this.persistenceProvider) {
      throw new Error("Persistence provider not initialized. Call connect() first.");
    }
    return this.persistenceProvider;
  }

  /**
   * Set up Yjs persistence hooks
   */
  setupPersistenceHooks() {
    setPersistence({
      bindState: async (docName, ydoc) => {
        // This is called when the first client connects to the document.
        const persistedYdoc = await this.persistenceProvider.getYDoc(docName);
        Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

        // Listen to granular document updates and store them in the database
        ydoc.on("update", async (update) => {
          await this.persistenceProvider.storeUpdate(docName, update);
        });
      },

      writeState: async (docName, ydoc) => {
        // This is called when all connections to the document are closed.
        const update = Y.encodeStateAsUpdate(ydoc);
        await this.persistenceProvider.storeUpdate(docName, update);
        return Promise.resolve();
      },
    });
  }
}

export const db = new MongoDatabase();
export default db;
