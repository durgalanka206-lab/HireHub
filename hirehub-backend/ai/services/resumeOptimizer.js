/**
 * Resume Optimizer Service
 *
 * Domain service for Phase 3 AI Resume Optimizer.
 * Extracts text from candidate's uploaded resume, fetches optional target job context,
 * invokes AI provider with strict anti-fabrication prompt, and parses structured optimization result.
 */

const path = require("path");
const fs   = require("fs");
const Job  = require("../../models/Job");

const { getAIProvider }                     = require("../providers/providerFactory");
const { extractTextFromFile }               = require("./resumeAnalyzer");
const { buildResumeOptimizationPrompt }     = require("../prompts/resumeOptimizerPrompt");
const { parseResumeOptimizationResponse }   = require("../utils/parseAIResponse");
const { AIError, ERROR_CODES }              = require("../utils/aiErrors");

/**
 * Optimizes user's uploaded resume, optionally tailored for a target job.
 * @param {object} user - Authenticated user model object
 * @param {string|null} jobId - Optional MongoDB ObjectId of target job
 * @returns {Promise<object>} Parsed optimization response object
 */
async function optimizeUserResume(user, jobId = null) {
  // 1. Authentication & Validation
  if (!user || (!user._id && !user.id)) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "User authentication is required.",
      401
    );
  }

  if (!user.resumeFilename) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "No resume found. Please upload a resume in your profile before optimizing.",
      400
    );
  }

  // 2. Locate uploaded resume file
  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  const filePath   = path.join(uploadsDir, user.resumeFilename);

  if (!fs.existsSync(filePath)) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Uploaded resume file was not found on server. Please re-upload your resume.",
      404
    );
  }

  // 3. Extract text from resume
  const resumeText = await extractTextFromFile(filePath, user.resumeFilename);
  const trimmed = (resumeText || "").trim();

  if (trimmed.length < 50) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Could not extract sufficient text from your resume. Please ensure it is a text-based PDF or DOCX file.",
      422
    );
  }

  // 4. Fetch optional target job details if jobId provided
  let targetJob = null;
  if (jobId) {
    try {
      const jobDoc = await Job.findById(jobId);
      if (jobDoc) {
        targetJob = {
          id: jobDoc._id.toString(),
          title: jobDoc.title || "",
          company: jobDoc.company || "",
          description: jobDoc.description || "",
        };
      }
    } catch (err) {
      console.warn("[Resume Optimizer] Failed to load job context for jobId:", jobId, err.message);
    }
  }

  // 5. Build prompt
  const prompt = buildResumeOptimizationPrompt(trimmed, targetJob);

  // 6. Invoke AI Provider
  const provider = getAIProvider();
  const rawResponse = await provider.generateContent(prompt);

  // 7. Parse & validate response
  const optimizationResult = parseResumeOptimizationResponse(rawResponse);

  // Ensure target job info is populated if available
  if (targetJob && !optimizationResult.jobSpecificOptimization.isJobSpecific) {
    optimizationResult.jobSpecificOptimization = {
      isJobSpecific: true,
      jobTitle: targetJob.title,
      company: targetJob.company,
      tailoredKeywords: optimizationResult.skills.atsKeywords || [],
      matchHighlights: ["Tailored resume content to match target role requirements."],
    };
  }

  return optimizationResult;
}

module.exports = {
  optimizeUserResume,
};
