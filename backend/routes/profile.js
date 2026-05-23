const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { check, validationResult } = require("express-validator");
const Profile = require("../models/Profile");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sanitizeForPrompt, sanitizeArrayForPrompt } = require("../utils/security");

// Helper function to process allergies
const processAllergies = (allergies) => {
  if (Array.isArray(allergies)) {
    return allergies.map((allergy) => String(allergy).trim()).filter(Boolean);
  }
  if (typeof allergies === "string") {
    return allergies
      .split(",")
      .map((allergy) => allergy.trim())
      .filter(Boolean);
  }
  return [];
};

function requireHashSecret(res) {
  if (!process.env.HASH_SECRET) {
    console.error("HASH_SECRET is missing!");
    res.status(500).json({ msg: "Server configuration error" });
    return false;
  }
  return true;
}

// @route    GET api/profile/me
// @desc     Get current user's profile
// @access   Private
router.get("/me", auth, async (req, res) => {
  try {
    if (!requireHashSecret(res)) return;

    const hashedUserId = Profile.hashUserId(req.user.id);
    let profile = await Profile.findOne({ userId: hashedUserId });

    if (!profile) {
      const defaultProfile = {
        userId: hashedUserId,
        age: 0,
        gender: "male",
        height: 0,
        weight: 0,
        targetWeight: 0,
        dailyBudget: 0,
        dietaryPreferences: "",
        allergies: [],
        activityLevel: "sedentary",
        dietPlan: "maintenance",
        profileIcon: "bear",
      };

      try {
        profile = new Profile(defaultProfile);
        await profile.save();
      } catch (saveError) {
        console.error("Error creating default profile:", saveError.message);
        return res.status(500).json({ msg: "Error creating profile" });
      }
    }

    res.json(profile);
  } catch (err) {
    console.error("GET /me Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route    POST api/profile
// @desc     Create or update a user's profile
// @access   Private
router.post("/", auth, async (req, res) => {
  try {
    if (!requireHashSecret(res)) return;

    const {
      age,
      gender,
      height,
      weight,
      targetWeight,
      dailyBudget,
      dietaryPreferences,
      allergies,
      activityLevel,
      dietPlan,
      profileIcon,
    } = req.body;

    const hashedUserId = Profile.hashUserId(req.user.id);

    const profileFields = {
      userId: hashedUserId,
      age: Number(age) || 0,
      gender: gender || null,
      height: Number(height) || 0,
      weight: Number(weight) || 0,
      targetWeight: Number(targetWeight) || 0,
      dailyBudget: Number(dailyBudget) || 0,
      dietaryPreferences: dietaryPreferences || "",
      allergies: processAllergies(allergies),
      activityLevel: activityLevel || "sedentary",
      dietPlan: dietPlan || "maintenance",
      profileIcon: profileIcon || "bear",
    };

    let profile = await Profile.findOne({ userId: hashedUserId });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { userId: hashedUserId },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error("Profile creation/update error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route    PUT api/profile
// @desc     Update user's profile
// @access   Private
router.put("/", auth, async (req, res) => {
  try {
    if (!requireHashSecret(res)) return;

    const {
      age,
      gender,
      height,
      weight,
      targetWeight,
      dailyBudget,
      dietaryPreferences,
      allergies,
      activityLevel,
      dietPlan,
      profileIcon,
    } = req.body;

    const hashedUserId = Profile.hashUserId(req.user.id);
    let profile = await Profile.findOne({ userId: hashedUserId });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    if (age !== undefined) profile.age = Number(age);
    if (gender !== undefined) profile.gender = gender;
    if (height !== undefined) profile.height = Number(height);
    if (weight !== undefined) profile.weight = Number(weight);
    if (targetWeight !== undefined) profile.targetWeight = Number(targetWeight);
    if (dailyBudget !== undefined) profile.dailyBudget = Number(dailyBudget);
    if (dietaryPreferences !== undefined) profile.dietaryPreferences = dietaryPreferences;
    if (allergies !== undefined) profile.allergies = processAllergies(allergies);
    if (activityLevel !== undefined) profile.activityLevel = activityLevel;
    if (dietPlan !== undefined) profile.dietPlan = dietPlan;
    if (profileIcon !== undefined) profile.profileIcon = profileIcon;

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route    DELETE api/profile
// @desc     Delete profile and user (cascade hook removes Profile when user is deleted)
// @access   Private
router.delete("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Triggers User.post('deleteOne') hook which removes Profile
    await user.deleteOne();

    res.json({ msg: "Profile and user deleted" });
  } catch (err) {
    console.error("Profile deletion error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route    PUT api/profile/updatepassword
// @desc     Update user's password
// @access   Private
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
      console.error("Password update error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route    PUT api/profile/update-name
// @desc     Update user's display name
// @access   Private
router.put(
  "/update-name",
  auth,
  [check("name", "Name is required").trim().isLength({ min: 1, max: 60 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ errors: [{ msg: "User not found" }] });
      }

      user.name = String(req.body.name).trim();
      await user.save();

      res.json({ name: user.name });
    } catch (err) {
      console.error("Error in update-name route:", err.message);
      res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
  }
);

// Update the generate-diet route
router.post("/generate-diet", auth, async (req, res) => {
  res.status(503).json({ msg: "Diet plan generation is currently unavailable." });
});

module.exports = router;
