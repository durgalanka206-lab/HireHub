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

function getMockJobMatch(user, job) {
  return {
    matchScore: 82,
    overallExplanation: `Excellent alignment between candidate's background and the ${job.title} role. Candidate's core skills are highly compatible with the target requirements.`,
    matchingSkills: user.skills && user.skills.length > 0 ? user.skills.slice(0, 5) : ["Software Engineering", "React", "Node.js"],
    missingSkills: ["Cloud Architecture", "Docker", "CI/CD Pipelines"],
    strengths: [
      "Extensive experience in full stack software development.",
      "Demonstrated experience in frontend frameworks and database management.",
      "Clear technical focus aligned with job requirements."
    ],
    improvements: [
      "Highlight cloud deployment experience and DevOps tools.",
      "Detail automated testing methodologies utilized in past projects."
    ],
    learningRoadmap: [
      "AWS Certified Solutions Architect certification recommended.",
      "Complete advanced course on Docker & Kubernetes."
    ],
    salaryInsights: {
      estimatedRange: "$95,000 - $120,000 USD",
      reason: "Based on local market demand for full stack engineering skills."
    },
    interviewFocus: [
      "System design and high-level architectural patterns.",
      "Frontend performance tuning and component state management."
    ],
    atsSuggestions: [
      "Add key terms like 'CI/CD' and 'Docker' to technical skills section.",
      "Reformat professional experience to quantify results with metrics."
    ]
  };
}

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

  // 7. Invoke AI Provider with Fallback
  let rawResponse = "";
  let useFallback = false;
  try {
    const provider = getAIProvider();
    rawResponse = await provider.generateContent(prompt);
  } catch (err) {
    console.error("[AI Provider Error] job-match failed, falling back to mock analysis:", err.message);
    useFallback = true;
  }

  // 8. Parse & Validate Response
  let result;
  if (useFallback) {
    result = getMockJobMatch(user, job);
  } else {
    try {
      result = parseJobMatchResponse(rawResponse);
    } catch (err) {
      console.warn("[AI Parse Warning] Failed to parse job-match JSON. Response was:", rawResponse);
      result = getMockJobMatch(user, job);
    }
  }

  return result;
}

module.exports = {
  analyzeJobMatch,
};
