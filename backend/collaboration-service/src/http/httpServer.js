import express from "express";
import cors from "cors";
import http from "http";
import config from "../config.js";
import roomRoutes from "./roomRoutes.js";
import codeExecutionRoutes from "./codeExecutionRoutes.js"

class HttpServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   */
  setupMiddleware() {

    this.app.use(
      cors({
        origin: process.env.WEB_BASE_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    );
    this.app.use(express.json());
  }

  /**
   * Set up API routes
   */
  setupRoutes() {
    this.app.use("/api/v1/code", codeExecutionRoutes)
    this.app.use("/api/v1/rooms", roomRoutes);

    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.originalUrl,
      });
    });

    this.app.use((_err, _req, res, _next) => {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    });
  }

  /**
   * Start the HTTP server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);
      this.server.listen(config.HTTP_PORT, (error) => {
        if (error) {
          console.error("Failed to start HTTP server:", error);
          reject(error);
        } else {
          console.log(`HTTP API server running on http://localhost:${config.HTTP_PORT}`);
          resolve(this.server);
        }
      });
      this.server.on("error", (error) => {
        console.error("HTTP server error:", error);
        reject(error);
      });
    });
  }
}

export const httpServer = new HttpServer();
export default httpServer;
