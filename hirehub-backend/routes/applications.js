const express   = require("express");
const router    = express.Router();
const multer    = require("multer");
const path      = require("path");
const fs        = require("fs");
const pdfParse  = require("pdf-parse");
const nodemailer = require("nodemailer");
const Application = require("../models/Application");
const Job         = require("../models/Job");
const { protect, adminOnly } = require("./auth");

// ── Multer setup ──────────────────────────────────────────────
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

// ── Skill Keywords ────────────────────────────────────────────
const SKILL_KEYWORDS = [
  "java","python","javascript","typescript","c++","c#","rust","go","kotlin","swift",
  "php","ruby","scala","r","dart","bash","shell","matlab","groovy","perl","lua",
  "react","angular","vue","vuejs","nextjs","next.js","nuxt","svelte","html","css",
  "sass","tailwind","bootstrap","jquery","redux","mobx","webpack","vite","figma",
  "material ui","chakra ui","responsive design",
  "node","nodejs","node.js","express","fastapi","flask","django","spring","spring boot",
  "springboot","laravel","rails","graphql","rest","restful","api","microservices",
  "serverless","nestjs","asp.net",".net",
  "sql","mysql","postgresql","postgres","mongodb","redis","elasticsearch","cassandra",
  "dynamodb","firebase","supabase","sqlite","oracle","prisma","neo4j",
  "aws","azure","gcp","google cloud","docker","kubernetes","k8s","jenkins",
  "github actions","ci/cd","terraform","ansible","nginx","linux","devops",
  "machine learning","deep learning","nlp","tensorflow","pytorch","keras",
  "scikit-learn","pandas","numpy","matplotlib","data science","data analysis",
  "statistics","power bi","tableau","spark","hadoop","kafka","computer vision",
  "llm","bert","transformers","opencv",
  "git","github","gitlab","jira","postman","swagger","agile","scrum","linux",
  "ubuntu","windows","vs code","intellij","eclipse",
  "android","ios","react native","flutter","xamarin",
  "selenium","jest","junit","testing","ci","cd","devops","sre","cloud",
];

function extractSkillsFromText(text) {
  const lower = text.toLowerCase()
    .replace(/[•|▪●►▸✓✔→\-–—]/g, " ")
    .replace(/\s+/g, " ");
  const found = SKILL_KEYWORDS.filter(k => {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = k.length <= 3
      ? new RegExp("\\b" + escaped + "\\b", "i")
      : new RegExp(escaped, "i");
    return rx.test(lower);
  });
  return [...new Set(found)];
}

// ── Email helper ──────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"HireHub" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error("Email error:", err.message);
  }
}

// ══════════════════════════════════════════════════════════════
// POST /api/applications/extract-skills
// ══════════════════════════════════════════════════════════════
router.post("/extract-skills", protect, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No resume uploaded." });
    }
    const filePath = path.join(__dirname, "..", req.file.path);
    const buffer   = fs.readFileSync(filePath);
    let rawText = "";
    try {
      const isPDF = req.file.mimetype === "application/pdf";
      if (isPDF) {
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text || "";
      } else {
        // DOCX — use mammoth
        const mammoth = require("mammoth");
        const result  = await mammoth.extractRawText({ buffer });
        rawText = result.value || "";
      }
    } catch (parseErr) {
      console.error("parse error:", parseErr.message);
    }
    const skills = extractSkillsFromText(rawText);
    try { fs.unlinkSync(filePath); } catch {}
    res.json({ success: true, skills, count: skills.length });
  } catch (err) {
    res.status(500).json({ success: false, skills: [], message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/applications  — submit application
// ══════════════════════════════════════════════════════════════
router.post("/", protect, upload.single("resume"), async (req, res) => {
  try {
    const { jobId, candidateName, candidateEmail, skills, matchPercent, coverLetter } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Resume PDF is required." });
    if (!jobId)   return res.status(400).json({ success: false, message: "Job ID is required." });

    const existing = await Application.findOne({ jobId, candidateEmail });
    if (existing) return res.status(400).json({ success: false, message: "You have already applied for this job." });

    const application = await Application.create({
      jobId,
      candidateName,
      candidateEmail,
      skills:         skills ? skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      matchPercent:   Number(matchPercent) || 0,
      coverLetter:    coverLetter || "",
      resumeFilename: req.file.filename,
      status:         "applied",
    });

    const job = await Job.findById(jobId).lean().catch(() => null);

    await sendEmail(candidateEmail, `✅ Application received — ${job?.title || "Job"} at ${job?.company || "Company"}`, `
      <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#0f0f1a;color:#fff;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#c9a84c,#a07830);padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:24px;letter-spacing:3px;color:#0a0a14;">HIREHUB</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#c9a84c;margin:0 0 16px;">Application Received! 🎉</h2>
          <p style="color:#ccc;line-height:1.7;">Hi <strong>${candidateName}</strong>,</p>
          <p style="color:#ccc;line-height:1.7;">Your application for <strong style="color:#c9a84c;">${job?.title || "the position"}</strong> at <strong>${job?.company || "the company"}</strong> has been received.</p>
          <div style="background:#1a1a2e;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#888;font-size:13px;">Match Score</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:${Number(matchPercent)>=70?"#4ade80":Number(matchPercent)>=40?"#fbbf24":"#f87171"};">${matchPercent}%</p>
          </div>
          <p style="color:#555;font-size:13px;">We will notify you when your application status changes.</p>
        </div>
      </div>`
    );

    if (process.env.ADMIN_EMAIL) {
      await sendEmail(process.env.ADMIN_EMAIL, `New application: ${candidateName} → ${job?.title}`, `
        <p>New application received on HireHub.</p>
        <p><strong>Candidate:</strong> ${candidateName} (${candidateEmail})</p>
        <p><strong>Job:</strong> ${job?.title} at ${job?.company}</p>
        <p><strong>Match:</strong> ${matchPercent}%</p>
        <p><strong>Skills:</strong> ${skills}</p>`
      );
    }

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/applications/my  — current user's own applications
// ══════════════════════════════════════════════════════════════
router.get("/my", protect, async (req, res) => {
  try {
    const apps = await Application.find({ candidateEmail: req.user.email })
      .populate("jobId", "title company location salary logo color type tags")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/applications  — admin: get all
// ══════════════════════════════════════════════════════════════
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    if (req.query.jobId && req.query.jobId !== "all") filter.jobId = req.query.jobId;
    if (req.query.search) {
      const rx = new RegExp(req.query.search, "i");
      filter.$or = [{ candidateName: rx }, { candidateEmail: rx }];
    }
    const apps = await Application.find(filter)
      .populate("jobId", "title company location salary type tags logo color requirements")
      .sort({ matchPercent: -1, createdAt: -1 });
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/applications/stats
// ══════════════════════════════════════════════════════════════
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [total, reviewing, shortlisted, rejected, avgArr, recent, dailyTrend, perJob, scoreDistrib] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: "reviewing" }),
      Application.countDocuments({ status: "shortlisted" }),
      Application.countDocuments({ status: "rejected" }),
      Application.aggregate([{ $group: { _id: null, avg: { $avg: "$matchPercent" } } }]),
      Application.find().populate("jobId","title company location salary type tags").sort({ createdAt: -1 }).limit(10),
      Application.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 14*24*60*60*1000) } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Application.aggregate([
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 6 },
        { $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" } },
        { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
        { $project: { title: { $ifNull: ["$job.title", "Unknown"] }, count: 1 } }
      ]),
      Application.aggregate([
        { $bucket: { groupBy: "$matchPercent", boundaries: [0, 40, 70, 101], default: "other", output: { count: { $sum: 1 } } } }
      ]),
    ]);

    const trendMap = {};
    dailyTrend.forEach(d => { trendMap[d._id] = d.count; });
    const trendFilled = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i*24*60*60*1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
      trendFilled.push({ date: key, label, count: trendMap[key] || 0 });
    }

    res.json({
      success: true,
      data: {
        total, reviewing, shortlisted, rejected,
        avgMatchPercent: Math.round(avgArr[0]?.avg || 0),
        recentApplications: recent,
        charts: {
          trend: trendFilled,
          perJob: perJob.map(j => ({ title: j.title, count: j.count })),
          scoreDistrib: [
            { label:"Low (0–39%)",  color:"#f87171", count: scoreDistrib.find(b => b._id===0)?.count  || 0 },
            { label:"Mid (40–69%)", color:"#fbbf24", count: scoreDistrib.find(b => b._id===40)?.count || 0 },
            { label:"High (70%+)",  color:"#4ade80", count: scoreDistrib.find(b => b._id===70)?.count || 0 },
          ],
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/applications/:id/status
// ══════════════════════════════════════════════════════════════
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("jobId", "title company location salary type tags");

    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    const statusLabels = { applied:"Applied", reviewing:"Under Review", shortlisted:"Shortlisted 🎉", rejected:"Not Selected" };
    await sendEmail(app.candidateEmail, `Update on your HireHub application — ${app.jobId?.title}`, `
      <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#0f0f1a;color:#fff;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#c9a84c,#a07830);padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:24px;letter-spacing:3px;color:#0a0a14;">HIREHUB</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#c9a84c;margin:0 0 16px;">Application Status Update</h2>
          <p style="color:#ccc;">Hi <strong>${app.candidateName}</strong>,</p>
          <p style="color:#ccc;">Your application for <strong style="color:#c9a84c;">${app.jobId?.title}</strong> has been updated.</p>
          <div style="background:#1a1a2e;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">New Status</p>
            <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#c9a84c;">${statusLabels[status] || status}</p>
          </div>
        </div>
      </div>`
    );

    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/applications/:id
// ══════════════════════════════════════════════════════════════
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const app = await Application.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Not found." });
    if (app.resumeFilename) try { fs.unlinkSync(path.join("uploads", app.resumeFilename)); } catch {}
    res.json({ success: true, message: "Deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/applications/:id/withdraw - User withdrawal
// ══════════════════════════════════════════════════════════════
router.delete("/:id/withdraw", protect, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, candidateEmail: req.user.email });
    if (!app) return res.status(404).json({ success: false, message: "Application not found or unauthorized." });
    await app.deleteOne();
    if (app.resumeFilename) try { fs.unlinkSync(path.join("uploads", app.resumeFilename)); } catch {}
    res.json({ success: true, message: "Application withdrawn." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
