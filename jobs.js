// ============================================================
// CareerFlow AI — Jobs API
// lib/jobs.js
//
// Full-text search, filters, pagination, recruiter CRUD
// ============================================================

import { supabase } from './supabase'

// ════════════════════════════════════
// JOB SEARCH (Students)
// ════════════════════════════════════

export async function searchJobs({
  query = '',
  workMode = [],        // ['remote','hybrid','onsite']
  jobType = [],         // ['full_time','part_time','contract','internship']
  minSalary = null,
  maxSalary = null,
  locations = [],       // ['Mumbai','Bangalore']
  experienceLevel = [], // ['fresher','junior','mid','senior']
  skills = [],          // ['React','Node.js']
  visaSponsorship = false,
  equityOffered = false,
  featured = false,
  sortBy = 'match',     // 'match' | 'recent' | 'salary'
  page = 1,
  limit = 20,
}) {
  let q = supabase
    .from('jobs')
    .select(`
      id, title, slug, work_mode, job_type, experience_level,
      min_salary, max_salary, salary_currency, required_skills,
      preferred_skills, visa_sponsorship, equity_offered,
      is_featured, views_count, applications_count,
      city, state, country, created_at,
      companies!inner(id, name, logo_url, city, industry, is_verified)
    `, { count: 'exact' })
    .eq('status', 'active')

  // Full-text search (uses our tsvector index)
  if (query) {
    q = q.textSearch('search_vector', query, { type: 'websearch' })
  }

  // Filters
  if (workMode.length)        q = q.in('work_mode', workMode)
  if (jobType.length)         q = q.in('job_type', jobType)
  if (experienceLevel.length) q = q.in('experience_level', experienceLevel)
  if (locations.length)       q = q.in('city', locations)
  if (minSalary)              q = q.gte('max_salary', minSalary)
  if (maxSalary)              q = q.lte('min_salary', maxSalary)
  if (visaSponsorship)        q = q.eq('visa_sponsorship', true)
  if (equityOffered)          q = q.eq('equity_offered', true)
  if (featured)               q = q.eq('is_featured', true)

  // Skill filter (overlaps with required_skills array)
  if (skills.length) {
    q = q.overlaps('required_skills', skills)
  }

  // Sort
  if (sortBy === 'recent')  q = q.order('created_at', { ascending: false })
  if (sortBy === 'salary')  q = q.order('max_salary',  { ascending: false })
  if (sortBy === 'match')   q = q.order('is_featured',  { ascending: false })
                                 .order('created_at',   { ascending: false })

  // Featured jobs always first
  q = q.order('is_featured', { ascending: false })

  // Pagination
  const from = (page - 1) * limit
  q = q.range(from, from + limit - 1)

  const { data, count, error } = await q
  if (error) throw error

  return { jobs: data, total: count, page, limit }
}

// Get single job detail
export async function getJob(jobId) {
  // Increment view count
  await supabase.rpc('increment_job_views', { job_id: jobId })

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies!inner(*),
      users!posted_by(full_name, avatar_url)
    `)
    .eq('id', jobId)
    .single()

  if (error) throw error
  return data
}

// Get similar jobs (same skills, different company)
export async function getSimilarJobs(job, limit = 4) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id, title, min_salary, max_salary, work_mode, job_type, created_at,
      companies!inner(name, logo_url)
    `)
    .eq('status', 'active')
    .neq('id', job.id)
    .overlaps('required_skills', job.required_skills || [])
    .limit(limit)

  if (error) throw error
  return data
}

// ════════════════════════════════════
// AI JOB MATCHING (for student)
// ════════════════════════════════════

// Get top matched jobs for a student based on their skills
export async function getMatchedJobs(userId, limit = 10) {
  // Get student skills
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('skills(name)')
    .eq('user_id', userId)

  const skillNames = userSkills?.map(s => s.skills.name) || []

  if (!skillNames.length) return []

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id, title, work_mode, job_type, min_salary, max_salary,
      required_skills, city, is_featured, created_at,
      companies!inner(name, logo_url)
    `)
    .eq('status', 'active')
    .overlaps('required_skills', skillNames)
    .order('is_featured', { ascending: false })
    .order('created_at',  { ascending: false })
    .limit(limit * 3)  // fetch extra then score

  if (error) throw error

  // Client-side match scoring
  const scored = (data || []).map(job => {
    const jobSkills = job.required_skills || []
    const matched   = skillNames.filter(s => jobSkills.includes(s))
    const score     = Math.round((matched.length / Math.max(jobSkills.length, 1)) * 100)
    return { ...job, match_score: score, matched_skills: matched }
  })

  return scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit)
}

// ════════════════════════════════════
// RECRUITER — JOB MANAGEMENT
// ════════════════════════════════════

// Get all jobs by recruiter
export async function getRecruiterJobs(recruiterId, status = null) {
  let q = supabase
    .from('jobs')
    .select(`
      id, title, job_type, work_mode, city, status,
      views_count, applications_count, is_featured, created_at, updated_at,
      companies!inner(name, logo_url)
    `)
    .eq('posted_by', recruiterId)
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw error
  return data
}

// Post a new job
export async function createJob(recruiterId, companyId, jobData) {
  const slug = jobData.title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-') + '-' + Date.now()

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      posted_by: recruiterId,
      company_id: companyId,
      slug,
      status: 'active',
      ...jobData,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update a job
export async function updateJob(jobId, updates) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Pause / reactivate job
export async function setJobStatus(jobId, status) {
  return updateJob(jobId, { status })
}

// Delete job
export async function deleteJob(jobId) {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error
}

// ════════════════════════════════════
// RECRUITER — APPLICATIONS
// ════════════════════════════════════

// Get all applications for a recruiter's job
export async function getJobApplications(jobId, status = null) {
  let q = supabase
    .from('applications')
    .select(`
      id, status, match_score, cover_letter, is_auto_applied,
      recruiter_note, viewed_at, shortlisted_at, created_at,
      users!student_id(
        id, full_name, email, avatar_url,
        student_profiles(
          headline, city, total_experience_yrs, expected_salary,
          notice_period_days, github_url, linkedin_url, ats_score,
          user_skills(skills(name))
        )
      ),
      resumes(id, label, ats_score, file_url)
    `)
    .eq('job_id', jobId)
    .order('match_score', { ascending: false })

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw error
  return data
}

// Update application status (shortlist, interview, reject, etc.)
export async function updateApplicationStatus(applicationId, status, note = null) {
  const updates = {
    status,
    ...(status === 'viewed'      && { viewed_at: new Date().toISOString() }),
    ...(status === 'shortlisted' && { shortlisted_at: new Date().toISOString() }),
    ...(note                     && { recruiter_note: note }),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error

  // Send notification to student
  await createApplicationNotification(applicationId, status)

  return data
}

async function createApplicationNotification(applicationId, status) {
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('student_id, jobs(title, companies(name))')
      .eq('id', applicationId)
      .single()

    const messages = {
      viewed:      `${app.jobs.companies.name} viewed your application for ${app.jobs.title}`,
      shortlisted: `🎉 You've been shortlisted for ${app.jobs.title} at ${app.jobs.companies.name}!`,
      interview:   `📅 Interview scheduled for ${app.jobs.title} at ${app.jobs.companies.name}`,
      rejected:    `Application update for ${app.jobs.title} at ${app.jobs.companies.name}`,
      selected:    `🎊 Offer received for ${app.jobs.title} at ${app.jobs.companies.name}!`,
    }

    if (messages[status]) {
      await supabase.from('notifications').insert({
        user_id: app.student_id,
        type: 'application_update',
        title: messages[status],
        data: { application_id: applicationId, status },
      })
    }
  } catch (e) {
    console.error('Notification error:', e)
  }
}

// ════════════════════════════════════
// TALENT SEARCH (Recruiter)
// ════════════════════════════════════

export async function searchTalent({
  skills = [],
  location = '',
  experienceLevel = null,
  maxSalary = null,
  noticePeriod = null,
  page = 1,
  limit = 20,
}) {
  let q = supabase
    .from('student_profiles')
    .select(`
      id, headline, city, state, total_experience_yrs,
      expected_salary, notice_period_days, ats_score,
      github_url, linkedin_url, is_actively_looking,
      users!inner(id, full_name, email, avatar_url, subscription),
      user_skills(skills(name)),
      education(degree, institution, end_year)
    `)
    .eq('is_actively_looking', true)

  if (location)       q = q.ilike('city', `%${location}%`)
  if (experienceLevel)q = q.eq('experience_level', experienceLevel)
  if (maxSalary)      q = q.lte('expected_salary', maxSalary * 100000)

  const from = (page - 1) * limit
  q = q.range(from, from + limit - 1)
       .order('ats_score', { ascending: false })

  const { data, count, error } = await q
  if (error) throw error

  // Filter by skills client-side (overlaps on nested join is complex)
  let results = data || []
  if (skills.length) {
    results = results.filter(p => {
      const studentSkills = p.user_skills?.map(s => s.skills.name) || []
      return skills.some(s => studentSkills.includes(s))
    })
  }

  return { candidates: results, total: count }
}
