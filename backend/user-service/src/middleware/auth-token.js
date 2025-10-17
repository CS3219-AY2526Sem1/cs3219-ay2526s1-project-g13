const jwt = require("jsonwebtoken");
const User = require("../model/user-model");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    // Expected format: "Bearer <token>"
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Invalid Authorization header format" });
    }

    // Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID (from your payload)
    req.userId = decoded.userId;
    console.log("Access token verified for userId:", req.userId);

    const userExists = await User.exists({ _id: req.userId });
    if (!userExists) {
      return res.status(401).json({ error: "User not found" });
    }

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = { authenticate };
