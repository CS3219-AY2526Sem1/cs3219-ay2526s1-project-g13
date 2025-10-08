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
