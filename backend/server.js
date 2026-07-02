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

const isProduction = process.env.NODE_ENV === "production";
const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/eatwelthy";

if (isProduction) {
  const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "COOKIE_KEY_1", "COOKIE_KEY_2"];
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missingEnv.length) {
    console.error(
      `FATAL: Missing required environment variables: ${missingEnv.join(", ")}`
    );
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5050;
const FRONTEND_URL =
  process.env.CLIENT_URL ||
  (isProduction ? "https://eat-welthy.vercel.app" : "http://localhost:3000");

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(cookieParser());

app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [
      process.env.COOKIE_KEY_1 || "dev-cookie-key-1",
      process.env.COOKIE_KEY_2 || "dev-cookie-key-2",
    ],
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
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

app.use("/users/google", googleAuth);
app.use("/users", auth);
app.use("/location", locationRouter);
app.use("/nutrition", nutrition);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/profile", profileRoute);
app.use("/api/supermarkets", supermarketsRoute);
app.use("/events", eventRoute);
app.use("/api", nutritionixRoute);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function connectMongoDB() {
  const candidates = isProduction
    ? [process.env.MONGO_URI]
    : [LOCAL_MONGO_URI, process.env.MONGO_URI].filter(Boolean);

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri);
      const label = uri === LOCAL_MONGO_URI ? "local" : "remote";
      console.log(`MongoDB connected (${label})`);
      setupScheduledTasks();
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
