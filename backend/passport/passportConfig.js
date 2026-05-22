const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const dotenv = require("dotenv");

dotenv.config();

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

const callbackURL = process.env.GOOGLE_CALLBACK_URL || (process.env.NODE_ENV === "production"
  ? "https://eatwelthy-backend.onrender.com/users/google/callback"
  : "/users/google/callback");

if (clientID && clientSecret && clientID !== "your_google_client_id") {
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
        },
        function (accessToken, refreshToken, profile, done) {
          // Pass tokens along with profile so googleAuth route can store them
          done(null, { profile, accessToken, refreshToken });
        }
      )
    );
  } catch (err) {
    console.error("Error configuring Google OAuth:", err);
  }
} else {
  console.log("Skipping Google OAuth — missing credentials");
}

// Only serialize the user ID into the session cookie to keep it small
passport.serializeUser((user, done) => {
  const profile = user.profile || user;
  done(null, {
    id: profile.id,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
  });
});

passport.deserializeUser((sessionData, done) => {
  done(null, sessionData);
});
