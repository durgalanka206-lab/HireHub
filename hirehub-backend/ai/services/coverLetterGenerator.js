/**
 * Cover Letter Generator Service
 *
 * Domain service for Phase 4 AI Cover Letter Generator.
 * Extracts candidate resume text, fetches target job details,
 * invokes AI provider with tone directives and anti-fabrication prompt, and parses structured cover letter.
 */

const path = require("path");
const fs   = require("fs");
const Job  = require("../../models/Job");

const { getAIProvider }               = require("../providers/providerFactory");
const { extractTextFromFile }         = require("./resumeAnalyzer");
const { buildCoverLetterPrompt }      = require("../prompts/coverLetterPrompt");
const { parseCoverLetterResponse }    = require("../utils/parseAIResponse");
const { AIError, ERROR_CODES }        = require("../utils/aiErrors");

/**
 * Generates a personalized cover letter for the user targeting a specific job.
 * @param {object} user - Authenticated user object
 * @param {string} jobId - Target job MongoDB ObjectId
 * @param {string} tone - Tone option ('Professional' | 'Confident' | 'Friendly' | 'Formal')
 * @returns {Promise<object>} Parsed cover letter result
 */
async function generateCoverLetter(user, jobId, tone = "Professional") {
  // 1. Authentication & Validation
  if (!user || (!user._id && !user.id)) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "User authentication is required.",
      401
    );
  }

  if (!jobId) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "Target Job ID is required to generate a cover letter.",
      400
    );
  }

  if (!user.resumeFilename) {
    throw new AIError(
      ERROR_CODES.VALIDATION_ERROR,
      "No resume found. Please upload a resume in your profile before generating a cover letter.",
      400
    );
  }

  // 2. Fetch target job
  let targetJob = null;
  try {
    const jobDoc = await Job.findById(jobId);
    if (!jobDoc) {
      throw new AIError(
        ERROR_CODES.NOT_FOUND,
        "Target job posting was not found.",
        404
      );
    }
    targetJob = {
      id: jobDoc._id.toString(),
      title: jobDoc.title || "Target Position",
      company: jobDoc.company || "Target Company",
      description: jobDoc.description || "",
      location: jobDoc.location || "",
      type: jobDoc.type || "Full-time",
    };
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError(
      ERROR_CODES.NOT_FOUND,
      `Invalid job ID or job unavailable: ${err.message}`,
      404
    );
  }

  // 3. Locate & extract resume text
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
  const trimmed = (resumeText || "").trim();

  if (trimmed.length < 50) {
    throw new AIError(
      ERROR_CODES.RESUME_PARSE_ERROR,
      "Could not extract sufficient text from your resume. Please ensure it is a text-based PDF or DOCX file.",
      422
    );
  }

  // 4. Build prompt & invoke AI provider
  const validTone = ["Professional", "Confident", "Friendly", "Formal"].includes(tone) ? tone : "Professional";
  const prompt = buildCoverLetterPrompt(trimmed, targetJob, validTone);

  const provider = getAIProvider();
  const rawResponse = await provider.generateContent(prompt);

  // 5. Parse & validate response
  const coverLetterResult = parseCoverLetterResponse(rawResponse);

  return {
    ...coverLetterResult,
    targetJob,
    tone: validTone,
    candidateName: user.name || "Candidate Name",
    candidateEmail: user.email || "",
    candidatePhone: user.phone || "",
    resumeOriginalName: user.resumeOriginalName || user.resumeFilename || "Uploaded Resume",
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateCoverLetter,
};
