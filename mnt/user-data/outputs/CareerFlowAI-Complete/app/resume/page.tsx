'use client'
// app/resume/page.tsx
// ─────────────────────────────────────────────────────────────
// AI Resume Builder + ATS Scorer
// Upload resume → Gemini AI scores it → shows issues + fixes
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { BRAND } from '@/lib/config'

type ScoreResult = {
  overall_score: number
  verdict: string
  breakdown: Record<string, number>
  issues: { type: string; text: string; fix: string }[]
  missing_keywords: string[]
  present_keywords: string[]
  one_line_summary: string
}

export default function ResumePage() {
  const [file, setFile]           = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<ScoreResult | null>(null)
  const [dragOver, setDragOver]   = useState(false)

  async function analyzeResume() {
    if (!file) { alert('Please upload your resume first'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('targetRole', targetRole || 'Software Engineer')

      const res = await fetch('/api/ai/score-resume', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      alert('Error analyzing resume: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const scoreColor = (score: number) =>
    score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'

  const issueColor = (type: string) => ({
    error: { bg: '#fef2f2', text: '#dc2626', icon: '❌' },
    warn:  { bg: '#fffbeb', text: '#d97706', icon: '⚠️' },
    ok:    { bg: '#f0fdf4', text: '#059669', icon: '✅' },
  })[type] || { bg: '#f5f4f0', text: '#666', icon: 'ℹ️' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>

      {/* Nav */}
      <nav style={{ background: '#0f172a', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #1f2535' }}>
        <a href="/" style={{ fontSize: '16px', fontWeight: '800', textDecoration: 'none', color: '#fff', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px' }}>
          {['Jobs', 'Dashboard'].map(label => (
            <a key={label} href={`/${label.toLowerCase()}`}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '32px auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            AI Resume Analyzer 🤖
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Upload your resume and get an instant ATS score + personalized improvement tips for the Indian job market.
          </p>
        </div>

        {/* Upload card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2dfd6', marginBottom: '16px' }}>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>
              Target Job Role (optional but recommended)
            </label>
            <input
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior React Developer, Data Analyst, Product Manager"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2dfd6', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Drop zone */}
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: 'block',
              border: `2px dashed ${dragOver ? '#0f172a' : file ? BRAND.accentColor : '#e2dfd6'}`,
              borderRadius: '14px', padding: '36px', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? '#f5f4f0' : file ? '#f0fdf4' : '#fff',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>
              {file ? '✅' : '📄'}
            </div>
            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px', color: file ? '#059669' : '#333' }}>
              {file ? file.name : 'Drop your resume here or click to browse'}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {file
                ? `${(file.size / 1024).toFixed(0)} KB · Click to change`
                : 'PDF, DOC, DOCX, or TXT — max 5MB'}
            </div>
          </label>

          <button
            onClick={analyzeResume}
            disabled={loading || !file}
            style={{
              width: '100%', marginTop: '16px', padding: '13px',
              background: (!file || loading) ? '#ccc' : '#0f172a',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: (!file || loading) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {loading ? '🤖 Analyzing with AI...' : '✨ Analyze Resume'}
          </button>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#888' }}>
              Reading resume → scoring keywords → generating feedback...
            </div>
          )}
        </div>

        {/* Score Result */}
        {result && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2dfd6' }}>

            {/* Score hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: '#0f172a', borderRadius: '14px', marginBottom: '24px' }}>
              <div style={{ fontSize: '60px', fontWeight: '800', color: scoreColor(result.overall_score), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {result.overall_score}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                  ATS Score — {result.verdict}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                  {result.one_line_summary}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(result.breakdown || {}).map(([key, val]) => (
                    <div key={key} style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                      {key}: <strong style={{ color: scoreColor(val as number) }}>{val as number}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Issues */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Detailed Feedback
              </div>
              {(result.issues || []).map((issue, i) => {
                const c = issueColor(issue.type)
                return (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px', borderRadius: '10px', marginBottom: '6px', background: c.bg }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: c.text }}>{issue.text}</div>
                      {issue.fix && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>→ {issue.fix}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Keywords */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {result.missing_keywords?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    ❌ Missing Keywords
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {result.missing_keywords.map(k => (
                      <span key={k} style={{ fontSize: '11px', padding: '3px 10px', background: '#fef2f2', color: '#dc2626', borderRadius: '20px', border: '1px solid #fecaca' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.present_keywords?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    ✅ Found Keywords
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {result.present_keywords.slice(0, 10).map(k => (
                      <span key={k} style={{ fontSize: '11px', padding: '3px 10px', background: '#f0fdf4', color: '#059669', borderRadius: '20px', border: '1px solid #d1fae5' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#f5f4f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>Want a higher score?</div>
                <div style={{ fontSize: '12px', color: '#888' }}>AI Career Coach can rewrite your resume for specific jobs</div>
              </div>
              <a href="/dashboard" style={{ padding: '9px 18px', background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                Go to Dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
