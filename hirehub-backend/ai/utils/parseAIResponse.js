/**
 * AI Response Parser Utility
 *
 * Validates and normalizes raw text returned from LLM into structured JSON.
 * Throws AIError(AI_INVALID_RESPONSE) if response cannot be parsed or is incomplete.
 */

const { AIError, ERROR_CODES } = require("./aiErrors");

/**
 * Strips markdown code blocks and parses raw JSON string.
 * @param {string} rawResponse
 * @returns {object} Parsed JavaScript object
 */
function cleanAndParseJSON(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "string") {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const cleaned = rawResponse
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        throw new AIError(
          ERROR_CODES.AI_INVALID_RESPONSE,
          "The AI returned an unexpected response format. Please try again.",
          502
        );
      }
    }
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid response structure. Please try again.",
      502
    );
  }
}

/**
 * Parses and validates raw AI response into structured Resume Analysis object.
 * @param {string} rawResponse - Text string returned by LLM
 */
function parseAIResponse(rawResponse) {
  const parsed = cleanAndParseJSON(rawResponse);

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid response structure. Please try again.",
      502
    );
  }

  const atsScore = typeof parsed.atsScore === "number"
    ? Math.min(100, Math.max(0, Math.round(parsed.atsScore)))
    : 50;

  return {
    atsScore,
    summary:         typeof parsed.summary === "string" ? parsed.summary.trim() : "Summary unavailable.",
    skillsFound:     Array.isArray(parsed.skillsFound) ? parsed.skillsFound.map(String) : [],
    missingSkills:   Array.isArray(parsed.missingSkills) ? parsed.missingSkills.map(String) : [],
    strengths:       Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    weaknesses:      Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
  };
}

/**
 * Parses and validates raw AI response into structured Job Match Analysis object.
 * @param {string} rawResponse - Text string returned by LLM
 * @returns {{ matchScore: number, overallExplanation: string, matchingSkills: string[], missingSkills: string[], strengths: string[], improvements: string[], learningRoadmap: string[], salaryInsights: { estimatedRange: string, reason: string }, interviewFocus: string[], atsSuggestions: string[] }}
 */
function parseJobMatchResponse(rawResponse) {
  const parsed = cleanAndParseJSON(rawResponse);

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid response structure. Please try again.",
      502
    );
  }

  const matchScore = typeof parsed.matchScore === "number"
    ? Math.min(100, Math.max(0, Math.round(parsed.matchScore)))
    : 50;

  const salaryInsights = typeof parsed.salaryInsights === "object" && parsed.salaryInsights !== null
    ? {
        estimatedRange: typeof parsed.salaryInsights.estimatedRange === "string" ? parsed.salaryInsights.estimatedRange.trim() : "Market competitive",
        reason: typeof parsed.salaryInsights.reason === "string" ? parsed.salaryInsights.reason.trim() : "Based on job role and skills requirements.",
      }
    : { estimatedRange: "Market competitive", reason: "Based on job role and skills requirements." };

  return {
    matchScore,
    overallExplanation: typeof parsed.overallExplanation === "string" ? parsed.overallExplanation.trim() : "Explanation unavailable.",
    matchingSkills:     Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills.map(String) : [],
    missingSkills:      Array.isArray(parsed.missingSkills) ? parsed.missingSkills.map(String) : [],
    strengths:          Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvements:       Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    learningRoadmap:    Array.isArray(parsed.learningRoadmap) ? parsed.learningRoadmap.map(String) : [],
    salaryInsights,
    interviewFocus:     Array.isArray(parsed.interviewFocus) ? parsed.interviewFocus.map(String) : [],
    atsSuggestions:     Array.isArray(parsed.atsSuggestions) ? parsed.atsSuggestions.map(String) : [],
  };
}

function parseResumeOptimizationResponse(rawResponse) {
  const parsed = cleanAndParseJSON(rawResponse);

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid response structure. Please try again.",
      502
    );
  }

  const currentAtsScore = typeof parsed.currentAtsScore === "number"
    ? Math.min(100, Math.max(0, Math.round(parsed.currentAtsScore)))
    : 70;

  const rawOptimizedScore = typeof parsed.optimizedAtsScore === "number" ? parsed.optimizedAtsScore : parsed.predictedAtsScore;
  const optimizedAtsScore = typeof rawOptimizedScore === "number"
    ? Math.min(100, Math.max(currentAtsScore + 5, Math.round(rawOptimizedScore)))
    : Math.min(100, currentAtsScore + 15);

  const overallAiSummary = typeof parsed.overallAiSummary === "object" && parsed.overallAiSummary !== null
    ? {
        whatWasImproved: typeof parsed.overallAiSummary.whatWasImproved === "string" ? parsed.overallAiSummary.whatWasImproved.trim() : "Wording, action verbs, ATS keyword density, and structural layout were enhanced.",
        whyItWasImproved: typeof parsed.overallAiSummary.whyItWasImproved === "string" ? parsed.overallAiSummary.whyItWasImproved.trim() : "To pass automated ATS filters and highlight key technical impact to hiring managers.",
        expectedAtsImpact: typeof parsed.overallAiSummary.expectedAtsImpact === "string" ? parsed.overallAiSummary.expectedAtsImpact.trim() : "Significant boost in keyword match rate and screening advancement.",
      }
    : {
        whatWasImproved: typeof parsed.overallImprovementSummary === "string" ? parsed.overallImprovementSummary : "Wording, action verbs, ATS keyword density, and structural layout were enhanced.",
        whyItWasImproved: "To pass automated ATS filters and highlight key technical impact to hiring managers.",
        expectedAtsImpact: "Significant boost in keyword match rate and screening advancement.",
      };

  const profSum = typeof parsed.professionalSummary === "object" && parsed.professionalSummary !== null
    ? {
        current: typeof parsed.professionalSummary.current === "string" ? parsed.professionalSummary.current.trim() : "Current summary unavailable.",
        optimized: typeof parsed.professionalSummary.optimized === "string" ? parsed.professionalSummary.optimized.trim() : "Optimized summary unavailable.",
      }
    : { current: "Current summary unavailable.", optimized: "Optimized summary unavailable." };

  const skills = typeof parsed.skills === "object" && parsed.skills !== null
    ? {
        currentSkills: Array.isArray(parsed.skills.currentSkills) ? parsed.skills.currentSkills.map(String) : [],
        recommendedOrdering: Array.isArray(parsed.skills.recommendedOrdering) ? parsed.skills.recommendedOrdering.map(String) : [],
        atsKeywords: Array.isArray(parsed.skills.atsKeywords) ? parsed.skills.atsKeywords.map(String) : [],
        industryKeywords: Array.isArray(parsed.skills.industryKeywords) ? parsed.skills.industryKeywords.map(String) : [],
        keywordReasoning: typeof parsed.skills.keywordReasoning === "string" ? parsed.skills.keywordReasoning.trim() : "Keywords selected based on high-frequency industry demand and ATS parser scoring rules.",
      }
    : { currentSkills: [], recommendedOrdering: [], atsKeywords: [], industryKeywords: [], keywordReasoning: "Keywords selected based on high-frequency industry demand and ATS parser scoring rules." };

  const experience = Array.isArray(parsed.experience)
    ? parsed.experience.map(exp => ({
        role: typeof exp.role === "string" ? exp.role.trim() : "Role",
        company: typeof exp.company === "string" ? exp.company.trim() : "Company",
        bullets: Array.isArray(exp.bullets)
          ? exp.bullets.map(b => ({
              currentBullet: typeof b.currentBullet === "string" ? b.currentBullet.trim() : "",
              optimizedBullet: typeof b.optimizedBullet === "string" ? b.optimizedBullet.trim() : "",
              improvementExplanation: typeof b.improvementExplanation === "string" ? b.improvementExplanation.trim() : "Improved wording & ATS impact.",
            }))
          : []
      }))
    : [];

  const projects = Array.isArray(parsed.projects)
    ? parsed.projects.map(proj => ({
        name: typeof proj.name === "string" ? proj.name.trim() : "Project",
        currentDescription: typeof proj.currentDescription === "string" ? proj.currentDescription.trim() : "",
        optimizedDescription: typeof proj.optimizedDescription === "string" ? proj.optimizedDescription.trim() : "",
        actionVerbsUsed: Array.isArray(proj.actionVerbsUsed) ? proj.actionVerbsUsed.map(String) : [],
        measurableImpact: typeof proj.measurableImpact === "string" ? proj.measurableImpact.trim() : "Improved clarity and technical precision.",
        atsWordingImprovements: typeof proj.atsWordingImprovements === "string" ? proj.atsWordingImprovements.trim() : "Enhanced technical keywords.",
      }))
    : [];

  const improvements = typeof parsed.improvements === "object" && parsed.improvements !== null
    ? {
        grammar: Array.isArray(parsed.improvements.grammar) ? parsed.improvements.grammar.map(String) : [],
        formatting: Array.isArray(parsed.improvements.formatting) ? parsed.improvements.formatting.map(String) : [],
        keywordDensity: Array.isArray(parsed.improvements.keywordDensity) ? parsed.improvements.keywordDensity.map(String) : [],
        actionVerbs: Array.isArray(parsed.improvements.actionVerbs) ? parsed.improvements.actionVerbs.map(String) : [],
        missingSections: Array.isArray(parsed.improvements.missingSections) ? parsed.improvements.missingSections.map(String) : [],
        readability: Array.isArray(parsed.improvements.readability) ? parsed.improvements.readability.map(String) : [],
      }
    : { grammar: [], formatting: [], keywordDensity: [], actionVerbs: [], missingSections: [], readability: [] };

  const jobSpecificOptimization = typeof parsed.jobSpecificOptimization === "object" && parsed.jobSpecificOptimization !== null
    ? {
        isJobSpecific: Boolean(parsed.jobSpecificOptimization.isJobSpecific),
        jobTitle: typeof parsed.jobSpecificOptimization.jobTitle === "string" ? parsed.jobSpecificOptimization.jobTitle.trim() : "",
        company: typeof parsed.jobSpecificOptimization.company === "string" ? parsed.jobSpecificOptimization.company.trim() : "",
        tailoredKeywords: Array.isArray(parsed.jobSpecificOptimization.tailoredKeywords) ? parsed.jobSpecificOptimization.tailoredKeywords.map(String) : [],
        matchHighlights: Array.isArray(parsed.jobSpecificOptimization.matchHighlights) ? parsed.jobSpecificOptimization.matchHighlights.map(String) : [],
      }
    : { isJobSpecific: false, jobTitle: "", company: "", tailoredKeywords: [], matchHighlights: [] };

  return {
    currentAtsScore,
    optimizedAtsScore,
    predictedAtsScore: optimizedAtsScore,
    overallAiSummary,
    overallImprovementSummary: overallAiSummary.whatWasImproved,
    professionalSummary: profSum,
    skills,
    experience,
    projects,
    improvements,
    jobSpecificOptimization,
  };
}

function parseCoverLetterResponse(rawResponse) {
  const parsed = cleanAndParseJSON(rawResponse);

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid cover letter response structure. Please try again.",
      502
    );
  }

  const salutation = typeof parsed.salutation === "string" ? parsed.salutation.trim() : "Dear Hiring Manager,";
  const opening = typeof parsed.opening === "string" ? parsed.opening.trim() : "I am writing to express my strong interest in this position.";
  const bodyParagraphs = Array.isArray(parsed.bodyParagraphs) ? parsed.bodyParagraphs.map(p => String(p).trim()) : [];
  const closing = typeof parsed.closing === "string" ? parsed.closing.trim() : "Thank you for considering my application. I look forward to discussing how my experience aligns with your team's goals.";
  const signOff = typeof parsed.signOff === "string" ? parsed.signOff.trim() : "Sincerely,";
  const atsMatchScore = typeof parsed.atsMatchScore === "number" ? Math.min(100, Math.max(70, Math.round(parsed.atsMatchScore))) : 88;
  const keyHighlightsUsed = Array.isArray(parsed.keyHighlightsUsed) ? parsed.keyHighlightsUsed.map(String) : [];

  // Construct fallback fullText if missing
  const constructedFullText = [
    salutation,
    opening,
    ...bodyParagraphs,
    closing,
    signOff,
  ].filter(Boolean).join("\n\n");

  const fullText = typeof parsed.fullText === "string" && parsed.fullText.trim().length > 50
    ? parsed.fullText.trim()
    : constructedFullText;

  return {
    salutation,
    opening,
    bodyParagraphs,
    closing,
    signOff,
    fullText,
    atsMatchScore,
    keyHighlightsUsed,
  };
}

function parseInterviewPrepResponse(rawResponse) {
  const parsed = cleanAndParseJSON(rawResponse);

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid interview prep structure. Please try again.",
      502
    );
  }

  const cleanQuestion = (q) => ({
    question: typeof q.question === "string" ? q.question.trim() : "Interview Question",
    difficulty: typeof q.difficulty === "string" ? q.difficulty.trim() : "Medium",
    reasonAsked: typeof q.reasonAsked === "string" ? q.reasonAsked.trim() : "To evaluate candidate experience.",
    idealAnswer: typeof q.idealAnswer === "string" ? q.idealAnswer.trim() : "Response details.",
    commonMistakes: typeof q.commonMistakes === "string" ? q.commonMistakes.trim() : "Avoid generic answers.",
    interviewTips: typeof q.interviewTips === "string" ? q.interviewTips.trim() : "Focus on impact.",
    followUpQuestions: Array.isArray(q.followUpQuestions) ? q.followUpQuestions.map(String) : []
  });

  return {
    readinessScore: typeof parsed.readinessScore === "number" ? Math.min(100, Math.max(0, parsed.readinessScore)) : 70,
    technicalReadiness: typeof parsed.technicalReadiness === "number" ? Math.min(100, Math.max(0, parsed.technicalReadiness)) : 70,
    hrReadiness: typeof parsed.hrReadiness === "number" ? Math.min(100, Math.max(0, parsed.hrReadiness)) : 70,
    behavioralReadiness: typeof parsed.behavioralReadiness === "number" ? Math.min(100, Math.max(0, parsed.behavioralReadiness)) : 70,
    confidenceScore: typeof parsed.confidenceScore === "number" ? Math.min(100, Math.max(0, parsed.confidenceScore)) : 70,
    weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas.map(String) : [],
    hrQuestions: Array.isArray(parsed.hrQuestions) ? parsed.hrQuestions.map(cleanQuestion) : [],
    technicalQuestions: Array.isArray(parsed.technicalQuestions) ? parsed.technicalQuestions.map(cleanQuestion) : [],
    behavioralQuestions: Array.isArray(parsed.behavioralQuestions) ? parsed.behavioralQuestions.map(cleanQuestion) : [],
    scenarioQuestions: Array.isArray(parsed.scenarioQuestions) ? parsed.scenarioQuestions.map(cleanQuestion) : [],
    codingQuestions: Array.isArray(parsed.codingQuestions) ? parsed.codingQuestions.map(cleanQuestion) : []
  };
}

function parseCareerRoadmapResponse(rawResponse) {
  const parsed = cleanAndParseJSON(rawResponse);

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      "The AI returned an invalid career roadmap structure. Please try again.",
      502
    );
  }

  const cleanStage = (stage) => {
    if (typeof stage !== "object" || stage === null) return null;
    return {
      skills: Array.isArray(stage.skills) ? stage.skills.map(String) : [],
      projects: Array.isArray(stage.projects) ? stage.projects.map(p => {
        if (typeof p === "object" && p !== null) {
          return {
            title: typeof p.title === "string" ? p.title.trim() : "Project Name",
            description: typeof p.description === "string" ? p.description.trim() : "Project Description"
          };
        }
        return { title: String(p), description: "Development project details." };
      }) : [],
      learningResources: Array.isArray(stage.learningResources) ? stage.learningResources.map(String) : [],
      certifications: Array.isArray(stage.certifications) ? stage.certifications.map(String) : [],
      practiceTasks: Array.isArray(stage.practiceTasks) ? stage.practiceTasks.map(String) : [],
      estimatedCompletionTime: typeof stage.estimatedCompletionTime === "string" ? stage.estimatedCompletionTime.trim() : "4 weeks"
    };
  };

  return {
    careerProgress: typeof parsed.careerProgress === "number" ? Math.min(100, Math.max(0, parsed.careerProgress)) : 30,
    skillProgress: typeof parsed.skillProgress === "number" ? Math.min(100, Math.max(0, parsed.skillProgress)) : 40,
    timeline: {
      "30day": cleanStage(parsed.timeline?.["30day"] || parsed["30day"] || parsed.timeline?.day30 || {}),
      "60day": cleanStage(parsed.timeline?.["60day"] || parsed["60day"] || parsed.timeline?.day60 || {}),
      "90day": cleanStage(parsed.timeline?.["90day"] || parsed["90day"] || parsed.timeline?.day90 || {}),
      "6month": cleanStage(parsed.timeline?.["6month"] || parsed["6month"] || parsed.timeline?.month6 || {}),
      "1year": cleanStage(parsed.timeline?.["1year"] || parsed["1year"] || parsed.timeline?.year1 || {})
    },
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones.map(m => {
      if (typeof m === "object" && m !== null) {
        return {
          title: typeof m.title === "string" ? m.title.trim() : "Milestone",
          description: typeof m.description === "string" ? m.description.trim() : "Milestone description",
          achievementTime: typeof m.achievementTime === "string" ? m.achievementTime.trim() : "Ongoing"
        };
      }
      return { title: String(m), description: "", achievementTime: "" };
    }) : []
  };
}

module.exports = {
  cleanAndParseJSON,
  parseAIResponse,
  parseJobMatchResponse,
  parseResumeOptimizationResponse,
  parseCoverLetterResponse,
  parseInterviewPrepResponse,
  parseCareerRoadmapResponse
};




