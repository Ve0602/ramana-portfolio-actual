// ============================================================
// CareerFlow AI — Admin API
// lib/admin.js  (server-side only — uses service role key)
//
// IMPORTANT: Never import this in browser/client components
// Only use in pages/api/* or app/api/* route handlers
// ============================================================

import { supabaseAdmin } from './supabase'

// ════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════

export async function getDashboardStats() {
  const [users, jobs, applications, revenue] = await Promise.all([
    supabaseAdmin.from('users').select('id, role, subscription, created_at, is_active'),
    supabaseAdmin.from('jobs').select('id, status, created_at'),
    supabaseAdmin.from('applications').select('id, status, created_at'),
    supabaseAdmin.from('subscriptions').select('amount, status, created_at').eq('status', 'success'),
  ])

  const now   = new Date()
  const month = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalUsers     = users.data?.length || 0
  const newThisMonth   = users.data?.filter(u => new Date(u.created_at) >= month).length || 0
  const activeJobs     = jobs.data?.filter(j => j.status === 'active').length || 0
  const totalApps      = applications.data?.length || 0
  const monthlyRevenue = revenue.data
    ?.filter(r => new Date(r.created_at) >= month)
    .reduce((sum, r) => sum + Number(r.amount), 0) || 0

  const planBreakdown = {
    free:         users.data?.filter(u => u.subscription === 'free').length || 0,
    premium:      users.data?.filter(u => u.subscription === 'premium').length || 0,
    premium_plus: users.data?.filter(u => u.subscription === 'premium_plus').length || 0,
    enterprise:   users.data?.filter(u => u.subscription === 'enterprise').length || 0,
  }

  // Signups last 7 days
  const signupTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().slice(0, 10)
    return {
      date: dayStr,
      count: users.data?.filter(u => u.created_at?.slice(0, 10) === dayStr).length || 0,
    }
  })

  return {
    totalUsers, newThisMonth, activeJobs,
    totalApps, monthlyRevenue, planBreakdown, signupTrend,
  }
}

// ════════════════════════════════════
// USER MANAGEMENT
// ════════════════════════════════════

export async function getAllUsers({ role = null, plan = null, search = '', page = 1, limit = 50 }) {
  let q = supabaseAdmin
    .from('users')
    .select(`
      id, email, full_name, avatar_url, role, subscription,
      subscription_end, is_active, is_banned, ban_reason, created_at,
      student_profiles(ats_score, city, total_experience_yrs, profile_completion)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (role)   q = q.eq('role', role)
  if (plan)   q = q.eq('subscription', plan)
  if (search) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)

  const from = (page - 1) * limit
  q = q.range(from, from + limit - 1)

  const { data, count, error } = await q
  if (error) throw error
  return { users: data, total: count }
}

export async function getUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      student_profiles(*,
        user_skills(skills(name)),
        education(*),
        work_experience(*),
        certifications(*),
        resumes(id, label, ats_score, is_primary, created_at)
      ),
      recruiter_profiles(*, companies(*)),
      subscriptions(plan, amount, status, starts_at, ends_at),
      applications(id, status, created_at)
    `)
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Ban a user
export async function banUser(adminId, userId, reason) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_banned: true, is_active: false, ban_reason: reason })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error

  // Revoke Supabase Auth session
  await supabaseAdmin.auth.admin.deleteUser(userId)

  await logAdminAction(adminId, 'BAN', 'user', userId, { reason })
  return data
}

// Unban a user
export async function unbanUser(adminId, userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_banned: false, is_active: true, ban_reason: null })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  await logAdminAction(adminId, 'UNBAN', 'user', userId, {})
  return data
}

// Change user plan (manually — e.g. gift plan)
export async function changeUserPlan(adminId, userId, plan, endsAt = null) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ subscription: plan, subscription_end: endsAt })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  await logAdminAction(adminId, 'CHANGE_PLAN', 'user', userId, { plan, endsAt })
  return data
}

// Delete user completely
export async function deleteUser(adminId, userId) {
  await supabaseAdmin.auth.admin.deleteUser(userId)  // removes auth + cascades to users table
  await logAdminAction(adminId, 'DELETE', 'user', userId, {})
}

// ════════════════════════════════════
// RECRUITER VERIFICATION
// ════════════════════════════════════

export async function getPendingRecruiters() {
  const { data, error } = await supabaseAdmin
    .from('recruiter_profiles')
    .select(`
      id, designation, is_verified, verification_status, created_at,
      users!inner(id, email, full_name, avatar_url, created_at),
      companies(id, name, website, industry, size, logo_url, is_verified)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function verifyRecruiter(adminId, recruiterId, approve = true) {
  const status = approve ? 'verified' : 'rejected'

  const { data, error } = await supabaseAdmin
    .from('recruiter_profiles')
    .update({ is_verified: approve, verification_status: status })
    .eq('id', recruiterId)
    .select('user_id')
    .single()
  if (error) throw error

  // Notify recruiter
  await supabaseAdmin.from('notifications').insert({
    user_id: data.user_id,
    type:    'system',
    title:   approve
      ? '✅ Your recruiter account has been verified! You can now post jobs.'
      : '❌ Your recruiter account verification was rejected. Contact support.',
  })

  await logAdminAction(adminId, approve ? 'VERIFY' : 'REJECT', 'recruiter', recruiterId, {})
  return data
}

// ════════════════════════════════════
// COMPANY MANAGEMENT
// ════════════════════════════════════

export async function getAllCompanies(page = 1, limit = 30) {
  const { data, count, error } = await supabaseAdmin
    .from('companies')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (error) throw error
  return { companies: data, total: count }
}

export async function verifyCompany(adminId, companyId, approve = true) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({
      is_verified: approve,
      verification_status: approve ? 'verified' : 'rejected',
    })
    .eq('id', companyId)
    .select()
    .single()
  if (error) throw error
  await logAdminAction(adminId, approve ? 'VERIFY_COMPANY' : 'REJECT_COMPANY', 'company', companyId, {})
  return data
}

// ════════════════════════════════════
// JOB MODERATION
// ════════════════════════════════════

export async function getAllJobs({ status = null, search = '', page = 1, limit = 50 }) {
  let q = supabaseAdmin
    .from('jobs')
    .select(`
      id, title, job_type, work_mode, status, is_featured,
      views_count, applications_count, created_at,
      companies!inner(name, logo_url),
      users!posted_by(full_name, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)
  if (search) q = q.ilike('title', `%${search}%`)
  q = q.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await q
  if (error) throw error
  return { jobs: data, total: count }
}

export async function featureJob(adminId, jobId, featured = true) {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .update({ is_featured: featured })
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  await logAdminAction(adminId, featured ? 'FEATURE_JOB' : 'UNFEATURE_JOB', 'job', jobId, {})
  return data
}

export async function removeJob(adminId, jobId, reason) {
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', jobId)
  if (error) throw error
  await logAdminAction(adminId, 'REMOVE_JOB', 'job', jobId, { reason })
}

// ════════════════════════════════════
// PLATFORM SETTINGS
// ════════════════════════════════════

export async function getPlatformSettings() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('*')
  if (error) throw error
  // Convert array to key-value object
  return Object.fromEntries(data.map(s => [s.key, s.value]))
}

export async function updatePlatformSetting(adminId, key, value) {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .upsert({ key, value, updated_by: adminId, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  await logAdminAction(adminId, 'SETTINGS', 'platform', null, { key, value })
  return data
}

// ════════════════════════════════════
// PAYMENT & SUBSCRIPTION MANAGEMENT
// ════════════════════════════════════

export async function getAllSubscriptions({ status = null, plan = null, page = 1, limit = 50 }) {
  let q = supabaseAdmin
    .from('subscriptions')
    .select(`
      id, plan, amount, currency, payment_id, status,
      starts_at, ends_at, auto_renew, created_at,
      users!inner(id, email, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)
  if (plan)   q = q.eq('plan', plan)
  q = q.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await q
  if (error) throw error
  return { subscriptions: data, total: count }
}

export async function getRevenueStats() {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('amount, plan, created_at, status')
    .eq('status', 'success')
  if (error) throw error

  const now   = new Date()
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  const year  = new Date(now.getFullYear(), 0, 1)

  return {
    total_revenue:    data.reduce((s, r) => s + Number(r.amount), 0),
    monthly_revenue:  data.filter(r => new Date(r.created_at) >= month).reduce((s, r) => s + Number(r.amount), 0),
    annual_revenue:   data.filter(r => new Date(r.created_at) >= year).reduce((s, r) => s + Number(r.amount), 0),
    by_plan: {
      premium:      data.filter(r => r.plan === 'premium').reduce((s, r) => s + Number(r.amount), 0),
      premium_plus: data.filter(r => r.plan === 'premium_plus').reduce((s, r) => s + Number(r.amount), 0),
      enterprise:   data.filter(r => r.plan === 'enterprise').reduce((s, r) => s + Number(r.amount), 0),
    },
  }
}

// ════════════════════════════════════
// ADVERTISEMENT MANAGEMENT
// ════════════════════════════════════

export async function getAllAds() {
  const { data, error } = await supabaseAdmin
    .from('ads')
    .select(`
      *, users!advertiser_id(full_name, email)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function toggleAd(adminId, adId, active) {
  const { data, error } = await supabaseAdmin
    .from('ads')
    .update({ is_active: active })
    .eq('id', adId)
    .select()
    .single()
  if (error) throw error
  await logAdminAction(adminId, active ? 'ENABLE_AD' : 'DISABLE_AD', 'ad', adId, {})
  return data
}

// ════════════════════════════════════
// ACTIVITY LOGS
// ════════════════════════════════════

export async function logAdminAction(adminId, action, entityType, entityId, details = {}) {
  await supabaseAdmin.from('admin_logs').insert({
    admin_id:    adminId,
    action,
    entity_type: entityType,
    entity_id:   entityId,
    details,
  })
}

export async function getAdminLogs({ action = null, page = 1, limit = 100 }) {
  let q = supabaseAdmin
    .from('admin_logs')
    .select(`
      *, users!admin_id(full_name, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (action) q = q.eq('action', action)
  q = q.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await q
  if (error) throw error
  return { logs: data, total: count }
}

// ════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════

export async function getAnalytics() {
  const [appStats, jobStats, userGrowth] = await Promise.all([
    // Application funnel
    supabaseAdmin.from('applications').select('status'),
    // Top companies by jobs
    supabaseAdmin.from('jobs').select('company_id, companies(name)').eq('status', 'active'),
    // User signups last 30 days
    supabaseAdmin.from('users')
      .select('created_at, role, subscription')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const funnel = {
    applied:     appStats.data?.filter(a => a.status === 'applied').length     || 0,
    viewed:      appStats.data?.filter(a => a.status === 'viewed').length      || 0,
    shortlisted: appStats.data?.filter(a => a.status === 'shortlisted').length || 0,
    interview:   appStats.data?.filter(a => a.status === 'interview').length   || 0,
    selected:    appStats.data?.filter(a => a.status === 'selected').length    || 0,
    rejected:    appStats.data?.filter(a => a.status === 'rejected').length    || 0,
  }

  // Growth by day (last 30)
  const growth = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    const dayStr = d.toISOString().slice(0, 10)
    return {
      date:  dayStr,
      users: userGrowth.data?.filter(u => u.created_at?.slice(0, 10) === dayStr).length || 0,
    }
  })

  return { funnel, growth }
}
