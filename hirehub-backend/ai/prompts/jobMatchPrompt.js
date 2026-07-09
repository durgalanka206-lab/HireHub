/**
 * Job Match Prompt Module
 *
 * Generates the prompt template for AI Job Match Analysis.
 * Evaluates candidate resume against specific job requirements.
 */

/**
 * Builds the prompt string for AI Job Match analysis.
 * @param {string} resumeText - Candidate resume text
 * @param {object} job - Job document (title, company, desc, tags, requirements, etc.)
 * @returns {string}
 */
function buildJobMatchPrompt(resumeText, job) {
  const jobTitle = job.title || "Target Position";
  const company = job.company || "Hiring Company";
  const location = job.location || "Flexible";
  const jobType = job.type || "Full-Time";
  const salary = job.salary || "Competitive";
  const description = job.desc || job.description || "N/A";
  const tags = Array.isArray(job.tags) ? job.tags.join(", ") : "N/A";
  const requirements = Array.isArray(job.requirements) ? job.requirements.join("; ") : "N/A";

  return `
You are an expert technical talent recruiter, career advisor, and ATS match analyst.
Evaluate the candidate's resume against the target job posting details provided below.
Return a structured JSON response ONLY — no markdown wrappers, no conversational text.

TARGET JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company}
- Location: ${location} | Type: ${jobType}
- Salary Info: ${salary}
- Required Skills/Tags: ${tags}
- Key Requirements: ${requirements}
- Job Description:
"""
${description}
"""

CANDIDATE RESUME TEXT:
"""
${resumeText}
"""

Return EXACTLY this JSON structure:
{
  "matchScore": <integer 0-100 indicating fit score for this specific role>,
  "overallExplanation": "<2-3 sentence clear summary of why the candidate fits or doesn't fit this role>",
  "matchingSkills": ["<skill explicitly in resume that matches job>", "..."],
  "missingSkills": ["<required job skill missing from candidate resume>", "..."],
  "strengths": ["<key advantage candidate has for this specific job>", "..."],
  "improvements": ["<actionable gap or area candidate needs to address for this role>", "..."],
  "learningRoadmap": ["<step-by-step learning objective to bridge missing skills>", "..."],
  "salaryInsights": {
    "estimatedRange": "<estimated market salary range for candidate's skill level in this role>",
    "reason": "<1-2 sentence market analysis backing the salary range>"
  },
  "interviewFocus": ["<likely interview topic or technical question areas based on gaps/requirements>", "..."],
  "atsSuggestions": ["<ATS keyword/formatting advice specifically tailored to match this job posting>", "..."]
}

Guidelines:
- matchScore: Integer 0 to 100 representing realistic fit for this job posting.
- matchingSkills: List key overlap skills between resume and job tags/requirements.
- missingSkills: List 3-5 critical skills required by the job but missing in candidate's resume.
- strengths: 3-5 specific strengths relative to this role.
- improvements: 3-5 specific gaps or experience deficiencies for this role.
- learningRoadmap: 3-5 sequential actionable steps candidate can take to improve readiness.
- salaryInsights: Realistic compensation range (e.g. "₹12 - ₹18 LPA" or "$90,000 - $120,000") and justification.
- interviewFocus: 3-5 expected technical interview topics candidate should prepare for.
- atsSuggestions: 3-5 specific tweaks to tailor candidate's resume for this job posting.
- Output MUST be strictly valid JSON.
`;
}

module.exports = {
  buildJobMatchPrompt,
};
