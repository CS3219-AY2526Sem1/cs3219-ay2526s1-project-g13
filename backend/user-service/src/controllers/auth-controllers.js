const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../model/user-model");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/mailer");

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
      return res.status(400).json({
        error: "Verification code expired.",
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

    const user = await User.findOne({ username: username }).select(
      "+password +verified +tokenVersion",
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    } else if (!user.verified) {
      return res.status(401).json({ error: "User is not verified yet" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Successful login
    const accessToken = user.generateAccessToken(5 * 60);
    const refreshToken = user.generateRefreshToken(7 * 24 * 60 * 60);
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    // Set HttpOnly cookies
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      path: "/",
      secure: false,
      sameSite: "lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return res
      .status(200)
      .json({ message: "Login successful", userId: user._id, accessToken: accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    if (userId) {
      // Invalidate all refresh tokens for this user
      await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    }
    res.clearCookie("refresh_token", { path: "/" });
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const jwt = require("jsonwebtoken");

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies["refresh_token"];
    console.log("Cookies in request:", req.cookies);
    console.log("Refresh token from cookie:", token);
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    // Verify signature & expiry
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Enforce token type
    if (payload.type !== "refresh") {
      return res.status(400).json({ error: "Wrong token type" });
    }
    console.log("Refresh token payload:", payload);
    // Load user and check tokenVersion to support rotation/revocation
    const user = await User.findById(payload.userId).select("+tokenVersion");
    if (!user) return res.status(404).json({ error: "User not found" });

    // If user.tokenVersion changed, this refresh is no longer valid
    if (payload.tokenVersion !== user.tokenVersion) {
      console.log(
        `Token version mismatch: payload ${payload.tokenVersion} vs user ${user.tokenVersion}`,
      );
      return res.status(401).json({ error: "Refresh token revoked" });
    }

    // Issue new tokens
    const newAccessToken = user.generateAccessToken(5 * 60); // 30 minutes

    // Return new access token
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // const userId = req.params.userid;
    const userId = req.userId; // from auth middleware
    console.log("Fetching profile for userId:", userId);
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }
    const user = await User.findById(userId); // exclude password
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist." });
    }

    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendResetPasswordEmail(user.username, email, resetPasswordToken);
    return res
      .status(200)
      .json({ message: "Password reset email sent successfully.", resetToken: resetPasswordToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetPasswordToken, newPassword } = req.body;
    console.log("Resetting password with token:", resetPasswordToken);
    const user = await User.findOne({ resetPasswordToken: resetPasswordToken }).select(
      "+resetPasswordToken +resetPasswordTokenExpiry +password",
    );
    if (!user) {
      return res.status(400).json({ error: "Invalid reset password link." });
    }
    if (user.resetPasswordTokenExpiry < Date.now()) {
      return res.status(400).json({ error: "Expired reset password link." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    const { username, currentPassword, newPassword } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Login required" });
    }
    const currentUser = await User.findById(userId).select("+password +_id");
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Change password if both current and new passwords are provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid current password" });
      }
      currentUser.password = await bcrypt.hash(newPassword, 10);
    }

    // Update username if provided
    const user = await User.findOne({ username }).select("_id");
    if (user && !currentUser._id.equals(user._id)) {
      return res.status(409).json({ error: "Username already exists." });
    }
    if (username && username !== currentUser.username) {
      currentUser.username = username;
    }

    await currentUser.save();
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
