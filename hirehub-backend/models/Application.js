const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId:          { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  candidateName:  { type: String, required: true },
  candidateEmail: { type: String, required: true },
  resumeFilename: { type: String, required: true },
  skills:         [{ type: String }],
  matchPercent:   { type: Number, default: 0 },
  coverLetter:    { type: String, default: "" },
  status:         { type: String, enum: ["applied","reviewing","shortlisted","rejected","interview"], default: "applied" },
  // Interview scheduler
  interviewDate:  { type: Date },
  interviewTime:  { type: String },
  interviewLink:  { type: String },
  interviewNote:  { type: String },
  // Score breakdown
  matchedSkills:  [{ type: String }],
  missingSkills:  [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);