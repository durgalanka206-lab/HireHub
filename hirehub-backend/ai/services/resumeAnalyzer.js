/**
 * Resume Analyzer Service
 *
 * Core domain service for the AI Resume Analyzer feature.
 * Handles text extraction, request validation, prompt building, provider invocation, and response parsing.
 */

const path = require("path");
const fs   = require("fs");
const pdfParse = require("pdf-parse");
const mammoth  = require("mammoth");

const { getAIProvider }             = require("../providers/providerFactory");
const { buildResumeAnalysisPrompt } = require("../prompts/resumeAnalysisPrompt");
const { parseAIResponse }           = require("../utils/parseAIResponse");
const { AIError, ERROR_CODES }      = require("../utils/aiErrors");

/**
 * Extract plain text from PDF or DOCX file.
 * @param {string} filePath - Absolute file path on disk
 * @param {string} filename - Original filename
 * @returns {Promise<string>}
 */
async function extractTextFromFile(filePath, filename) {
  const ext = path.extname(filename || filePath).toLowerCase();

  try {
    if (ext === ".pdf") {
      const buffer = fs.readFileSync(filePath);
      const data   = await pdfParse(buffer);
      return data.text || "";
    }

    if (ext === ".docx" || ext === ".doc") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }

    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      `Unsupported file format: ${ext}. Only PDF and DOCX files are supported.`,
      400
    );
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      `Failed to parse resume file: ${err.message}`,
      422
    );
  }
}

/**
 * Validates and analyzes a user's uploaded resume.
 * @param {object} user - Authenticated user model object
 * @returns {Promise<object>} Structured analysis JSON
 */
async function analyzeUserResume(user) {
  // 1. Request Validation: authenticated user check
  if (!user || (!user._id && !user.id)) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "User authentication is required.",
      401
    );
  }

  // 2. Request Validation: uploaded resume exists in user profile
  if (!user.resumeFilename) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "No resume found. Please upload a resume in your profile before analyzing.",
      400
    );
  }

  // 3. Request Validation: locate file on server disk
  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  const filePath   = path.join(uploadsDir, user.resumeFilename);

  if (!fs.existsSync(filePath)) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Uploaded resume file was not found on server. Please re-upload your resume.",
      404
    );
  }

  // 4. Request Validation: extract text and verify non-empty + minimum length
  const resumeText = await extractTextFromFile(filePath, user.resumeFilename);
  const trimmed = (resumeText || "").trim();

  if (trimmed.length < 50) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Could not extract sufficient text from your resume. Please ensure it is a text-based PDF or DOCX file.",
      422
    );
  }

  // 5. Build prompt string
  const prompt = buildResumeAnalysisPrompt(trimmed);

  // 6. Invoke AI Provider
  const provider = getAIProvider();
  const rawResponse = await provider.generateContent(prompt);

  // 7. Validate and parse AI Response
  const analysis = parseAIResponse(rawResponse);

  return analysis;
}

module.exports = {
  extractTextFromFile,
  analyzeUserResume,
};
