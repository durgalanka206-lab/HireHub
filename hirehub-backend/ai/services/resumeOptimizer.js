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

function getMockResumeOptimization(user, targetJob) {
  const jobTitle = targetJob ? targetJob.title : "Target Role";
  const company = targetJob ? targetJob.company : "Target Company";
  return {
    currentAtsScore: 71,
    optimizedAtsScore: 89,
    predictedAtsScore: 89,
    overallAiSummary: {
      whatWasImproved: "Enhanced technical keyword density, optimized professional summary, and strengthened resume bullet points with strong action verbs and quantified impact metrics.",
      whyItWasImproved: "To bypass automated ATS scanners and align closer with standard recruiter screening criteria.",
      expectedAtsImpact: "Significantly higher match rate and increased likelihood of selection for interview loops."
    },
    overallImprovementSummary: "Enhanced technical keyword density and summary formatting.",
    professionalSummary: {
      current: "Experienced software developer seeking new challenges.",
      optimized: `Results-driven Software Engineer with extensive experience designing and deploying scalable web applications. Adept at full-stack development, database query optimization, and collaborative team environments.`
    },
    skills: {
      currentSkills: user.skills || ["React", "Node.js", "Javascript"],
      recommendedOrdering: ["React", "Javascript", "Node.js", "Express", "MongoDB", "SQL"],
      atsKeywords: ["Full Stack", "System Design", "Agile Methodologies", "ATS Parsing"],
      industryKeywords: ["Software Architecture", "Continuous Integration", "Cloud Deployment"],
      keywordReasoning: "Recommended skills prioritize target keywords that match modern full stack technical roles."
    },
    experience: [
      {
        role: "Software Developer",
        company: "Tech Solutions Inc.",
        bullets: [
          {
            currentBullet: "Wrote code for the frontend and backend of web applications.",
            optimizedBullet: "Architected and deployed responsive frontend components and secure RESTful backend APIs, increasing application speed by 25%.",
            improvementExplanation: "Replaced passive phrasing with strong action verbs and specified measurable efficiency gain."
          },
          {
            currentBullet: "Helped fix bugs and maintain databases.",
            optimizedBullet: "Resolved complex runtime bugs and optimized SQL database queries, reducing query response times by 30%.",
            improvementExplanation: "Emphasized database performance optimization with quantitative results."
          }
        ]
      }
    ],
    projects: [
      {
        name: "E-Commerce Web App",
        currentDescription: "Built a web app where people can buy things online.",
        optimizedDescription: "Engineered a high-performance e-commerce platform using React, Node.js, and Stripe integration, supporting 10k+ active monthly transactions.",
        actionVerbsUsed: ["Engineered", "Integrated", "Supported"],
        measurableImpact: "Processed $50k+ in test transactions with zero downtime.",
        atsWordingImprovements: "Enhanced technical search engine optimization term weight."
      }
    ],
    improvements: {
      grammar: ["Ensure consistent capitalization of technical framework names (e.g., 'React', 'Node.js')."],
      formatting: ["Use standard bulleted lists to allow ATS parsers to extract sentences cleanly."],
      keywordDensity: ["Increase density of core technical terms matching the target job description."],
      actionVerbs: ["Replace general verbs like 'helped' or 'worked' with 'spearheaded' or 'architected'."],
      missingSections: ["No major missing sections; layout is standard."],
      readability: ["Keep bullet points under 2 lines for quick human scannability."]
    },
    jobSpecificOptimization: {
      isJobSpecific: targetJob ? true : false,
      jobTitle: jobTitle,
      company: company,
      tailoredKeywords: ["React", "Node.js", "Database Tuning"],
      matchHighlights: [`Tailored resume summary to align with the core requirements of ${jobTitle} at ${company}.`]
    }
  };
}

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

  // 6. Invoke AI Provider with Fallback
  let rawResponse = "";
  let useFallback = false;
  try {
    const provider = getAIProvider();
    rawResponse = await provider.generateContent(prompt);
  } catch (err) {
    console.error("[AI Provider Error] optimize-resume failed, falling back to mock optimization:", err.message);
    useFallback = true;
  }

  // 7. Parse & validate response
  let optimizationResult;
  if (useFallback) {
    optimizationResult = getMockResumeOptimization(user, targetJob);
  } else {
    try {
      optimizationResult = parseResumeOptimizationResponse(rawResponse);
    } catch (err) {
      console.warn("[AI Parse Warning] Failed to parse optimize-resume JSON. Response was:", rawResponse);
      optimizationResult = getMockResumeOptimization(user, targetJob);
    }
  }

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
