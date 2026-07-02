const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const googleAuth = express.Router();

const User = require("../models/User");

const clientURL = process.env.CLIENT_URL || (process.env.NODE_ENV === "production"
  ? "https://eat-welthy.vercel.app"
  : "http://localhost:3000");

googleAuth.get(
  "/",
  passport.authenticate("google", {
    scope: ["email", "https://www.googleapis.com/auth/calendar.events"],
    accessType: "offline",
    prompt: "consent",
  })
);

googleAuth.get("/success", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ error: "No Google login data" });
  }

  const profile = req.user.profile || req.user;
  const accessToken = req.user.accessToken;
  const refreshToken = req.user.refreshToken;

  const email = profile.emails[0].value;
  const userName = email.split("@")[0];

  try {
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name: userName,
        email,
        password: hashedPassword,
        avatar: profile.photos?.[0]?.value || null,
        isVerified: true,
        googleAccessToken: accessToken || null,
        googleRefreshToken: refreshToken || null,
      });
      await user.save();
    } else {
      // Update tokens if we got new ones
      if (accessToken) user.googleAccessToken = accessToken;
      if (refreshToken) user.googleRefreshToken = refreshToken;
      await user.save();
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5 days" }, (err, token) => {
      if (err) {
        console.error("JWT sign error:", err.message);
        return res.status(500).json({ success: false, message: "Could not issue session token" });
      }
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 5 * 24 * 60 * 60 * 1000,
      });
      const safeUser = { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
      return res.status(200).json({ success: true, token, user: safeUser });
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

googleAuth.get("/failure", (req, res) => {
  res.status(401).json({ success: false, message: "Google authentication failed" });
});

googleAuth.get("/logout", async (req, res) => {
  await req.logout();
  return res.status(200).json({ message: "Logged out successfully" });
});

googleAuth.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/users/google/failure",
    successRedirect: clientURL + "/login",
    session: true,
  })
);

module.exports = googleAuth;
