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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

// Routes
app.use("/v1", authRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  
  if (process.env.MONGO_URI) {
    mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log("MongoDB connected");
        
        // Create admin user if needed
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PW;

        if (adminUsername && adminEmail && adminPassword) {
          User.findOne({ username: adminUsername })
            .then(async (existingAdmin) => {
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
            .catch((err) => console.log("Error creating admin user:", err));
        }
      })
      .catch((err) => {
        console.log("MongoDB connection error:", err);
        console.log("Server is running but MongoDB is not connected");
      });
  } else {
    console.log("MONGO_URI not set, skipping MongoDB connection");
  }
});
