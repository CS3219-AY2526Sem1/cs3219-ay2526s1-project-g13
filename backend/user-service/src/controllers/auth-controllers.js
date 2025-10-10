const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../model/user-model");
const { sendVerificationEmail } = require("../utils/mailer");

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000);

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (await User.findOne({ username }))
      return res.status(409).json({ error: "Username already exists." });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = generateCode();

    const user = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verificationCode,
      verificationCodeExpiry: Date.now() + 3600000,
    });

    await user.save();

    try {
      await sendVerificationEmail(username, email, verificationToken, verificationCode);
      return res.status(201).json({
        message: "User registered successfully. Verification email sent.",
        verificationToken,
      });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      return res.status(201).json({
        message:
          "User registered successfully, but failed to send verification email. Please request a new code.",
        verificationToken,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { verificationToken, verificationCode } = req.body;
    const user = await User.findOne({ verificationToken }).select(
      "+verificationToken +verificationCode +verificationCodeExpiry",
    );

    if (!user) return res.status(400).json({ error: "Invalid verification link." });
    if (user.verified) return res.status(400).json({ error: "User already verified." });
    if (user.verificationCode !== verificationCode)
      return res.status(400).json({ error: "Invalid verification code." });

    if (user.verificationCodeExpiry < Date.now()) {
      const newCode = generateCode();
      return res.status(400).json({
        error: "Verification code expired.",
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
    console.error(err);
    return res.status(400).json({ message: "Please try again" });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { verificationToken } = req.body;
    const user = await User.findOne({ verificationToken });
    if (!user) return res.status(400).json({ error: "Invalid verification link" });

    const newCode = generateCode();
    user.verificationCode = newCode;
    user.verificationCodeExpiry = Date.now() + 3600000;
    await user.save();

    await sendVerificationEmail(user.username, user.email, verificationToken, newCode);
    return res.status(200).json({ message: "Verification code resent successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Please try again" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username }).select("+password +verified");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    } else if(!user.verified) {
      return res.status(401).json({ error: "User is not verified yet" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Successful login
    const accessToken = user.generateJwtToken(2 * 60 * 60);
    const refreshToken = user.generateJwtToken(7 * 24 * 60 * 60);

    // Set HttpOnly cookies
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ message: "Login successful", user: user, accessToken});

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const userId = req.user?.id; // if you have auth middleware for access token
    if (userId) {
      // Invalidate all refresh tokens for this user:
      await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    }

    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    // If you set access as cookie too, clear it:
    res.clearCookie('access_token', { path: '/' });

    return res.status(200).json({ message: 'Logged out' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};

// auth.controller.js (refresh)
const jwt = require('jsonwebtoken');

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies['refresh_token'];
    if (!token) return res.status(401).json({ error: 'Missing refresh token' });

    // Verify signature & expiry
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Enforce token type
    if (payload.type !== 'refresh') {
      return res.status(400).json({ error: 'Wrong token type' });
    }

    // Load user and check tokenVersion to support rotation/revocation
    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If user.tokenVersion changed, this refresh is no longer valid
    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: 'Refresh token revoked' });
    }

    // ——— Rotation strategy ———
    // Bump user's tokenVersion so any previously issued refresh token becomes invalid.
    // This gives you single-session semantics per refresh, strongest security.
    // If you want multi-device sessions, skip the increment here and only increment on logout/all-sessions.
    user.tokenVersion += 1;
    await user.save();

    // Issue new tokens
    const newAccessToken  = user.generateJwtToken(2 * 60 * 60); // 2 hours
    const newRefreshToken = user.generateJwtToken(7 * 24 * 60 * 60); // 7 days

    // Overwrite cookie with the rotated refresh token
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',     // or 'none' if cross-site
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return new access token
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};



