'use client'
// app/jobs/page.tsx
// ─────────────────────────────────────────────────────────────
// Job search page — shows all jobs from Supabase database
// Students can search, filter, and apply directly
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react'
import { searchJobs } from '@/lib/jobs'
import { applyToJob, getSavedJobs, saveJob, unsaveJob } from '@/lib/student'
import { getCurrentUser } from '@/lib/auth'
import { BRAND } from '@/lib/config'

type Job = {
  id: string
  title: string
  job_type: string
  work_mode: string
  min_salary: number
  max_salary: number
  required_skills: string[]
  city: string
  created_at: string
  applications_count: number
  is_featured: boolean
  companies: { name: string; logo_url: string | null; city: string }
}

const WORK_MODES  = ['remote', 'hybrid', 'onsite']
const JOB_TYPES   = ['full_time', 'part_time', 'contract', 'internship']
const EXP_LEVELS  = ['fresher', 'junior', 'mid', 'senior']

export default function JobsPage() {
  const [jobs, setJobs]           = useState<Job[]>([])
  const [user, setUser]           = useState<any>(null)
  const [query, setQuery]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [applying, setApplying]   = useState<string | null>(null)
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [total, setTotal]         = useState(0)

  // Filters
  const [workMode,  setWorkMode]  = useState<string[]>([])
  const [jobType,   setJobType]   = useState<string[]>([])
  const [minSal,    setMinSal]    = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    getCurrentUser().then(u => {
      setUser(u)
      if (u) loadSaved(u.id)
    })
    loadJobs()
  }, [])

  async function loadSaved(userId: string) {
    try {
      const saved = await getSavedJobs(userId)
      setSavedIds(new Set(saved.map((s: any) => s.job_id)))
    } catch { /* ignore */ }
  }

  const loadJobs = useCallback(async (q = query) => {
    setLoading(true)
    try {
      const result = await searchJobs({
        query: q,
        workMode,
        jobType,
        minSalary: minSal ? Number(minSal) * 100000 : null,
        sortBy: 'match',
        limit: 24,
      })
      setJobs(result.jobs || [])
      setTotal(result.total || 0)
    } catch (err) {
      console.error('Load jobs error:', err)
    } finally {
      setLoading(false)
    }
  }, [query, workMode, jobType, minSal])

  async function handleApply(jobId: string) {
    if (!user) { window.location.href = '/login'; return }
    setApplying(jobId)
    try {
      await applyToJob(user.id, jobId, null, '')
      setAppliedIds(prev => new Set([...prev, jobId]))
      alert('✅ Applied successfully! Track it in your Dashboard.')
    } catch (err: any) {
      if (err.message?.includes('Already applied')) {
        alert('You already applied to this job!')
        setAppliedIds(prev => new Set([...prev, jobId]))
      } else {
        alert('Error: ' + err.message)
      }
    } finally {
      setApplying(null)
    }
  }

  async function handleSave(jobId: string) {
    if (!user) { window.location.href = '/login'; return }
    try {
      if (savedIds.has(jobId)) {
        await unsaveJob(user.id, jobId)
        setSavedIds(prev => { const s = new Set(prev); s.delete(jobId); return s })
      } else {
        await saveJob(user.id, jobId)
        setSavedIds(prev => new Set([...prev, jobId]))
      }
    } catch (err: any) {
      console.error('Save error:', err)
    }
  }

  function toggleFilter(arr: string[], setArr: any, val: string) {
    setArr((prev: string[]) =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    )
  }

  // Styles
  const s = {
    nav: { background: '#fff', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #e2dfd6', position: 'sticky' as const, top: 0, zIndex: 10 },
    logo: { fontSize: '16px', fontWeight: '800', textDecoration: 'none', color: '#0f172a', letterSpacing: '-0.4px' },
    navLink: { fontSize: '13px', color: '#666', textDecoration: 'none' },
    heroWrap: { background: '#0f172a', padding: '40px 24px 32px' },
    heroInner: { maxWidth: '720px', margin: '0 auto' },
    heroTitle: { color: '#fff', fontSize: '32px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.8px' },
    searchRow: { display: 'flex', gap: '8px' },
    searchInput: { flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none', fontSize: '14px', fontFamily: 'inherit', outline: 'none' },
    searchBtn: { padding: '12px 24px', background: BRAND.accentColor, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterBtn: { padding: '12px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '13px', cursor: 'pointer' },
    body: { maxWidth: '900px', margin: '0 auto', padding: '24px 16px' },
    countRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    countText: { fontSize: '13px', color: '#888' },
    filterPanel: { background: '#fff', border: '1px solid #e2dfd6', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
    filterTitle: { fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' },
    chip: (active: boolean) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', margin: '2px', border: `1.5px solid ${active ? '#0f172a' : '#e2dfd6'}`, background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#666' }),
    card: (featured: boolean) => ({ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '10px', border: `1px solid ${featured ? BRAND.accentColor : '#e2dfd6'}`, transition: 'box-shadow 0.15s' }),
    jobTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '2px', color: '#0f172a' },
    jobCompany: { fontSize: '13px', color: '#888', marginBottom: '10px' },
    metaTag: { fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#f5f4f0', color: '#666', border: '1px solid #e2dfd6' },
    salTag: { fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#f0fdf4', color: '#059669', border: '1px solid #d1fae5', fontWeight: '600' },
    skillTag: { fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#f5f4f0', color: '#888', border: '1px solid #e2dfd6' },
    applyBtn: (applied: boolean) => ({ padding: '8px 18px', background: applied ? '#f0fdf4' : '#0f172a', color: applied ? '#059669' : '#fff', border: applied ? '1px solid #d1fae5' : 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: applied ? 'default' : 'pointer' }),
    saveBtn: (saved: boolean) => ({ padding: '8px 10px', background: saved ? '#fffbeb' : '#f5f4f0', border: `1px solid ${saved ? '#fcd34d' : '#e2dfd6'}`, borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }),
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>

      {/* Nav */}
      <nav style={s.nav}>
        <a href="/" style={s.logo}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/dashboard" style={s.navLink}>Dashboard</a>
          <a href="/resume" style={s.navLink}>Resume AI</a>
          {user
            ? <a href="/dashboard" style={{ ...s.navLink, fontWeight: '600', color: '#0f172a' }}>Hi, {user.email?.split('@')[0]}</a>
            : <a href="/login" style={{ padding: '7px 16px', background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>Sign in</a>
          }
        </div>
      </nav>

      {/* Hero search */}
      <div style={s.heroWrap}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>Find jobs that match your skills 🎯</h1>
          <div style={s.searchRow}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadJobs(query)}
              placeholder="Job title, skill, or company..."
              style={s.searchInput}
            />
            <button onClick={() => loadJobs(query)} style={s.searchBtn}>Search</button>
            <button onClick={() => setShowFilters(f => !f)} style={s.filterBtn}>
              {showFilters ? 'Hide Filters' : 'Filters ▾'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>

        {/* Filters */}
        {showFilters && (
          <div style={s.filterPanel}>
            <div>
              <div style={s.filterTitle}>Work Mode</div>
              {WORK_MODES.map(m => (
                <span key={m} style={s.chip(workMode.includes(m))} onClick={() => toggleFilter(workMode, setWorkMode, m)}>
                  {m}
                </span>
              ))}
            </div>
            <div>
              <div style={s.filterTitle}>Job Type</div>
              {JOB_TYPES.map(t => (
                <span key={t} style={s.chip(jobType.includes(t))} onClick={() => toggleFilter(jobType, setJobType, t)}>
                  {t.replace('_', ' ')}
                </span>
              ))}
            </div>
            <div>
              <div style={s.filterTitle}>Min Salary (₹ LPA)</div>
              <input
                value={minSal}
                onChange={e => setMinSal(e.target.value)}
                placeholder="e.g. 10"
                type="number"
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2dfd6', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
          </div>
        )}

        {/* Count + apply filters */}
        <div style={s.countRow}>
          <span style={s.countText}>
            {loading ? 'Loading...' : `${total} jobs found`}
          </span>
          {(workMode.length > 0 || jobType.length > 0 || minSal) && (
            <button onClick={() => { setWorkMode([]); setJobType([]); setMinSal('') }}
              style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Job cards */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ ...s.card(false), opacity: 0.4, height: '120px', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>No jobs found</div>
            <div style={{ fontSize: '13px' }}>Try different keywords or clear filters</div>
          </div>
        ) : (
          jobs.map(job => {
            const applied = appliedIds.has(job.id)
            const saved   = savedIds.has(job.id)
            const isApplying = applying === job.id
            const salMin  = Math.round((job.min_salary || 0) / 100000)
            const salMax  = Math.round((job.max_salary || 0) / 100000)

            return (
              <div key={job.id} style={s.card(job.is_featured)}>
                {job.is_featured && (
                  <div style={{ fontSize: '11px', color: BRAND.accentColor, fontWeight: '700', marginBottom: '6px' }}>
                    ⭐ FEATURED
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={s.jobTitle}>{job.title}</div>
                    <div style={s.jobCompany}>{job.companies?.name} · {job.city || job.companies?.city || 'India'}</div>
                  </div>
                  <button onClick={() => handleSave(job.id)} style={s.saveBtn(saved)} title={saved ? 'Unsave' : 'Save'}>
                    {saved ? '🔖' : '🔖'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={s.metaTag}>{job.job_type?.replace('_', ' ')}</span>
                  <span style={s.metaTag}>{job.work_mode}</span>
                  {salMax > 0 && <span style={s.salTag}>₹{salMin}–{salMax} LPA</span>}
                  <span style={{ ...s.metaTag, color: '#888', fontSize: '10px' }}>{job.applications_count || 0} applicants</span>
                </div>

                {job.required_skills?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {job.required_skills.slice(0, 6).map(skill => (
                      <span key={skill} style={s.skillTag}>{skill}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#bbb' }}>
                    {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <button
                    onClick={() => !applied && !isApplying && handleApply(job.id)}
                    disabled={isApplying}
                    style={s.applyBtn(applied)}
                  >
                    {isApplying ? 'Applying...' : applied ? '✓ Applied' : 'Apply Now'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
