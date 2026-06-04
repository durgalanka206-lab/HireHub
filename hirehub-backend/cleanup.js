require("dotenv").config();
const mongoose = require("mongoose");

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not set. Make sure .env is present.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("⚠️  Connected to:", process.env.MONGO_URI);
  console.log("⚠️  Deleting all users and applications...");

  const users = await mongoose.connection.db.collection("users").deleteMany({});
  const apps  = await mongoose.connection.db.collection("applications").deleteMany({});
  console.log("✅ Users deleted:", users.deletedCount);
  console.log("✅ Applications deleted:", apps.deletedCount);
  process.exit(0);
});