// ============================================================
// CareerFlow AI — Gemini AI Integration
// lib/ai.js
//
// FREE Gemini API: https://aistudio.google.com/app/apikey
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

// Core Gemini call
async function callGemini(prompt, maxTokens = 1000) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// JSON-safe Gemini call (returns parsed object)
async function callGeminiJSON(prompt) {
  const text = await callGemini(
    prompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.',
    2000
  )
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('AI returned invalid JSON')
  }
}

// ════════════════════════════════════
// ATS RESUME SCORING
// ════════════════════════════════════

export async function scoreResume(resumeText, targetJobTitle = '') {
  const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer.

Analyze this resume for the role: "${targetJobTitle || 'General Software Engineer'}"

RESUME TEXT:
${resumeText.slice(0, 4000)}

Return a JSON object with:
{
  "overall_score": <number 0-100>,
  "breakdown": {
    "keywords": <number 0-100>,
    "format": <number 0-100>,
    "action_verbs": <number 0-100>,
    "metrics": <number 0-100>,
    "sections": <number 0-100>
  },
  "issues": [
    { "type": "error|warn|ok", "text": "<issue description>", "fix": "<how to fix>" }
  ],
  "missing_keywords": ["keyword1", "keyword2"],
  "present_keywords": ["keyword1", "keyword2"],
  "skills_found": ["skill1", "skill2"],
  "verdict": "Poor|Fair|Good|Excellent",
  "one_line_summary": "<brief AI summary>"
}
`
  return callGeminiJSON(prompt)
}

// ════════════════════════════════════
// RESUME OPTIMIZATION
// ════════════════════════════════════

export async function optimizeResume(resumeText, jobDescription, jobTitle) {
  const prompt = `
You are an expert resume writer and ATS optimization specialist.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription.slice(0, 1500)}

CURRENT RESUME: ${resumeText.slice(0, 3000)}

Rewrite and optimize this resume to:
1. Include all relevant keywords from the job description
2. Use strong action verbs (built, architected, deployed, optimized, led, scaled)
3. Add quantifiable metrics where possible
4. Keep ATS-friendly formatting (no tables, no graphics)
5. Tailor the professional summary to this specific role

Return a JSON object:
{
  "optimized_summary": "<rewritten professional summary>",
  "improved_bullets": ["<improved bullet 1>", "<improved bullet 2>"],
  "keywords_added": ["keyword1", "keyword2"],
  "new_ats_score": <estimated score 0-100>,
  "changes_made": ["<change description 1>", "<change description 2>"]
}
`
  return callGeminiJSON(prompt)
}

// ════════════════════════════════════
// COVER LETTER GENERATOR
// ════════════════════════════════════

export async function generateCoverLetter(studentProfile, job) {
  const prompt = `
Write a professional, concise cover letter (under 200 words) for:

CANDIDATE: ${studentProfile.full_name}
CANDIDATE HEADLINE: ${studentProfile.headline}
KEY SKILLS: ${studentProfile.skills?.join(', ')}
EXPERIENCE: ${studentProfile.experience} years

JOB TITLE: ${job.title}
COMPANY: ${job.company_name}
JOB DESCRIPTION: ${job.description?.slice(0, 800)}

Write in first person. Be specific. Mention 1-2 relevant skills.
End with a call to action. Professional but warm tone.

Return plain text only (no JSON).
`
  return callGemini(prompt, 400)
}

// ════════════════════════════════════
// CAREER COACH CHAT
// ════════════════════════════════════

export async function careerCoachChat(userMessage, context) {
  const prompt = `
You are an expert AI Career Coach for CareerFlow AI, an Indian job platform.

STUDENT CONTEXT:
- Name: ${context.name}
- Current ATS Score: ${context.atsScore}/100
- Skills: ${context.skills?.join(', ')}
- Experience: ${context.experience} years
- Target Role: ${context.targetRole}
- Applications This Month: ${context.applicationCount}

USER MESSAGE: "${userMessage}"

Respond as a helpful, warm career coach. Be specific to Indian job market.
Include:
- Specific actionable advice
- Salary benchmarks in ₹ LPA when relevant
- Company names in Indian market when relevant
- Keep response under 150 words
- Use emojis sparingly for readability
`
  return callGemini(prompt, 600)
}

// ════════════════════════════════════
// JOB MATCH SCORING
// ════════════════════════════════════

export async function calculateJobMatch(studentProfile, job) {
  const prompt = `
Score how well this candidate matches this job. Be objective.

CANDIDATE:
Skills: ${studentProfile.skills?.join(', ')}
Experience: ${studentProfile.experience_years} years
Education: ${studentProfile.education}

JOB:
Title: ${job.title}
Required Skills: ${job.required_skills?.join(', ')}
Experience Required: ${job.min_experience_yrs}-${job.max_experience_yrs} years
Description: ${job.description?.slice(0, 500)}

Return JSON:
{
  "match_score": <number 0-100>,
  "matched_skills": ["skill1"],
  "missing_skills": ["skill2"],
  "experience_match": true,
  "reasoning": "<one line explanation>",
  "recommendation": "apply|skip|stretch"
}
`
  return callGeminiJSON(prompt)
}

// ════════════════════════════════════
// SKILL GAP ANALYSIS
// ════════════════════════════════════

export async function analyzeSkillGap(currentSkills, targetRole) {
  const prompt = `
Analyze the skill gap for a candidate targeting: "${targetRole}"

CURRENT SKILLS: ${currentSkills.join(', ')}

Return JSON:
{
  "missing_critical": ["skill1", "skill2"],
  "missing_nice": ["skill3"],
  "learning_path": [
    { "skill": "Docker", "resource": "Docker official docs", "time": "2 weeks", "free": true },
    { "skill": "AWS", "resource": "AWS Free Tier + Udemy", "time": "1 month", "free": false }
  ],
  "estimated_time_to_ready": "3 months",
  "current_readiness": <0-100>
}
`
  return callGeminiJSON(prompt)
}

// ════════════════════════════════════
// INTERVIEW PREP
// ════════════════════════════════════

export async function generateInterviewQuestions(jobTitle, jobDescription, difficulty = 'medium') {
  const prompt = `
Generate interview questions for: ${jobTitle}

JOB CONTEXT: ${jobDescription?.slice(0, 600)}
DIFFICULTY: ${difficulty}

Return JSON:
{
  "technical": [
    { "question": "...", "hint": "...", "expected_answer_points": ["point1", "point2"] }
  ],
  "behavioral": [
    { "question": "...", "framework": "STAR" }
  ],
  "system_design": [
    { "question": "..." }
  ],
  "company_specific": [
    { "question": "..." }
  ]
}

Generate 3 questions per category.
`
  return callGeminiJSON(prompt)
}

// ════════════════════════════════════
// SALARY INSIGHTS
// ════════════════════════════════════

export async function getSalaryInsights(role, experience, location, skills) {
  const prompt = `
Provide salary insights for the Indian job market (2025-2026):

ROLE: ${role}
EXPERIENCE: ${experience} years
LOCATION: ${location}
SKILLS: ${skills.join(', ')}

Return JSON:
{
  "min_salary_lpa": <number>,
  "median_salary_lpa": <number>,
  "max_salary_lpa": <number>,
  "top_paying_companies": ["Company1", "Company2", "Company3"],
  "negotiation_tips": ["tip1", "tip2"],
  "skills_that_increase_salary": ["skill1 (+15%)", "skill2 (+20%)"],
  "market_trend": "growing|stable|declining",
  "trend_note": "<brief note>"
}
`
  return callGeminiJSON(prompt)
}

// ════════════════════════════════════
// AUTO-APPLY DECISION ENGINE
// ════════════════════════════════════

export async function autoApplyDecision(studentProfile, job, preferences) {
  // Quick client-side score first
  const studentSkills = studentProfile.skills || []
  const jobSkills     = job.required_skills || []
  const matchedCount  = studentSkills.filter(s => jobSkills.includes(s)).length
  const quickScore    = Math.round((matchedCount / Math.max(jobSkills.length, 1)) * 100)

  // Check preferences
  const meetsMinScore   = quickScore >= (preferences.min_match_score || 70)
  const meetsLocation   = !preferences.preferred_locations?.length ||
    preferences.preferred_locations.includes(job.city) || job.work_mode === 'remote'
  const meetsSalary     = !preferences.min_salary ||
    (job.max_salary || 0) >= preferences.min_salary
  const meetsWorkMode   = !preferences.preferred_work_modes?.length ||
    preferences.preferred_work_modes.includes(job.work_mode)
  const notExcluded     = !preferences.excluded_companies?.includes(job.company_name)

  const shouldApply = meetsMinScore && meetsLocation && meetsSalary && meetsWorkMode && notExcluded

  return {
    should_apply: shouldApply,
    match_score: quickScore,
    reasons: {
      score_ok: meetsMinScore,
      location_ok: meetsLocation,
      salary_ok: meetsSalary,
      work_mode_ok: meetsWorkMode,
      not_excluded: notExcluded,
    },
    reasoning: shouldApply
      ? `${quickScore}% skill match — recommended to apply`
      : `Below threshold or doesn't meet your preferences`,
  }
}
