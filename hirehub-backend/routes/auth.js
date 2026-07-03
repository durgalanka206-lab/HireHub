const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");

// ── Rate limiters ─────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many OTP requests. Please wait 15 minutes before requesting another." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Blocked email domains ─────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","trashmail.com","yopmail.com","tempmail.com","guerrillamail.com",
  "10minutemail.com","throwaway.email","fakeinbox.com","sharklasers.com","spam4.me",
  "dispostable.com","maildrop.cc","temp-mail.org","emailondeck.com","mytemp.email",
  "discard.email","spamgourmet.com","spambox.us","mt2015.com","trbvn.com",
  "guerrillamail.info","grr.la","zzrgg.com","deyro.com","mailnull.com",
  "trashmail.net","trashmail.at","trashmail.io","mailtemp.net","tempinbox.com",
  "moakt.com","mohmal.com","getnada.com","tempail.com","throwam.com",
  "mailnesia.com","mailsac.com","spamfree24.org","trashmail.me",
  "wegwerfmail.de","tempemail.net","filzmail.com","getairmail.com","yopmail.fr",
]);

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || BLOCKED_DOMAINS.has(domain)) return false;
  return true;
}

async function getTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  const test = await nodemailer.createTestAccount();
  const t = nodemailer.createTransport({
    host: "smtp.ethereal.email", port: 587,
    auth: { user: test.user, pass: test.pass },
  });
  console.log("Using Ethereal test email (dev mode)");
  return t;
}

async function sendOTPEmail(email, otp, purpose) {
  try {
    const transporter = await getTransporter();
    const subject = purpose === "verify" ? "Verify your HireHub email" : "HireHub Password Reset OTP";
    const heading  = purpose === "verify" ? "Email Verification" : "Password Reset OTP";
    const subtext  = purpose === "verify"
      ? "Enter this OTP to complete your registration. Expires in <strong>15 minutes</strong>."
      : "Enter this OTP to reset your password. Expires in <strong>15 minutes</strong>.";

    const info = await transporter.sendMail({
      from: `"HireHub" <${process.env.EMAIL_USER || "noreply@hirehub.com"}>`,
      to: email, subject,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#0f0f1a;color:#fff;border-radius:14px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#c9a84c,#a07830);padding:30px;text-align:center;">
            <h1 style="margin:0;font-size:28px;letter-spacing:4px;color:#0a0a14;font-family:Georgia,serif;">HIREHUB</h1>
          </div>
          <div style="padding:40px;text-align:center;">
            <h2 style="color:#c9a84c;margin:0 0 14px;">${heading}</h2>
            <p style="color:#999;margin:0 0 32px;font-size:15px;line-height:1.6;">${subtext}</p>
            <div style="background:#1a1a2e;border:2px solid #c9a84c;border-radius:16px;padding:32px;margin:0 0 28px;">
              <span style="font-size:48px;font-weight:800;letter-spacing:14px;color:#c9a84c;font-family:monospace;">${otp}</span>
            </div>
            <p style="color:#444;font-size:13px;">If you didn't request this, ignore this email.</p>
          </div>
          <div style="background:#0a0a14;padding:16px;text-align:center;">
            <p style="color:#333;font-size:12px;margin:0;">© 2026 HireHub</p>
          </div>
        </div>`,
    });
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`OTP preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`OTP email sent to ${email}`);
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
}

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// ── Google OAuth ──────────────────────────────────────────────
// Capture the frontend origin in a state param so the callback can
// redirect back to wherever the user started (localhost OR Vercel).
router.get("/google", (req, res, next) => {
  const referer = req.get('Referer') || req.get('Origin') || '';
  // Determine frontend origin from referer/origin; fall back to env
  let frontendOrigin = process.env.CLIENT_URL || 'https://hirehub-silk.vercel.app';
  if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
    frontendOrigin = 'http://localhost:3000';
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: Buffer.from(frontendOrigin).toString('base64'),
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureMessage: true }),
  (req, res) => {
    try {
      // Decode origin from state param
      const stateRaw = req.query.state || '';
      let frontendOrigin;
      try {
        frontendOrigin = Buffer.from(stateRaw, 'base64').toString('utf8');
        // Validate it is actually a URL
        new URL(frontendOrigin);
      } catch (_) {
        frontendOrigin = process.env.CLIENT_URL || 'https://hirehub-silk.vercel.app';
      }
      const token = signToken(req.user._id);
      res.redirect(`${frontendOrigin}/auth/google-success?token=${token}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect(`${process.env.CLIENT_URL || 'https://hirehub-silk.vercel.app'}/login?error=google_auth_failed`);
    }
  }
);

router.post("/google-success", async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    res.json({
      success: true, token,
      user: userObj,
    });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// GET /api/auth/me — return fresh user data from DB (for session restore on page load)
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authenticated." });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
});

// ── Email/Password Auth ───────────────────────────────────────

// POST /api/auth/send-register-otp
router.post("/send-register-otp", otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Please use a real, working email address. Disposable emails are not accepted." });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: "This email is already registered. Please sign in." });

    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = crypto.createHash("sha256").update(otp).digest("hex");
    const expires = Date.now() + 15 * 60 * 1000;

    const pendingToken = jwt.sign(
      { email: email.toLowerCase(), otp: hashed, expires, purpose: "register" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const sent = await sendOTPEmail(email, otp, "verify");
    if (!sent) return res.status(500).json({ success: false, message: "Failed to send OTP email. Please try again." });

    res.json({ success: true, message: "OTP sent! Check your email inbox.", pendingToken });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// POST /api/auth/verify-register-otp
router.post("/verify-register-otp", async (req, res) => {
  try {
    const { pendingToken, otp } = req.body;
    if (!pendingToken || !otp) return res.status(400).json({ success: false, message: "Missing OTP or token." });
    let payload;
    try { payload = jwt.verify(pendingToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ success: false, message: "OTP expired. Please start registration again." }); }
    if (payload.purpose !== "register") return res.status(400).json({ success: false, message: "Invalid token." });
    if (Date.now() > payload.expires) return res.status(400).json({ success: false, message: "OTP expired. Please start again." });
    const hashedInput = require("crypto").createHash("sha256").update(otp.trim()).digest("hex");
    if (hashedInput !== payload.otp) return res.status(400).json({ success: false, message: "Incorrect OTP. Please check and try again." });
    res.json({ success: true, message: "OTP verified!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, password, pendingToken, otp } = req.body;
    if (!pendingToken || !otp) return res.status(400).json({ success: false, message: "Please verify your email first." });
    if (!name || name.trim().length < 2) return res.status(400).json({ success: false, message: "Please enter your full name." });
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!password || !pwRegex.test(password)) return res.status(400).json({ success: false, message: "Password must be 8+ characters with uppercase, lowercase, number and special character." });

    let payload;
    try { payload = jwt.verify(pendingToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ success: false, message: "OTP expired. Please start registration again." }); }
    if (payload.purpose !== "register") return res.status(400).json({ success: false, message: "Invalid registration token." });
    if (Date.now() > payload.expires) return res.status(400).json({ success: false, message: "OTP has expired. Please start again." });
    const hashedInput = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (hashedInput !== payload.otp) return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });

    const email = payload.email;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered." });

    const count = await User.countDocuments();
    const role  = count === 0 ? "admin" : "user";
    const user  = await User.create({ name: name.trim(), email, password, role });
    const token = signToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: userObj,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/update-profile
router.post("/update-profile", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authenticated." });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const updatableFields = [
      "name", "phone", "city", "state", "country", "dob", "headline", "about", 
      "skills", "preferredRole", "preferredLocation", "employmentType", "expectedSalary", 
      "experienceLevel", "workPreference", "socialLinkedIn", "socialGitHub", 
      "socialPortfolio", "socialLeetCode", "socialHackerRank"
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.name && req.body.name.trim().length >= 2) {
      user.name = req.body.name.trim();
    }
    
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    
    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF or DOCX files allowed"));
  },
});

// POST /api/auth/upload-resume
router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authenticated." });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (!req.file) return res.status(400).json({ success: false, message: "No resume uploaded." });

    if (user.resumeFilename) {
      const Application = require("../models/Application");
      const isUsed = await Application.exists({ resumeFilename: user.resumeFilename });
      if (!isUsed) {
        try { fs.unlinkSync(path.join("uploads", user.resumeFilename)); } catch {}
      }
    }

    user.resumeFilename = req.file.filename;
    user.resumeOriginalName = req.file.originalname;
    user.resumeUploadedAt = new Date();
    
    if (req.body.skills) {
      try { user.skills = JSON.parse(req.body.skills); } catch {}
    }

    await user.save();
    const userObj = user.toObject(); delete userObj.password; userObj.id = userObj._id;
    res.json({ success: true, user: userObj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/auth/delete-resume
router.delete("/delete-resume", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authenticated." });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (user.resumeFilename) {
      const Application = require("../models/Application");
      const isUsed = await Application.exists({ resumeFilename: user.resumeFilename });
      if (!isUsed) {
        try { fs.unlinkSync(path.join("uploads", user.resumeFilename)); } catch {}
      }
    }
    user.resumeFilename = "";
    user.resumeOriginalName = "";
    user.resumeUploadedAt = null;

    await user.save();
    const userObj = user.toObject(); delete userObj.password; userObj.id = userObj._id;
    res.json({ success: true, user: userObj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/change-password
router.post("/change-password", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authenticated." });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (!user.password) return res.status(400).json({ success: false, message: "Cannot change password for Google accounts." });

    const { currentPassword, newPassword } = req.body;
    if (!await user.comparePassword(currentPassword)) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!pwRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must be 8+ characters with uppercase, lowercase, number and special character." });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.json({ success: true, message: "If that email is registered, an OTP has been sent." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP        = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOTPExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(email, otp, "reset");
    res.json({ success: true, message: "OTP sent to your registered email." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const hashed = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    const user   = await User.findOne({
      email: email?.toLowerCase(),
      resetOTP: hashed,
      resetOTPExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    const resetToken = jwt.sign({ id: user._id, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    res.json({ success: true, resetToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== "reset") return res.status(400).json({ success: false, message: "Invalid reset token." });
    const user = await User.findById(decoded.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password reset successfully! Please sign in." });
  } catch {
    res.status(400).json({ success: false, message: "Reset link expired. Please try again." });
  }
});

// ── Middleware ────────────────────────────────────────────────
async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer "))
      return res.status(401).json({ success: false, message: "Not authenticated. Please login." });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ success: false, message: "User no longer exists." });
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ success: false, message: "Admin access required." });
  next();
}


// DELETE /api/auth/delete-account
router.delete("/delete-account", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // Delete all applications by this user
    const Application = require("../models/Application");
    const userApps = await Application.find({ candidateEmail: req.user.email });
    // Delete resume files
    const fs = require("fs");
    const path = require("path");
    for (const app of userApps) {
      if (app.resumeFilename) {
        try { fs.unlinkSync(path.join("uploads", app.resumeFilename)); } catch {}
      }
    }
    await Application.deleteMany({ candidateEmail: req.user.email });
    
    // Delete profile resume if exists
    if (req.user.resumeFilename) {
      try { fs.unlinkSync(path.join("uploads", req.user.resumeFilename)); } catch {}
    }

    // Delete user
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/seed", async (req, res) => {
  try {
    const seedLogic = require("../seedJobs");
    await seedLogic();
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.protect   = protect;
module.exports.adminOnly = adminOnly;