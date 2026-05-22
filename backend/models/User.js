// backend/models/User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  avatarPublicId: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
  },
  verificationCodeExpires: {
    type: Date,
  },
  // Hashed reset token (we never store raw tokens)
  resetPasswordTokenHash: {
    type: String,
    index: true,
  },
  resetPasswordExpires: {
    type: Date,
  },
  googleAccessToken: {
    type: String,
    default: null,
    select: false,
  },
  googleRefreshToken: {
    type: String,
    default: null,
    select: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Cascade delete the associated Profile when a user is deleted
async function cascadeDeleteProfile(userId) {
  try {
    const Profile = require("./Profile");
    const hashedUserId = Profile.hashUserId(String(userId));
    await Profile.findOneAndDelete({ userId: hashedUserId });
  } catch (err) {
    console.error("Failed to cascade-delete profile:", err.message);
  }
}

UserSchema.post("findOneAndDelete", async function (doc) {
  if (doc?._id) await cascadeDeleteProfile(doc._id);
});

UserSchema.post("deleteOne", { document: true, query: false }, async function () {
  if (this?._id) await cascadeDeleteProfile(this._id);
});

module.exports = mongoose.model("user", UserSchema);
