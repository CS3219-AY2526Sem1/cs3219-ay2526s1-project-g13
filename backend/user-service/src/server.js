const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./model/user-model")

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
  .then(async () => {
    console.log("MongoDB connected");

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PW;

    const existingAdmin = await User.findOne({ username: adminUsername });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        verified: true
      });
      await admin.save();
      console.log("Default admin user created");
    } else {
      console.log("Admin user already exists");
    }
  })
  .catch((err) => console.log("MongoDB connection error:", err));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
