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

// Define frontend URL based on environment
const FRONTEND_URL = "https://eat-welthy.vercel.app";


const app = express();

// Required for Render/Heroku to handle secure cookies properly behind load balancer
app.set("trust proxy", 1);

app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY_1 || "secretKey1", process.env.COOKIE_KEY_2 || "secretKey2"],
    sameSite: "none", // Must be 'none' for cross-site (Vercel -> Render)
    secure: true,     // Must be true for sameSite: 'none'
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

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

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
