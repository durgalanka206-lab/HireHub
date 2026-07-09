/**
 * AI Routes — /api/ai
 *
 * All AI-powered HTTP endpoints live here.
 * Routes handle authentication and delegate to domain services in backend/ai/services/.
 *
 * Endpoints:
 *   POST /api/ai/analyze-resume — Analyze the authenticated user's uploaded resume
 *   POST /api/ai/job-match      — Evaluate candidate fit for a specific job posting
 */

const express = require("express");
const router  = express.Router();

const { protect }               = require("./auth");
const { analyzeUserResume }     = require("../ai/services/resumeAnalyzer");
const { analyzeJobMatch }       = require("../ai/services/jobMatchAnalyzer");
const { formatAIErrorResponse } = require("../ai/utils/aiErrors");

const { optimizeUserResume }     = require("../ai/services/resumeOptimizer");

/**
 * POST /api/ai/analyze-resume
 * Analyzes the authenticated user's uploaded resume using the configured AI provider.
 * Headers: Authorization: Bearer <token>
 */
router.post("/analyze-resume", protect, async (req, res) => {
  try {
    const analysis = await analyzeUserResume(req.user);

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    console.error("[AI Route Error] analyze-resume:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/ai/job-match
 * Evaluates candidate resume against a specific target job posting.
 * Headers: Authorization: Bearer <token>
 * Body: { jobId: string }
 */
router.post("/job-match", protect, async (req, res) => {
  try {
    const { jobId } = req.body;
    const result = await analyzeJobMatch(req.user, jobId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[AI Route Error] job-match:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/ai/optimize-resume
 * Generates an AI-optimized version of the authenticated user's resume.
 * Headers: Authorization: Bearer <token>
 * Body: { jobId?: string }
 */
router.post("/optimize-resume", protect, async (req, res) => {
  try {
    const { jobId } = req.body || {};
    const result = await optimizeUserResume(req.user, jobId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[AI Route Error] optimize-resume:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

const { generateCoverLetter }   = require("../ai/services/coverLetterGenerator");

/**
 * POST /api/ai/generate-cover-letter
 * Generates a personalized, ATS-friendly cover letter for the specified target job.
 * Headers: Authorization: Bearer <token>
 * Body: { jobId: string, tone?: string }
 */
router.post("/generate-cover-letter", protect, async (req, res) => {
  try {
    const { jobId, tone } = req.body || {};
    const result = await generateCoverLetter(req.user, jobId, tone);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[AI Route Error] generate-cover-letter:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

const { generateInterviewPrep, evaluateAnswer } = require("../ai/services/interviewPrepService");
const InterviewPrep = require("../models/InterviewPrep");

/**
 * POST /api/ai/interview/generate
 * Body: { jobId }
 */
router.post("/interview/generate", protect, async (req, res) => {
  try {
    const { jobId } = req.body;
    const result = await generateInterviewPrep(req.user, jobId);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[AI Route Error] interview-generate:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/ai/interview/evaluate-answer
 * Body: { question, answer, idealAnswer }
 */
router.post("/interview/evaluate-answer", protect, async (req, res) => {
  try {
    const { question, answer, idealAnswer } = req.body;
    const result = await evaluateAnswer(question, answer, idealAnswer);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[AI Route Error] interview-evaluate-answer:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/ai/interview/save
 * Body: { jobId, jobTitle, company, questions, scorecard }
 */
router.post("/interview/save", protect, async (req, res) => {
  try {
    const { jobId, jobTitle, company, questions, scorecard } = req.body;
    const prepDoc = await InterviewPrep.create({
      user: req.user._id,
      job: jobId,
      jobTitle,
      company,
      questions,
      scorecard
    });
    return res.json({ success: true, data: prepDoc });
  } catch (err) {
    console.error("[AI Route Error] interview-save:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/ai/interview/history
 */
router.get("/interview/history", protect, async (req, res) => {
  try {
    const history = await InterviewPrep.find({ user: req.user._id })
      .sort({ interviewDate: -1 })
      .populate("job", "title company logo");
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error("[AI Route Error] interview-history:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/ai/interview/:id
 */
router.get("/interview/:id", protect, async (req, res) => {
  try {
    const prepDoc = await InterviewPrep.findOne({ _id: req.params.id, user: req.user._id })
      .populate("job", "title company logo");
    if (!prepDoc) {
      return res.status(404).json({ success: false, message: "Interview session not found." });
    }
    return res.json({ success: true, data: prepDoc });
  } catch (err) {
    console.error("[AI Route Error] interview-get-by-id:", err.message);
    const { statusCode, body } = formatAIErrorResponse(err);
    return res.status(statusCode).json(body);
  }
});

module.exports = router;
