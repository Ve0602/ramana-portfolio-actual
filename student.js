// ============================================================
// CareerFlow AI — Student API
// lib/student.js
//
// All database operations for student profiles, resumes,
// applications, saved jobs, skills, education, experience
// ============================================================

import { supabase } from './supabase'

// ════════════════════════════════════
// PROFILE
// ════════════════════════════════════

// Get full student profile (joins user + student_profile)
export async function getStudentProfile(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select(`
      *,
      users!inner(id, email, full_name, avatar_url, subscription, is_active),
      user_skills(*, skills(id, name, category)),
      education(*),
      work_experience(*),
      certifications(*),
      projects(*),
      resumes(id, label, ats_score, is_primary, is_ai_gen, created_at)
    `)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

// Create profile after signup (called from onboarding step 1)
export async function createStudentProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('student_profiles')
    .insert({
      user_id: userId,
      ...profileData,
      profile_completion: calculateCompletion(profileData),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update profile
export async function updateStudentProfile(userId, updates) {
  const { data, error } = await supabase
    .from('student_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Profile completion % calculator
function calculateCompletion(profile) {
  const fields = ['date_of_birth','gender','country','city','headline','bio',
    'github_url','linkedin_url','resume_url','total_experience_yrs']
  const filled = fields.filter(f => profile[f]).length
  return Math.round((filled / fields.length) * 100)
}

// ════════════════════════════════════
// RESUME UPLOAD + STORAGE
// ════════════════════════════════════

// Upload resume PDF to Supabase Storage
export async function uploadResume(userId, file) {
  const fileName = `${userId}/${Date.now()}_${file.name}`

  const { data: storageData, error: storageError } = await supabase.storage
    .from('resumes')                         // Create this bucket in Supabase Dashboard
    .upload(fileName, file, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (storageError) throw storageError

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName)

  // Save resume record in DB
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      label: file.name.replace('.pdf', ''),
      file_url: urlData.publicUrl,
      is_primary: false,
      is_ai_gen: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Set a resume as primary
export async function setPrimaryResume(userId, resumeId) {
  // First unset all
  await supabase
    .from('resumes')
    .update({ is_primary: false })
    .eq('user_id', userId)

  // Then set the chosen one
  const { data, error } = await supabase
    .from('resumes')
    .update({ is_primary: true })
    .eq('id', resumeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Save AI-generated resume
export async function saveAIResume(userId, label, contentJson, atsScore, aiFeedback) {
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      label,
      content_json: contentJson,
      ats_score: atsScore,
      is_ai_gen: true,
      ai_feedback: aiFeedback,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ════════════════════════════════════
// EDUCATION
// ════════════════════════════════════

export async function addEducation(userId, educationData) {
  const { data, error } = await supabase
    .from('education')
    .insert({ user_id: userId, ...educationData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEducation(id, updates) {
  const { data, error } = await supabase
    .from('education')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEducation(id) {
  const { error } = await supabase.from('education').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════
// WORK EXPERIENCE
// ════════════════════════════════════

export async function addWorkExperience(userId, expData) {
  const { data, error } = await supabase
    .from('work_experience')
    .insert({ user_id: userId, ...expData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorkExperience(id, updates) {
  const { data, error } = await supabase
    .from('work_experience')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkExperience(id) {
  const { error } = await supabase.from('work_experience').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════
// SKILLS
// ════════════════════════════════════

export async function addUserSkill(userId, skillName, proficiency = 3) {
  // Find or create skill
  let { data: skill } = await supabase
    .from('skills')
    .select('id')
    .eq('name', skillName)
    .single()

  if (!skill) {
    const { data: newSkill, error } = await supabase
      .from('skills')
      .insert({ name: skillName })
      .select('id')
      .single()
    if (error) throw error
    skill = newSkill
  }

  // Add to user
  const { data, error } = await supabase
    .from('user_skills')
    .upsert({ user_id: userId, skill_id: skill.id, proficiency })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeUserSkill(userId, skillId) {
  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', userId)
    .eq('skill_id', skillId)
  if (error) throw error
}

// ════════════════════════════════════
// APPLICATIONS
// ════════════════════════════════════

// Get all applications for a student
export async function getMyApplications(userId, status = null) {
  let query = supabase
    .from('applications')
    .select(`
      *,
      jobs!inner(
        id, title, work_mode, job_type, min_salary, max_salary, salary_currency,
        companies!inner(name, logo_url, city)
      ),
      resumes(label, ats_score)
    `)
    .eq('student_id', userId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Apply to a job
export async function applyToJob(userId, jobId, resumeId, coverLetter = '') {
  // Check if already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('student_id', userId)
    .eq('job_id', jobId)
    .single()

  if (existing) throw new Error('Already applied to this job')

  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: userId,
      job_id: jobId,
      resume_id: resumeId,
      cover_letter: coverLetter,
      status: 'applied',
    })
    .select()
    .single()

  if (error) throw error

  // Increment applications_count on job
  await supabase.rpc('increment_job_applications', { job_id: jobId })

  return data
}

// Withdraw application
export async function withdrawApplication(applicationId) {
  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Get application stats (for dashboard)
export async function getApplicationStats(userId) {
  const { data, error } = await supabase
    .from('applications')
    .select('status')
    .eq('student_id', userId)

  if (error) throw error

  const stats = {
    total: data.length,
    applied: 0, viewed: 0, shortlisted: 0,
    interview: 0, assessment: 0, rejected: 0, selected: 0,
  }
  data.forEach(a => { if (stats[a.status] !== undefined) stats[a.status]++ })
  return stats
}

// ════════════════════════════════════
// SAVED JOBS
// ════════════════════════════════════

export async function saveJob(userId, jobId) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .upsert({ user_id: userId, job_id: jobId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unsaveJob(userId, jobId) {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId)
  if (error) throw error
}

export async function getSavedJobs(userId) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      *,
      jobs!inner(
        id, title, work_mode, job_type, min_salary, max_salary,
        required_skills, created_at,
        companies!inner(name, logo_url, city)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ════════════════════════════════════
// AI PREFERENCES (Auto-Apply settings)
// ════════════════════════════════════

export async function getAIPreferences(userId) {
  const { data, error } = await supabase
    .from('ai_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  // If no preferences yet, create defaults
  if (error?.code === 'PGRST116') {
    return createAIPreferences(userId, {})
  }
  if (error) throw error
  return data
}

export async function createAIPreferences(userId, prefs) {
  const { data, error } = await supabase
    .from('ai_preferences')
    .insert({ user_id: userId, ...prefs })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAIPreferences(userId, updates) {
  const { data, error } = await supabase
    .from('ai_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ════════════════════════════════════
// AI CHAT SESSIONS
// ════════════════════════════════════

export async function getChatSessions(userId) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getChatSession(sessionId) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (error) throw error
  return data
}

export async function saveChatSession(userId, title, messages) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert({ user_id: userId, title, messages })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateChatSession(sessionId, messages) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════

export async function getNotifications(userId, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (unreadOnly) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
  if (error) throw error
}
