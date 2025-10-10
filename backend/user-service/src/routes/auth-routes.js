const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyUser,
  resendVerificationCode,
  loginUser,
  logoutUser
} = require("../controllers/auth-controllers");

router.post("/register", registerUser);
router.post("/verify", verifyUser);
router.post("/resend", resendVerificationCode);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

module.exports = router;
