const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth-routes");

const app = express();
const PORT = process.env.PORT;
app.use(cookieParser());

// Middleware
app.use(
  cors({
    origin: process.env.WEB_BASE_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/v1", authRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
