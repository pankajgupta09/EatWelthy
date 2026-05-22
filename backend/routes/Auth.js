const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");
const { authLimiter, forgotPasswordLimiter } = require("../middlewares/rateLimiter");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailUtil");
const {
  generateVerificationCode,
  generateResetToken,
  hashToken,
} = require("../utils/security");

const jwtSecret = process.env.JWT_SECRET;

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getClientUrl() {
  return (
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://eat-welthy.vercel.app"
      : "http://localhost:3000")
  );
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // "none" required for cross-origin cookies (Vercel frontend → Render backend)
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
};

// Issue a JWT and respond — replaces the unsafe `throw err` pattern
function signAndSend(res, payload, extra = {}) {
  jwt.sign(payload, jwtSecret, { expiresIn: "5 days" }, (err, token) => {
    if (err) {
      console.error("JWT sign error:", err.message);
      return res.status(500).json({ msg: "Could not issue session token" });
    }
    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ token, ...extra });
  });
}

// @route   POST /users/forgot-password
// @desc    Send a password-reset link (secure token, never the password itself)
// @access  Public
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  [check("email", "Please include a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = String(req.body.email).toLowerCase().trim();

    // Generic response so we don't reveal whether the email exists
    const genericResponse = {
      msg: "If an account exists for that email, a reset link has been sent.",
    };

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.json(genericResponse);
      }

      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);

      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
      await sendPasswordResetEmail(email, resetUrl);

      return res.json(genericResponse);
    } catch (err) {
      console.error("Forgot-password error:", err.message);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   POST /users/reset-password
// @desc    Complete password reset using token from email
// @access  Public
router.post(
  "/reset-password",
  forgotPasswordLimiter,
  [
    check("email", "Email is required").isEmail(),
    check("token", "Token is required").isLength({ min: 32 }),
    check("newPassword", "Password must be at least 8 characters").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const tokenHash = hashToken(String(req.body.token));

    try {
      const user = await User.findOne({
        email,
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ msg: "Invalid or expired reset link" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(String(req.body.newPassword), salt);
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.json({ msg: "Password has been reset. You can now log in." });
    } catch (err) {
      console.error("Reset-password error:", err.message);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   PUT /users/update-name
// (Moved to /api/profile/update-name — see backend/routes/profile.js)

// @route   POST /users
// @desc    Register user
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is required").trim().isLength({ min: 1, max: 60 }),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter password with 8 or more characters").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ errors: [{ msg: "User already exists" }] });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        isVerified: true, // Auto-verify — no email OTP required
      });

      await user.save();

      return signAndSend(res, { user: { id: user.id } }, {
        msg: "Registration successful! You can now log in.",
      });
    } catch (err) {
      console.error("Register error:", err.message);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   POST /users/verify-code
// @desc    Verify email with code
// @access  Public
router.post(
  "/verify-code",
  [
    check("email", "Email is required").isEmail(),
    check("code", "Verification code is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    try {
      const user = await User.findOne({
        email: String(email).toLowerCase().trim(),
        verificationCode: code,
        verificationCodeExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          errors: [{ msg: "Invalid or expired verification code" }],
        });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();

      res.json({ msg: "Email verified successfully" });
    } catch (err) {
      console.error("Verify-code error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   GET /users/auth
// @desc    Get user by token / Loading user
// @access  Private
router.get("/auth", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get-auth error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   POST /users/auth
// @desc    Authentication user & get token (login)
// @access  Public
router.post(
  "/auth",
  authLimiter,
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email: String(email).toLowerCase().trim() });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      if (!user.isVerified) {
        return res.status(400).json({
          errors: [{ msg: "Please verify your email before logging in" }],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      return signAndSend(res, { user: { id: user.id } });
    } catch (err) {
      console.error("Login error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   POST /users/resend-verification
// @desc    Resend verification code
// @access  Public
router.post(
  "/resend-verification",
  [check("email", "Please include a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = String(req.body.email).toLowerCase().trim();

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: "User not found" }] });
      }
      if (user.isVerified) {
        return res.status(400).json({ errors: [{ msg: "Email already verified" }] });
      }

      const verificationCode = generateVerificationCode();
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000;

      await user.save();
      await sendVerificationEmail(email, verificationCode);

      res.json({ msg: "New verification code sent" });
    } catch (err) {
      console.error("Resend-verification error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// ============ Avatar upload (Cloudinary-backed) ============
const { uploadAvatarToCloudinary, deleteAvatarFromCloudinary } = require("../utils/cloudinary");

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, JPEG, and WEBP images are allowed"));
    }
  },
});

// Multer error handler wrapper — turns errors into clean JSON responses
function avatarUpload(req, res, next) {
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ msg: "File too large (max 2 MB)" });
      }
      return res.status(400).json({ msg: err.message || "Invalid file" });
    }
    next();
  });
}

// @route   POST /users/uploadfile
// @desc    Upload avatar (multipart/form-data, field name: 'avatar')
// @access  Private
router.post("/uploadfile", auth, avatarUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Upload new image to Cloudinary
    const uploadResult = await uploadAvatarToCloudinary(req.file.buffer, user._id.toString());
    if (!uploadResult?.secure_url) {
      return res.status(500).json({ msg: "Upload failed" });
    }

    // Best-effort delete of previous avatar in Cloudinary
    if (user.avatarPublicId) {
      deleteAvatarFromCloudinary(user.avatarPublicId).catch((e) =>
        console.error("Old avatar delete failed:", e.message)
      );
    }

    user.avatar = uploadResult.secure_url;
    user.avatarPublicId = uploadResult.public_id;
    await user.save();

    return res.json({ avatar: user.avatar });
  } catch (err) {
    console.error("Avatar upload error:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT /users/updatepassword
// @desc    Update password (while authenticated)
// @access  Private
router.put(
  "/updatepassword",
  auth,
  [check("password", "Please enter a password with 8 or more characters").isLength({ min: 8 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      res.json({ msg: "Password updated successfully" });
    } catch (err) {
      console.error("Update-password error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   DELETE /users/delete
// @desc    Delete user (Profile is cascade-deleted via User model hooks)
// @access  Private
router.delete("/delete", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Triggers post('deleteOne') hook which removes the Profile too
    await user.deleteOne();

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Delete-user error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   DELETE /users/auth
// @desc    Logout — clear HTTP-only cookie
// @access  Public
router.delete("/auth", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ msg: "Logged out" });
});

module.exports = router;
