const mongoose = require("mongoose");

const interviewPrepSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    interviewDate: { type: Date, default: Date.now },
    questions: [
      {
        question: { type: String, required: true },
        type: { type: String, required: true }, // HR, Technical, Coding, Scenario, Behavioral, Aptitude
        difficulty: { type: String, required: true }, // Easy, Medium, Hard
        whyInterviewerAsks: { type: String },
        idealAnswer: { type: String },
        commonMistakes: { type: String },
        tips: { type: String },
        followUpQuestions: [{ type: String }],
        userAnswer: { type: String },
        evaluation: {
          confidence: { type: Number },
          technicalCorrectness: { type: Number },
          communication: { type: Number },
          completeness: { type: Number },
          grammar: { type: Number },
          score: { type: Number },
          suggestions: { type: String }
        }
      }
    ],
    scorecard: {
      overallScore: { type: Number },
      technicalScore: { type: Number },
      hrScore: { type: Number },
      communicationScore: { type: Number },
      confidenceScore: { type: Number },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendedImprovements: [{ type: String }],
      estimatedInterviewReadiness: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewPrep", interviewPrepSchema);
