'use client'
// app/recruiter/page.tsx
// ─────────────────────────────────────────────────────────────
// Recruiter dashboard — post jobs, view applicants
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createJob, getRecruiterJobs, setJobStatus } from '@/lib/jobs'
import { getJobApplications } from '@/lib/jobs'
import { BRAND } from '@/lib/config'

export default function RecruiterPage() {
  const [user, setUser]           = useState<any>(null)
  const [jobs, setJobs]           = useState<any[]>([])
  const [applicants, setApplicants] = useState<any[]>([])
  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [posting, setPosting]     = useState(false)
  const [tab, setTab]             = useState<'jobs' | 'applicants'>('jobs')

  // Form fields
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [city, setCity]     = useState('')
  const [type, setType]     = useState('full_time')
  const [mode, setMode]     = useState('onsite')
  const [minSal, setMinSal] = useState('')
  const [maxSal, setMaxSal] = useState('')
  const [skills, setSkills] = useState('')

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { window.location.href = '/login'; return }
      setUser(u)
      await refreshJobs(u.id)
    }
    load()
  }, [])

  async function refreshJobs(uid: string) {
    try {
      const myJobs = await getRecruiterJobs(uid)
      setJobs(myJobs || [])
    } catch (e) { console.error(e) }
  }

  async function handlePostJob() {
    if (!title || !desc) { alert('Job title and description are required'); return }
    setPosting(true)
    try {
      // NOTE: Replace 'YOUR-COMPANY-ID' with your actual company ID from Supabase
      // You can get it by creating a company first in Supabase Table Editor → companies
      await createJob(user.id, 'YOUR-COMPANY-ID', {
        title,
        description: desc,
        city,
        job_type: type,
        work_mode: mode,
        min_salary: minSal ? Number(minSal) * 100000 : 0,
        max_salary: maxSal ? Number(maxSal) * 100000 : 0,
        required_skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      })
      alert('✅ Job posted successfully!')
      setShowForm(false)
      setTitle(''); setDesc(''); setCity(''); setMinSal(''); setMaxSal(''); setSkills('')
      await refreshJobs(user.id)
    } catch (err: any) {
      alert('Error posting job: ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  async function viewApplicants(jobId: string) {
    setActiveJob(jobId)
    setTab('applicants')
    try {
      const apps = await getJobApplications(jobId)
      setApplicants(apps || [])
    } catch (e) { console.error(e) }
  }

  async function toggleJob(jobId: string, currentStatus: string) {
    try {
      await setJobStatus(jobId, currentStatus === 'active' ? 'paused' : 'active')
      await refreshJobs(user.id)
    } catch (e) { console.error(e) }
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2dfd6', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '10px' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
      <nav style={{ background: '#fff', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2dfd6' }}>
        <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#888', marginLeft: '8px' }}>Recruiter</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowForm(f => !f)}
            style={{ padding: '8px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            + Post Job
          </button>
          <a href="/dashboard" style={{ padding: '8px 14px', background: '#f5f4f0', color: '#333', border: '1px solid #ddd', borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}>
            Dashboard
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Post Job Form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1.5px solid #0f172a' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Post a New Job</h2>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Job Title *" style={inp} />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Job Description *" rows={4} style={{ ...inp, resize: 'vertical' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" style={{ ...inp, marginBottom: 0 }} />
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, marginBottom: 0 }}>
                {['full_time', 'part_time', 'contract', 'internship'].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
              <select value={mode} onChange={e => setMode(e.target.value)} style={{ ...inp, marginBottom: 0 }}>
                {['onsite', 'remote', 'hybrid'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input value={minSal} onChange={e => setMinSal(e.target.value)} placeholder="Min Salary (LPA)" type="number" style={{ ...inp, marginBottom: 0 }} />
              <input value={maxSal} onChange={e => setMaxSal(e.target.value)} placeholder="Max Salary (LPA)" type="number" style={{ ...inp, marginBottom: 0 }} />
            </div>
            <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Required skills (comma separated): React, Node.js, SQL" style={{ ...inp, marginTop: '10px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePostJob} disabled={posting}
                style={{ flex: 1, padding: '11px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                {posting ? 'Posting...' : '✅ Post Job'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '11px 20px', background: '#f5f4f0', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {(['jobs', 'applicants'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: tab === t ? '#0f172a' : '#fff', color: tab === t ? '#fff' : '#666', border: `1px solid ${tab === t ? '#0f172a' : '#e2dfd6'}` }}>
              {t === 'jobs' ? `My Jobs (${jobs.length})` : `Applicants (${applicants.length})`}
            </button>
          ))}
        </div>

        {/* Jobs list */}
        {tab === 'jobs' && (
          <div>
            {jobs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#888', border: '1px solid #e2dfd6' }}>
                No jobs posted yet — click <strong>+ Post Job</strong> to start hiring
              </div>
            ) : jobs.map(job => (
              <div key={job.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', marginBottom: '8px', border: '1px solid #e2dfd6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>{job.title}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {job.applications_count || 0} applicants · {job.work_mode} · {job.status}
                  </div>
                </div>
                <button onClick={() => viewApplicants(job.id)}
                  style={{ padding: '6px 14px', background: '#f5f4f0', border: '1px solid #e2dfd6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                  View Applicants
                </button>
                <button onClick={() => toggleJob(job.id, job.status)}
                  style={{ padding: '6px 14px', background: job.status === 'active' ? '#fffbeb' : '#f0fdf4', border: '1px solid', borderColor: job.status === 'active' ? '#fcd34d' : '#d1fae5', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: job.status === 'active' ? '#d97706' : '#059669' }}>
                  {job.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Applicants list */}
        {tab === 'applicants' && (
          <div>
            {applicants.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#888' }}>
                No applicants yet for this job
              </div>
            ) : applicants.map((app: any) => (
              <div key={app.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', marginBottom: '8px', border: '1px solid #e2dfd6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#4f46e5', flexShrink: 0 }}>
                  {app.users?.full_name?.slice(0, 2).toUpperCase() || 'NA'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{app.users?.full_name || app.users?.email || 'Applicant'}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    ATS: {app.resumes?.ats_score || '—'} · Match: {app.match_score || '—'}% · {app.status}
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: app.status === 'shortlisted' ? '#f0fdf4' : '#f5f4f0', color: app.status === 'shortlisted' ? '#059669' : '#888', fontWeight: '600' }}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
