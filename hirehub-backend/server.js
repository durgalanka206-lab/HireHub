const express = require("express");
const mongoose = require("mongoose");
const dns = require("node:dns");

// Use public DNS for SRV lookups
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
require("./config/passport");

const app = express();

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Use CLIENT_URL env var — never hardcode localhost in production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://hirehub.vercel.app",
  "https://hirehub-silk.vercel.app",
  "https://hirehubx.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "hirehub-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authRoutes        = require("./routes/auth");
const jobRoutes         = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const contactRoutes     = require("./routes/contact");

app.use("/api/auth",         authRoutes);
app.use("/api/jobs",         jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/contact",      contactRoutes);


app.get("/", (req, res) => {
  res.json({ message: "✅ HireHub API v2.0 running", env: process.env.NODE_ENV || "development" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🌐 Allowing requests from: ${process.env.CLIENT_URL || allowedOrigins.join(", ")}`);
    });
  })
  .catch((err) => { console.error("❌ MongoDB failed:", err.message); process.exit(1); });