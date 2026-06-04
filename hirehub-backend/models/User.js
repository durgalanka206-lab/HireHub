const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true },
    password:         { type: String, select: false }, // Now optional for Google users
    role:             { type: String, enum: ["user", "admin"], default: "user" },
    resetOTP:         { type: String },
    resetOTPExpires:  { type: Number },
    // New fields for Google auth
    googleId:         { type: String, sparse: true, unique: true },
    avatar:           { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Only hash password if it exists and is modified
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  // If user doesn't have password (Google login), return false
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);