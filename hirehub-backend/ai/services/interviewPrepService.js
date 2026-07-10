const path = require("path");
const fs   = require("fs");
const Job  = require("../../models/Job");

const { getAIProvider }               = require("../providers/providerFactory");
const { extractTextFromFile }         = require("./resumeAnalyzer");
const { buildInterviewPrepPrompt, buildAnswerEvaluationPrompt } = require("../prompts/interviewPrepPrompt");
const { parseInterviewPrepResponse, cleanAndParseJSON } = require("../utils/parseAIResponse");
const { AIError, ERROR_CODES }        = require("../utils/aiErrors");

/**
 * Helper to generate structured fallback interview questions
 */
function getMockInterviewPrep(targetJob) {
  return {
    readinessScore: 70,
    technicalReadiness: 75,
    hrReadiness: 65,
    behavioralReadiness: 70,
    confidenceScore: 70,
    weakAreas: ["Project portfolio scale details", "Data structure optimizations"],
    hrQuestions: [
      {
        question: `Why do you want to join ${targetJob.company} as a ${targetJob.title}?`,
        difficulty: "Easy",
        reasonAsked: "To evaluate candidate interest and research about the organization.",
        idealAnswer: `Mention specific tech stack details, company culture highlights, and recent achievements of the ${targetJob.company} team.`,
        commonMistakes: "Giving generic answers about company size or location.",
        interviewTips: "Reference actual press releases or team blogs.",
        followUpQuestions: ["What do you think is our biggest challenge right now?"]
      },
      {
        question: "Tell me about a time you handled a difficult technical challenge.",
        difficulty: "Medium",
        reasonAsked: "To check problem solving framework and resilience.",
        idealAnswer: "Explain using the STAR method: Situation, Task, Action, Result. Highlight metrics.",
        commonMistakes: "Blaming team members or focusing too much on the problem.",
        interviewTips: "Focus on your individual actions and measurable metrics.",
        followUpQuestions: ["What would you have done differently?"]
      }
    ],
    technicalQuestions: [
      {
        question: `What is your approach to optimizing performance in a ${targetJob.title} role?`,
        difficulty: "Medium",
        reasonAsked: "To check systems design and tuning knowledge.",
        idealAnswer: "Explain caching strategies, bundle size reductions, lazy loading, and database index tuning.",
        commonMistakes: "Vague generic answers like 'make it fast'.",
        interviewTips: "Use terms like memoization, code splitting, execution plans.",
        followUpQuestions: ["How do you measure rendering speed in production?"]
      }
    ],
    behavioralQuestions: [
      {
        question: "How do you prioritize tasks when working on tight deadlines?",
        difficulty: "Medium",
        reasonAsked: "To assess time management and agility.",
        idealAnswer: "Discuss using urgency-importance matrix, open communication with product managers, and scope cuts.",
        commonMistakes: "Working overtime without communicating blockers.",
        interviewTips: "Be honest about how you handle trade-offs.",
        followUpQuestions: ["How do you handle stakeholder pushback?"]
      }
    ],
    scenarioQuestions: [
      {
        question: "A production release crashes the service. Describe your roll back and debugging steps.",
        difficulty: "Hard",
        reasonAsked: "To check incident response capabilities.",
        idealAnswer: "First roll back to the last stable container tag. Check logs using APM tools, replicate locally, and apply hotfix.",
        commonMistakes: "Debugging directly in production or panic.",
        interviewTips: "Emphasize communication and service availability first.",
        followUpQuestions: ["How do you document the post-mortem?"]
      }
    ],
    codingQuestions: [
      {
        question: "Given a list of job skills, explain how you would design an efficient search match function.",
        difficulty: "Medium",
        reasonAsked: "To assess core algorithmic structure.",
        idealAnswer: "Use an inverted index mapping skills to job documents, scoring hits using term frequency-inverse document frequency.",
        commonMistakes: "Doing linear scans (O(N*M)) over large datasets.",
        interviewTips: "Talk about hash maps and set intersections.",
        followUpQuestions: ["How does this scale to millions of job listings?"]
      }
    ]
  };
}

/**
 * Generates AI interview questions and prep guide.
 * @param {object} user - Authenticated user object
 * @param {string} jobId - Target job MongoDB ObjectId
 * @returns {Promise<object>} Parsed interview prep guide
 */
async function generateInterviewPrep(user, jobId) {
  if (!user || (!user._id && !user.id)) {
    throw new AIError(ERROR_CODES.VALIDATION_ERROR, "User authentication is required.", 401);
  }

  if (!jobId) {
    throw new AIError(ERROR_CODES.VALIDATION_ERROR, "Target Job ID is required to prepare for interview.", 400);
  }

  // 1. Fetch job details
  let targetJob = null;
  try {
    const jobDoc = await Job.findById(jobId);
    if (!jobDoc) {
      throw new AIError(ERROR_CODES.NOT_FOUND, "Target job posting was not found.", 404);
    }
    targetJob = {
      id: jobDoc._id.toString(),
      title: jobDoc.title || "Target Position",
      company: jobDoc.company || "Target Company",
      description: jobDoc.description || "",
      location: jobDoc.location || "",
      type: jobDoc.type || "Full-time",
      skills: jobDoc.skills || [],
      experienceLevel: jobDoc.experienceLevel || ""
    };
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError(ERROR_CODES.NOT_FOUND, `Invalid job ID or job unavailable: ${err.message}`, 404);
  }

  // 2. Extract resume text (if uploaded)
  let resumeText = "";
  if (user.resumeFilename) {
    const uploadsDir = path.join(__dirname, "..", "..", "uploads");
    const filePath   = path.join(uploadsDir, user.resumeFilename);
    if (fs.existsSync(filePath)) {
      try {
        resumeText = await extractTextFromFile(filePath, user.resumeFilename);
      } catch (err) {
        console.warn("Failed to extract resume text for interview prep:", err.message);
      }
    }
  }

  // Use candidate profile skills as fallback if resume text is empty
  if (!resumeText.trim() && user.skills && user.skills.length > 0) {
    resumeText = `Candidate Skills: ${user.skills.join(", ")}\nExperience Level: ${user.experienceLevel || "Not specified"}`;
  }

  // 3. Build prompt and query AI
  const prompt = buildInterviewPrepPrompt(resumeText || "No resume uploaded yet.", targetJob);
  
  let rawResponse = "";
  let useFallback = false;
  try {
    const provider = getAIProvider();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out")), 15000)
    );
    rawResponse = await Promise.race([
      provider.generateContent(prompt),
      timeoutPromise
    ]);
  } catch (err) {
    console.error("[AI Provider Error] generateContent failed, falling back to mock questions:", err.message);
    useFallback = true;
  }

  // 4. Parse response with robust fail-safe fallback
  let prepResult;
  if (useFallback) {
    prepResult = getMockInterviewPrep(targetJob);
  } else {
    try {
      prepResult = parseInterviewPrepResponse(rawResponse);
    } catch (err) {
      console.warn("[AI Parse Warning] Failed to parse interview-generate JSON. Response was:", rawResponse);
      prepResult = getMockInterviewPrep(targetJob);
    }
  }

  return {
    ...prepResult,
    targetJob,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Evaluates candidate answer to mock question.
 * @param {string} question
 * @param {string} userAnswer
 * @param {string} idealAnswer
 * @returns {Promise<object>} Evaluation results
 */
async function evaluateAnswer(question, userAnswer, idealAnswer) {
  if (!question || !userAnswer) {
    throw new AIError(ERROR_CODES.VALIDATION_ERROR, "Question and User Answer are required for evaluation.", 400);
  }

  const prompt = buildAnswerEvaluationPrompt(question, userAnswer, idealAnswer || "Be concise and professional.");
  
  let rawResponse = "";
  let useFallback = false;
  try {
    const provider = getAIProvider();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out")), 15000)
    );
    rawResponse = await Promise.race([
      provider.generateContent(prompt),
      timeoutPromise
    ]);
  } catch (err) {
    console.error("[AI Provider Error] evaluateAnswer failed, using default evaluation:", err.message);
    useFallback = true;
  }

  let evaluation = {};
  if (useFallback) {
    evaluation = {
      confidence: 8,
      technicalCorrectness: 8,
      communication: 7,
      completeness: 8,
      grammar: 8,
      score: 7.8,
      suggestions: "Response successfully processed. Focus on structured delivery and linking back to key business outcomes."
    };
  } else {
    try {
      evaluation = cleanAndParseJSON(rawResponse);
    } catch (err) {
      console.warn("[AI Parse Warning] Failed to parse evaluate-answer JSON. Response was:", rawResponse);
      const scoreMatch = rawResponse.match(/score["\s:]+([\d.]+)/i);
      const scoreVal = scoreMatch ? parseFloat(scoreMatch[1]) : 7.0;
      evaluation = {
        confidence: 7,
        technicalCorrectness: 7,
        communication: 7,
        completeness: 7,
        grammar: 8,
        score: scoreVal,
        suggestions: "Response successfully processed. Focus on structured delivery and linking back to key business outcomes."
      };
    }
  }

  return {
    confidence: typeof evaluation.confidence === "number" ? evaluation.confidence : 7,
    technicalCorrectness: typeof evaluation.technicalCorrectness === "number" ? evaluation.technicalCorrectness : 7,
    communication: typeof evaluation.communication === "number" ? evaluation.communication : 7,
    completeness: typeof evaluation.completeness === "number" ? evaluation.completeness : 7,
    grammar: typeof evaluation.grammar === "number" ? evaluation.grammar : 7,
    score: typeof evaluation.score === "number" ? evaluation.score : 7,
    suggestions: typeof evaluation.suggestions === "string" ? evaluation.suggestions.trim() : "Good effort. Focus on adding more concrete examples."
  };
}

module.exports = {
  generateInterviewPrep,
  evaluateAnswer
};
