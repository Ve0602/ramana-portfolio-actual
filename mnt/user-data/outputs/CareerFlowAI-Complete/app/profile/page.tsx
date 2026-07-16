'use client'
// app/profile/page.tsx
// ─────────────────────────────────────────────────────────────
// Student Profile Page — edit personal info, skills, experience
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getStudentProfile, updateStudentProfile, addUserSkill, removeUserSkill, addEducation, addWorkExperience } from '@/lib/student'
import { BRAND } from '@/lib/config'

export default function ProfilePage() {
  const [user, setUser]         = useState<any>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState<'basic'|'skills'|'experience'|'education'>('basic')
  const [newSkill, setNewSkill] = useState('')

  // Basic info form
  const [headline, setHeadline] = useState('')
  const [bio, setBio]           = useState('')
  const [city, setCity]         = useState('')
  const [github, setGithub]     = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [expYrs, setExpYrs]     = useState('')
  const [expSal, setExpSal]     = useState('')
  const [notice, setNotice]     = useState('')

  // Add experience form
  const [showExpForm, setShowExpForm]   = useState(false)
  const [expTitle, setExpTitle]         = useState('')
  const [expCompany, setExpCompany]     = useState('')
  const [expStart, setExpStart]         = useState('')
  const [expEnd, setExpEnd]             = useState('')
  const [expDesc, setExpDesc]           = useState('')

  // Add education form
  const [showEduForm, setShowEduForm]   = useState(false)
  const [eduDegree, setEduDegree]       = useState('')
  const [eduSchool, setEduSchool]       = useState('')
  const [eduFrom, setEduFrom]           = useState('')
  const [eduTo, setEduTo]               = useState('')
  const [eduGrade, setEduGrade]         = useState('')

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { window.location.href = '/login'; return }
      setUser(u)
      try {
        const p = await getStudentProfile(u.id)
        setProfile(p)
        setHeadline(p?.headline || '')
        setBio(p?.bio || '')
        setCity(p?.city || '')
        setGithub(p?.github_url || '')
        setLinkedin(p?.linkedin_url || '')
        setPortfolio(p?.portfolio_url || '')
        setExpYrs(String(p?.total_experience_yrs || 0))
        setExpSal(String(p?.expected_salary ? p.expected_salary / 100000 : ''))
        setNotice(String(p?.notice_period_days || 0))
      } catch { /* no profile yet — will create on save */ }
      setLoading(false)
    }
    load()
  }, [])

  async function saveBasic() {
    setSaving(true)
    try {
      await updateStudentProfile(user.id, {
        headline,
        bio,
        city,
        github_url: github,
        linkedin_url: linkedin,
        portfolio_url: portfolio,
        total_experience_yrs: Number(expYrs) || 0,
        expected_salary: expSal ? Number(expSal) * 100000 : null,
        notice_period_days: Number(notice) || 0,
      })
      alert('✅ Profile saved!')
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSkill() {
    if (!newSkill.trim()) return
    try {
      await addUserSkill(user.id, newSkill.trim())
      const p = await getStudentProfile(user.id)
      setProfile(p)
      setNewSkill('')
    } catch (e: any) { alert(e.message) }
  }

  async function handleRemoveSkill(skillId: string) {
    try {
      await removeUserSkill(user.id, skillId)
      const p = await getStudentProfile(user.id)
      setProfile(p)
    } catch (e: any) { alert(e.message) }
  }

  async function handleAddExp() {
    if (!expTitle || !expCompany) { alert('Title and company are required'); return }
    try {
      await addWorkExperience(user.id, {
        title: expTitle,
        company: expCompany,
        start_date: expStart,
        end_date: expEnd || null,
        is_current: !expEnd,
        description: expDesc,
      })
      const p = await getStudentProfile(user.id)
      setProfile(p)
      setShowExpForm(false)
      setExpTitle(''); setExpCompany(''); setExpStart(''); setExpEnd(''); setExpDesc('')
    } catch (e: any) { alert(e.message) }
  }

  async function handleAddEdu() {
    if (!eduDegree || !eduSchool) { alert('Degree and school are required'); return }
    try {
      await addEducation(user.id, {
        degree: eduDegree,
        institution: eduSchool,
        start_year: Number(eduFrom),
        end_year: Number(eduTo),
        grade: eduGrade,
      })
      const p = await getStudentProfile(user.id)
      setProfile(p)
      setShowEduForm(false)
      setEduDegree(''); setEduSchool(''); setEduFrom(''); setEduTo(''); setEduGrade('')
    } catch (e: any) { alert(e.message) }
  }

  const inp = (val: string, set: (v: string) => void, placeholder: string, type = 'text') => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} type={type}
      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2dfd6', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '10px' }} />
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0', color: '#888' }}>
      Loading profile...
    </div>
  )

  const skills = profile?.user_skills || []
  const experiences = profile?.work_experience || []
  const educations = profile?.education || []
  const completion = profile?.profile_completion || 0

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2dfd6', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/" style={{ fontSize: '16px', fontWeight: '800', textDecoration: 'none', color: '#0f172a', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Dashboard</a>
          <a href="/jobs" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Jobs</a>
        </div>
      </nav>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 16px' }}>

        {/* Profile header */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e2dfd6', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', flexShrink: 0 }}>
            {user?.email?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '2px', letterSpacing: '-0.3px' }}>
              {profile?.users?.full_name || user?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              {headline || 'Add your professional headline'}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {city && <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#f5f4f0', color: '#666', border: '1px solid #e2dfd6' }}>📍 {city}</span>}
              <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#f5f4f0', color: '#666', border: '1px solid #e2dfd6' }}>{user?.email}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: completion >= 80 ? BRAND.accentColor : '#d97706', lineHeight: 1 }}>{completion}%</div>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Profile</div>
            <div style={{ width: '50px', height: '4px', background: '#f5f4f0', borderRadius: '2px', margin: '6px auto 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completion}%`, background: completion >= 80 ? BRAND.accentColor : '#d97706', borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#fff', padding: '4px', borderRadius: '12px', border: '1px solid #e2dfd6' }}>
          {(['basic', 'skills', 'experience', 'education'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', background: tab === t ? '#0f172a' : 'transparent', color: tab === t ? '#fff' : '#666', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* BASIC INFO */}
        {tab === 'basic' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2dfd6' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>Basic Information</div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Professional Headline</label>
            {inp(headline, setHeadline, 'e.g. Full Stack Developer | React & Node.js')}
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>About / Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a brief professional summary..." rows={4}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2dfd6', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '10px', resize: 'vertical' }} />
            {inp(city, setCity, 'City (e.g. Mumbai, Bangalore)')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Experience (years)</label>
                {inp(expYrs, setExpYrs, '0', 'number')}
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Expected CTC (₹ LPA)</label>
                {inp(expSal, setExpSal, '10', 'number')}
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Notice Period (days)</label>
                {inp(notice, setNotice, '30', 'number')}
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 8px' }}>Links</div>
            {inp(github, setGithub, 'https://github.com/username')}
            {inp(linkedin, setLinkedin, 'https://linkedin.com/in/username')}
            {inp(portfolio, setPortfolio, 'https://yourportfolio.com')}
            <button onClick={saveBasic} disabled={saving}
              style={{ width: '100%', padding: '12px', background: saving ? '#ccc' : '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : '💾 Save Profile'}
            </button>
          </div>
        )}

        {/* SKILLS */}
        {tab === 'skills' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2dfd6' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>Skills</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add a skill (e.g. React, Python, SQL)"
                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2dfd6', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={handleAddSkill}
                style={{ padding: '10px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Add
              </button>
            </div>
            {skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#bbb', fontSize: '13px' }}>
                No skills added yet. Add skills to improve your job matches!
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.map((s: any) => (
                  <div key={s.skill_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f5f4f0', border: '1px solid #e2dfd6', borderRadius: '20px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>{s.skills?.name}</span>
                    <button onClick={() => handleRemoveSkill(s.skill_id)}
                      style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f4f0', borderRadius: '10px', fontSize: '12px', color: '#888' }}>
              💡 Tip: Add skills that match the jobs you want. More skills = better AI job matching.
            </div>
          </div>
        )}

        {/* EXPERIENCE */}
        {tab === 'experience' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2dfd6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Work Experience</div>
              <button onClick={() => setShowExpForm(f => !f)}
                style={{ padding: '7px 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                + Add
              </button>
            </div>
            {showExpForm && (
              <div style={{ background: '#f5f4f0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #e2dfd6' }}>
                {inp(expTitle, setExpTitle, 'Job Title *')}
                {inp(expCompany, setExpCompany, 'Company Name *')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Start Date</label>
                    {inp(expStart, setExpStart, '', 'date')}
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>End Date (blank = current)</label>
                    {inp(expEnd, setExpEnd, '', 'date')}
                  </div>
                </div>
                <textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Describe your responsibilities and achievements..." rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2dfd6', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddExp} style={{ flex: 1, padding: '9px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                  <button onClick={() => setShowExpForm(false)} style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            )}
            {experiences.length === 0 && !showExpForm ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#bbb', fontSize: '13px' }}>No experience added yet</div>
            ) : experiences.map((exp: any) => (
              <div key={exp.id} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '1px solid #f5f4f0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#666', flexShrink: 0 }}>
                  {exp.company?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>{exp.title}</div>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '2px' }}>{exp.company}</div>
                  <div style={{ fontSize: '11px', color: '#bbb' }}>
                    {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EDUCATION */}
        {tab === 'education' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2dfd6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Education</div>
              <button onClick={() => setShowEduForm(f => !f)}
                style={{ padding: '7px 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                + Add
              </button>
            </div>
            {showEduForm && (
              <div style={{ background: '#f5f4f0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #e2dfd6' }}>
                {inp(eduDegree, setEduDegree, 'Degree (e.g. B.Tech Computer Science) *')}
                {inp(eduSchool, setEduSchool, 'Institution Name *')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {inp(eduFrom, setEduFrom, 'From Year', 'number')}
                  {inp(eduTo, setEduTo, 'To Year', 'number')}
                  {inp(eduGrade, setEduGrade, 'CGPA / %')}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddEdu} style={{ flex: 1, padding: '9px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                  <button onClick={() => setShowEduForm(false)} style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            )}
            {educations.length === 0 && !showEduForm ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#bbb', fontSize: '13px' }}>No education added yet</div>
            ) : educations.map((edu: any) => (
              <div key={edu.id} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '1px solid #f5f4f0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#666', flexShrink: 0 }}>
                  🎓
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>{edu.degree}</div>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '2px' }}>{edu.institution}</div>
                  <div style={{ fontSize: '11px', color: '#bbb' }}>
                    {edu.start_year} — {edu.end_year} {edu.grade && `· ${edu.grade}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
