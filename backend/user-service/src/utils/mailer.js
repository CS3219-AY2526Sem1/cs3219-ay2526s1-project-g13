const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (username, email, verificationToken, verificationCode) => {
  const verificationLink = `http://localhost:3000/verify/${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "PeerPrep Account Verification",
    text: `Hello ${username},

  Thank you for creating an account on PeerPrep! 

  Please click the link below to access the verification link:
  Verify My Account: ${verificationLink}

  Verification code: ${verificationCode}
  This code will expire in 1 hour. If you did not request this, please ignore this email.

  Best regards,
  The PeerPrep Team
  `,
    html: `<p>Hello <strong>${username}</strong>,</p>
  <p>Thank you for creating an account on <strong>PeerPrep</strong>!</p>
  <p>Please click the button below to access the verification link:</p>
  <p><a href="${verificationLink}" style="display:inline-block; padding:10px 20px; background-color:#4F46E5; color:white; text-decoration:none; border-radius:5px;">Verify My Account</a></p>
  <p>Verification code: <strong>${verificationCode}</strong></p>
  <p><em>This code will expire in 1 hour.</em></p>
  <p>If you did not request this, please ignore this email.</p>
  <br/>
  <p>Best regards,<br/>The PeerPrep Team</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Error sending verification email");
  }
};

module.exports = { sendVerificationEmail };
