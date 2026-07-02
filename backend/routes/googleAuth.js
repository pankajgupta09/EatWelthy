const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const googleAuth = express.Router();
const jwtSecret = process.env.JWT_SECRET || "mysecrettoken";

const User = require("../models/User");

const clientURL =
  process.env.CLIENT_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://eat-welthy.vercel.app"
    : "http://localhost:3000");

const handleGoogleUser = async (profile) => {
  const email = profile.emails[0].value;
  const userName = email.includes("@gmail.com")
    ? email.split("@gmail.com")[0]
    : email.split("@")[0];

  let user = await User.findOne({ email });

  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("google_oauth_user", salt);

    user = new User({
      name: userName,
      email,
      password: hashedPassword,
      avatar: profile.photos?.[0]?.value || null,
      isVerified: true,
    });

    await user.save();
  } else if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  return user;
};

const signToken = (userId) =>
  new Promise((resolve, reject) => {
    jwt.sign({ user: { id: userId } }, jwtSecret, { expiresIn: "5 days" }, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });

// Start Google OAuth
googleAuth.get(
  "/",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// OAuth callback — issue JWT and redirect to frontend (no session cookies needed)
googleAuth.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: `${clientURL}/login?error=google_auth_failed`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = await handleGoogleUser(req.user);
      const token = await signToken(user.id);
      res.redirect(`${clientURL}/login?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error.message);
      res.redirect(`${clientURL}/login?error=google_auth_failed`);
    }
  }
);

// Legacy endpoint kept for backwards compatibility
googleAuth.get("/success", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated with Google" });
  }

  try {
    const user = await handleGoogleUser(req.user);
    const token = await signToken(user.id);
    return res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.error("Google OAuth success error:", error.message);
    res.status(500).json({ message: "Authentication failed. Please try again." });
  }
});

googleAuth.get("/failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Google authentication failed",
  });
});

googleAuth.get("/logout", async (req, res) => {
  if (req.logout) {
    await req.logout();
  }
  return res.status(200).json({ message: "logout is done" });
});

module.exports = googleAuth;
