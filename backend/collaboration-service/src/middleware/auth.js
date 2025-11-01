import jwt from "jsonwebtoken";
import { URL } from "url";

/**
 * Middleware to authenticate WebSocket connections using JWT
 * Extracts userId from JWT and returns it as part of the result
 */
export const authenticateWebSocket = async (req) => {
  try {
    // Try to extract token from query parameter
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      return {
        success: false,
        error: "Missing authentication token",
      };
    }

    // Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return {
      success: true,
      userId: decoded.userId,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Middleware to authenticate HTTP requests using JWT
 * Extracts userId from JWT and attaches it to req.userId
 */
export const authenticateHttp = async (req, res, next) => {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Missing Authorization header",
      });
    }

    // Expected format: "Bearer <token>"
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        error: "Invalid Authorization header format",
      });
    }

    // Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to request
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message,
    });
  }
};

export default { authenticateWebSocket, authenticateHttp };
