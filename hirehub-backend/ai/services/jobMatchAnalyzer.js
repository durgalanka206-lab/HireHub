/**
 * Job Match Analyzer Service
 *
 * Domain service for Phase 2: AI Job Match Explanation.
 * Evaluates user's uploaded resume against a target job posting.
 */

const path = require("path");
const fs   = require("fs");

const Job = require("../../models/Job");
const { getAIProvider }          = require("../providers/providerFactory");
const { buildJobMatchPrompt }   = require("../prompts/jobMatchPrompt");
const { parseJobMatchResponse } = require("../utils/parseAIResponse");
const { extractTextFromFile }   = require("./resumeAnalyzer");
const { AIError, ERROR_CODES }   = require("../utils/aiErrors");

/**
 * Analyzes fit between user's resume and a specific job posting.
 * @param {object} user - Authenticated User model
 * @param {string} jobId - MongoDB ID of the selected job
 * @returns {Promise<object>} Structured Job Match JSON
 */
async function analyzeJobMatch(user, jobId) {
  // 1. User Validation
  if (!user || (!user._id && !user.id)) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "User authentication is required.",
      401
    );
  }

  // 2. Resume Existence Validation
  if (!user.resumeFilename) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "No resume found. Please upload a resume in your profile before performing a Job Match analysis.",
      400
    );
  }

  // 3. Job ID Validation
  if (!jobId) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "Job ID is required for job match analysis.",
      400
    );
  }

  // 4. Load Job from Database
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "Selected job posting was not found.",
      404
    );
  }

  // 5. Locate & Extract Resume Text
  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  const filePath   = path.join(uploadsDir, user.resumeFilename);

  if (!fs.existsSync(filePath)) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Uploaded resume file was not found on server. Please re-upload your resume.",
      404
    );
  }

  const resumeText = await extractTextFromFile(filePath, user.resumeFilename);
  const trimmedText = (resumeText || "").trim();

  if (trimmedText.length < 50) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Could not extract sufficient text from your resume to evaluate job match.",
      422
    );
  }

  // 6. Build Prompt String
  const prompt = buildJobMatchPrompt(trimmedText, job);

  // 7. Invoke AI Provider
  const provider = getAIProvider();
  const rawResponse = await provider.generateContent(prompt);

  // 8. Parse & Validate Response
  const result = parseJobMatchResponse(rawResponse);

  return result;
}

module.exports = {
  analyzeJobMatch,
};
