const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const favicon = require("serve-favicon");
const path = require("path");
const passport = require("passport");
const cookieSession = require("cookie-session");

const passportSetup = require("./passport/passportConfig");
const auth = require("./routes/Auth");
const googleAuth = require("./routes/googleAuth");
const locationRouter = require("./routes/location");
const nutrition = require("./routes/Nutrition");
const scrapeRoutes = require("./routes/scrapeRoutes");
const wellohRountes = require("./routes/wellohAI");
const eventRoute = require("./routes/eventRoute");
const nutritionixRoute = require("./routes/nutritionixRoute");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5050;
const isProduction = process.env.NODE_ENV === "production";
const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/eatwelthy";

// Define frontend URL based on environment
const FRONTEND_URL = isProduction
  ? "https://eat-welthy.vercel.app"
  : "http://localhost:3000";


const app = express();

// Required for Render/Heroku to handle secure cookies properly behind load balancer
app.set("trust proxy", 1);

app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY_1 || "secretKey1", process.env.COOKIE_KEY_2 || "secretKey2"],
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    httpOnly: true,
  })
);

// Use passport for Google OAuth
app.use(passport.initialize());
app.use(passport.session());

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Corrected CORS setup
app.use(
  cors({
    origin: ["http://localhost:3000", "https://eat-welthy.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token", "Accept"],
  })
);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/users/google", googleAuth);
app.use("/users", auth);
app.use("/location", locationRouter);
app.use("/nutrition", nutrition);
app.use("/api/scrape", scrapeRoutes);
app.use("/welloh", wellohRountes);
app.use("/api/profile", require("./routes/profile"));
app.use("/events", eventRoute);
app.use("/api", nutritionixRoute);

// MongoDB connection — prefer local DB in development
async function connectMongoDB() {
  const candidates = isProduction
    ? [process.env.MONGO_URI]
    : [LOCAL_MONGO_URI, process.env.MONGO_URI].filter(Boolean);

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri);
      const label = uri === LOCAL_MONGO_URI ? "local" : "remote";
      console.log(`MongoDB connected (${label})`);
      return;
    } catch (err) {
      const label = uri === LOCAL_MONGO_URI ? "local" : "remote";
      console.error(`MongoDB connection failed (${label}):`, err.message);
    }
  }

  console.error(
    "Could not connect to MongoDB. Database operations will fail until this is resolved."
  );
}

connectMongoDB();

// API Root Message
app.get("/", (req, res) => {
  res.send("EatWelthy Backend API is Running 🚀");
});

// Serve static assets (Only for backend public files, not React App)
app.use(express.static(path.join(__dirname, "public")));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
