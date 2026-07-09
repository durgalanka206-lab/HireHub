/**
 * Cover Letter Prompt Template
 *
 * Generates system instructions for the LLM to write a personalized cover letter.
 * Enforces strict anti-fabrication guidelines and supports requested tone.
 */

function buildCoverLetterPrompt(resumeText, targetJob, tone = "Professional") {
  const jobTitle = targetJob?.title || "Target Position";
  const company = targetJob?.company || "Target Company";
  const description = targetJob?.description || "";

  return `You are a Principal Career Advisor & Executive Resume Writer.
Generate a compelling, highly personalized, ATS-friendly cover letter for a candidate applying to the position of "${jobTitle}" at "${company}".

TONE DIRECTIVE:
Tone: ${tone} (Options: Professional, Confident, Friendly, Formal).
Adhere strictly to the requested tone throughout the cover letter.

TARGET JOB DETAILS:
- Role Title: ${jobTitle}
- Company Name: ${company}
- Job Requirements / Description:
${description}

CRITICAL ANTI-FABRICATION DIRECTIVES (STRICT COMPLIANCE REQUIRED):
1. NEVER fabricate, invent, or hallucinate any experience, companies, job titles, education, certifications, projects, dates, or achievements not mentioned in the original resume text.
2. Highlight ONLY candidate's actual skills, experience, and projects present in the resume text below.
3. Express genuine candidate fit for ${company} based strictly on truthful qualifications.

Return ONLY a single valid JSON object strictly following this JSON schema:

{
  "salutation": "<e.g., Dear Hiring Team at ${company},>",
  "opening": "<Strong opening paragraph introducing candidate background and interest in the ${jobTitle} role>",
  "bodyParagraphs": [
    "<Paragraph 1 highlighting relevant technical experience and achievements from resume>",
    "<Paragraph 2 highlighting relevant projects, problem-solving skills, and role alignment>"
  ],
  "closing": "<Closing paragraph expressing enthusiasm for interview and alignment with ${company}'s goals>",
  "signOff": "<e.g., Sincerely,>",
  "fullText": "<Complete formatted cover letter string combining salutation, opening, bodyParagraphs, closing, and signOff>",
  "atsMatchScore": <number between 70 and 98 representing calculated ATS keyword alignment score>,
  "keyHighlightsUsed": ["<Highlight 1>", "<Highlight 2>", "<Highlight 3>"]
}

CANDIDATE RESUME TEXT:
"""
${resumeText}
"""

Ensure the response contains NO markdown formatting around the JSON object. The response MUST be valid JSON.`;
}

module.exports = {
  buildCoverLetterPrompt,
};
