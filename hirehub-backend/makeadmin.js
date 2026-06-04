const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ MongoDB connected");

  const User        = require("./models/User");
  const Application = require("./models/Application");

  // ── Step 1: Delete ALL users and applications ──────────────
  await Application.deleteMany({});
  console.log("🗑  All applications deleted");

  await User.deleteMany({});
  console.log("🗑  All users deleted");

  // ── Step 2: Create admin with your credentials ──────────────
  await User.create({
    name:     "Durga Lanka",
    email:    "lankadurga779@gmail.com",
    password: "Ammu@2026",
    role:     "admin",
  });
  console.log("✅ Admin created → lankadurga779@gmail.com / Ammu@2026");

  // ── Step 3: Jobs are untouched ───────────────────────────────
  const Job = require("./models/Job");
  const jobCount = await Job.countDocuments();
  console.log(`✅ Jobs preserved → ${jobCount} jobs still in DB`);

  console.log("\n🎉 Done! Login with:");
  console.log("   Email    : lankadurga779@gmail.com");
  console.log("   Password : Ammu@2026");

  mongoose.disconnect();
}).catch(err => {
  console.error("❌ MongoDB error:", err.message);
  process.exit(1);
});