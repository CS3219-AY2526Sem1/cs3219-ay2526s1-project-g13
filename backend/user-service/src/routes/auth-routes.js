const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyUser,
  resendVerificationCode,
  loginUser,
  logoutUser,
  getUserProfile,
  sendPasswordResetEmail,
  resetPassword,
  updateUserProfile,
} = require("../controllers/auth-controllers");
const { authenticate } = require("../middleware/auth-token");

router.post("/register", registerUser);
router.post("/verify", verifyUser);
router.post("/resend", resendVerificationCode);
router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/account", authenticate, getUserProfile);
router.post("/forgot-password", sendPasswordResetEmail);
router.post("/reset-password", resetPassword);
router.post("/update-account", authenticate, updateUserProfile);

module.exports = router;
