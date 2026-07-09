/**
 * Resume Analysis Prompt Module
 *
 * Dedicated prompt generator for the AI Resume Analyzer feature.
 * Encapsulates prompt template and format requirements.
 */

/**
 * Builds the complete prompt string for resume analysis.
 * @param {string} resumeText - Extracted text from resume
 * @returns {string}
 */
function buildResumeAnalysisPrompt(resumeText) {
  return `
You are an expert ATS (Applicant Tracking System) analyst and senior technical recruiter.
Analyze the following resume text and return a structured JSON response ONLY — no markdown code block wrapper, no conversational text.

Resume Text:
"""
${resumeText}
"""

Return EXACTLY this JSON structure:
{
  "atsScore": <integer 0-100 representing how ATS-friendly and complete this resume is>,
  "summary": "<2-3 sentence professional executive summary of the candidate>",
  "skillsFound": ["<skill1>", "<skill2>", "..."],
  "missingSkills": ["<commonly expected skill for their role/domain not found>", "..."],
  "strengths": ["<strength1>", "<strength2>", "..."],
  "weaknesses": ["<weakness1>", "<weakness2>", "..."],
  "recommendations": ["<actionable improvement suggestion 1>", "<actionable improvement suggestion 2>", "..."]
}

Guidelines:
- atsScore: Integer between 0 and 100 based on formatting, technical clarity, skill density, and completeness.
- skillsFound: List technical and soft skills explicitly present in the text.
- missingSkills: List 3-5 key industry skills expected for candidate's target profile that are missing.
- strengths: 3-5 specific positive attributes of the resume.
- weaknesses: 3-5 specific areas needing improvement.
- recommendations: 4-6 concrete, actionable steps to improve ATS match and readability.
- Output MUST be strictly valid JSON.
`;
}

module.exports = {
  buildResumeAnalysisPrompt,
};
