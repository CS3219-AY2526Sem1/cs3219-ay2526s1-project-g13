const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyUser,
  resendVerificationCode,
} = require("../controllers/auth-controllers");

router.post("/register", registerUser);
router.post("/verify", verifyUser);
router.post("/resend", resendVerificationCode);

module.exports = router;
