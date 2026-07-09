function buildInterviewPrepPrompt(candidateResume, jobDetails) {
  return `
You are an expert technical interviewer and HR manager. Your task is to generate a comprehensive interview preparation guide for a candidate interviewing for a specific job posting.

Candidate Resume Text:
"""
${candidateResume}
"""

Target Job Details:
- Job Title: ${jobDetails.title}
- Company: ${jobDetails.company}
- Experience Level: ${jobDetails.experienceLevel || "Not Specified"}
- Skills Required: ${Array.isArray(jobDetails.skills) ? jobDetails.skills.join(", ") : (jobDetails.skills || "Not Specified")}
- Job Description:
"""
${jobDetails.description}
"""

Please generate standard interview questions covering the following categories:
1. HR Questions (2 questions)
2. Technical Questions (2 questions)
3. Coding Questions (if it is a developer/engineer/tech role - 2 questions; if not technical, generate general logical/analytical questions)
4. Scenario-based Questions (2 questions)
5. Behavioral Questions (2 questions)

Ensure the difficulty matches the job description and candidate experience (Easy, Medium, Hard).
For "reasonAsked", write a detailed explanation of why the interviewer asks this.
For "idealAnswer", write a clear, structured model answer.
For "commonMistakes", write typical traps or errors candidates make when answering this.
For "interviewTips", write actionable tips.
For "followUpQuestions", include 2-3 realistic follow-up questions.

Return EXACTLY a JSON block matching this schema:
{
  "readinessScore": 75,
  "technicalReadiness": 80,
  "hrReadiness": 70,
  "behavioralReadiness": 75,
  "confidenceScore": 70,
  "weakAreas": ["string"],
  "hrQuestions": [
    {
      "question": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "reasonAsked": "string",
      "idealAnswer": "string",
      "commonMistakes": "string",
      "interviewTips": "string",
      "followUpQuestions": ["string"]
    }
  ],
  "technicalQuestions": [ ... ],
  "behavioralQuestions": [ ... ],
  "scenarioQuestions": [ ... ],
  "codingQuestions": [ ... ]
}

Return ONLY valid JSON. Do not include any markdown fences or explanations outside the JSON block.
`;
}

function buildAnswerEvaluationPrompt(question, userAnswer, idealAnswer) {
  return `
You are an expert interviewer evaluating a candidate's answer to a mock interview question.

Question:
"${question}"

Ideal Answer:
"${idealAnswer}"

Candidate's Answer:
"${userAnswer}"

Please evaluate the candidate's answer across the following dimensions on a scale of 1 to 10:
1. confidence (choice of words, structuring, and directness of answer - 1 to 10)
2. technicalCorrectness (accuracy and technical soundness - 1 to 10)
3. communication (clarity, coherence, and professional tone - 1 to 10)
4. completeness (addressing all parts of the question - 1 to 10)
5. grammar (grammatical errors or awkward phrasings - 1 to 10)

Also calculate an overall "score" (weighted score, out of 10).
And provide constructive, specific "suggestions" for improvement.

Return EXACTLY a JSON block matching this schema:
{
  "confidence": 8,
  "technicalCorrectness": 7,
  "communication": 8,
  "completeness": 6,
  "grammar": 9,
  "score": 7.6,
  "suggestions": "Detailed suggestions..."
}

Return ONLY valid JSON. Do not include any explanations outside the JSON block.
`;
}

module.exports = {
  buildInterviewPrepPrompt,
  buildAnswerEvaluationPrompt
};
