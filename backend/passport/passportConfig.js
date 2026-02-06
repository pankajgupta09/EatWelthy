const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Check environment variables
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log("Passport Config - ClientID present:", !!clientID);
console.log("Passport Config - ClientSecret present:", !!clientSecret);

// Determine valid callback URL based on environment
const callbackURL = process.env.NODE_ENV === 'production'
  ? "https://eatwelthy-backend.onrender.com/users/google/callback"
  : "/users/google/callback";

if (clientID && clientSecret && clientID !== 'your_google_client_id') {
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: clientID,
          clientSecret: clientSecret,
          callbackURL: callbackURL,
        },
        function (accessToken, refreshToken, profile, done) {
          done(null, profile);
        }
      )
    );
    console.log("Google OAuth configured successfully with callback:", callbackURL);
  } catch (err) {
    console.error("Error configuring Google OAuth:", err);
  }
} else {
  console.log("Skipping Google OAuth - Missing or default credentials");
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
