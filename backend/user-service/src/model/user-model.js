const mongoose = require("mongoose");

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
    verified: { type: Boolean, default: false },
    verificationCode: { type: Number, select: false },
    verificationCodeExpiry: { type: Date, select: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
