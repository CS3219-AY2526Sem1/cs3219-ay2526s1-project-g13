const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = 8080;
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("./model/user-model");
const { sendVerificationEmail } = require("./utils/mailer");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(cors());
app.use(express.json());
app.post("/v1/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already exists." });
    } else if (existingEmail) {
      return res.status(409).json({ error: "Email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verificationCode,
      verificationCodeExpiry: Date.now() + 3600000,
    });
    try {
      await user.save();
    } catch (saveErr) {
      console.error("Error saving user:", saveErr);
      return res.status(500).json({ error: "Failed to register user. Please try again later." });
    }
    try {
      await sendVerificationEmail(username, email, verificationToken, verificationCode);
      return res.status(201).json({
        message: "User registered successfully. Verification email sent.",
        verificationToken: verificationToken,
      });
    } catch (emailErr) {
      console.error("Error sending verification email:", emailErr);
      return res.status(201).json({
        message:
          "User registered successfully, but failed to send verification email. Please request a new code.",
        verificationToken: verificationToken,
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/v1/verify", async (req, res) => {
  try {
    const { verificationToken, verificationCode } = req.body;
    console.log(verificationToken, verificationCode);

    const user = await User.findOne({ verificationToken: verificationToken }).select(
      "+verificationToken +verificationCode +verificationCodeExpiry",
    );
    if (!user) {
      return res.status(400).json({ error: "Invalid verification link." });
    }
    console.log("User found:", user);
    if (user.verified) {
      return res.status(400).json({ error: "User has already been verified." });
    }
    if (user.verificationCode !== verificationCode) {
      console.log(`Invalid code: ${user.verificationCode}, ${verificationCode}`);
      return res.status(400).json({ error: "Invalid verification code." });
    }
    if (user.verificationCodeExpiry < Date.now()) {
      const newCode = Math.floor(100000 + Math.random() * 900000);
      return res.status(400).json({
        error: "Verification code has expired.",
        username: user.username,
        email: user.email,
        verificationToken: user.verificationToken,
        verificationCode: newCode,
      });
    }
    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();
    return res.status(200).json({ message: "User verified successfully" });
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ message: "Please try again" });
  }
});

app.post("/v1/resend", async (req, res) => {
  try {
    const { verificationToken } = req.body;
    const newCode = Math.floor(100000 + Math.random() * 900000);
    const user = await User.findOne({ verificationToken: verificationToken });
    if (!user) {
      return res.status(400).json({ error: "Please check your verification link" });
    }
    user.verificationCode = newCode;
    user.verificationCodeExpiry = Date.now() + 3600000;
    await user.save();
    await sendVerificationEmail(user.username, user.email, verificationToken, newCode);
    return res.status(200).json({ message: "Verification code resent successfully!" });
  } catch (err) {
    console.log(err).message;
    return res.status(400).json({ message: "Please try again" });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
