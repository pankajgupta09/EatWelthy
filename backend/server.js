const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const favicon = require("serve-favicon");
const path = require("path");
const passport = require("passport");
const cookieSession = require("cookie-session");

const cookieParser = require("cookie-parser");
const passportSetup = require("./passport/passportConfig");
const auth = require("./routes/Auth");
const googleAuth = require("./routes/googleAuth");
const locationRouter = require("./routes/location");
const nutrition = require("./routes/Nutrition");
const scrapeRoutes = require("./routes/scrapeRoutes");
const eventRoute = require("./routes/eventRoute");
const nutritionixRoute = require("./routes/nutritionixRoute");
const profileRoute = require("./routes/profile");
const supermarketsRoute = require("./routes/supermarkets");
const { setupScheduledTasks } = require("./scheduledTasks");

dotenv.config();

// Fail-fast on missing critical secrets — never use insecure default fallbacks
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "COOKIE_KEY_1", "COOKIE_KEY_2"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(
    `FATAL: Missing required environment variables: ${missingEnv.join(", ")}`
  );
  process.exit(1);
}

const PORT = process.env.PORT || 5050;

const FRONTEND_URL = process.env.CLIENT_URL || "https://eat-welthy.vercel.app";

const app = express();

// Required for Render/Heroku to handle secure cookies properly behind load balancer
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Managed separately if needed
}));

app.use(cookieParser());

app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY_1, process.env.COOKIE_KEY_2],
    sameSite: "none",
    secure: true,
    httpOnly: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token", "Accept"],
  })
);

// Routes
app.use("/users/google", googleAuth);
app.use("/users", auth);
app.use("/location", locationRouter);
app.use("/nutrition", nutrition);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/profile", profileRoute);
app.use("/api/supermarkets", supermarketsRoute);
app.use("/events", eventRoute);
app.use("/api", nutritionixRoute);

// Serve static assets
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Start scheduled tasks only after DB is ready
    setupScheduledTasks();
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
