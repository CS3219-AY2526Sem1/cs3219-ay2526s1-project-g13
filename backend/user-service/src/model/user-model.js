const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 12,
      maxlength: 64,
      select: false,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verified: { type: Boolean, default: false },
    verificationCode: { type: Number, select: false },
    verificationCodeExpiry: { type: Date, select: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordTokenExpiry: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

userSchema.methods.generateAccessToken = function (expiresIn = "2h") {
  return jwt.sign(
    { userId: this._id, username: this.username, type: "access", iat_ms: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn },
  );
};

userSchema.methods.generateRefreshToken = function (expiresIn = "7d") {
  return jwt.sign(
    {
      userId: this._id,
      username: this.username,
      type: "refresh",
      tokenVersion: this.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn },
  );
};

const User = mongoose.model("User", userSchema);
module.exports = User;
