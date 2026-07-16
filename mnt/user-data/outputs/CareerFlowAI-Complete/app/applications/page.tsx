'use client'
// app/applications/page.tsx
// ─────────────────────────────────────────────────────────────
// Application Tracker — shows all job applications
// with status kanban board: Applied → Shortlisted → Offer
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getMyApplications, getApplicationStats, withdrawApplication } from '@/lib/student'
import { BRAND } from '@/lib/config'

const STATUS_COLS = [
  { key: 'applied',     label: 'Applied',     color: '#64748b', bg: '#f1f5f9' },
  { key: 'viewed',      label: 'Viewed',      color: '#2563eb', bg: '#eff6ff' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#059669', bg: '#f0fdf4' },
  { key: 'interview',   label: 'Interview',   color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'assessment',  label: 'Assessment',  color: '#d97706', bg: '#fffbeb' },
  { key: 'selected',    label: '🎉 Offer',    color: '#059669', bg: '#ecfdf5' },
  { key: 'rejected',    label: 'Rejected',    color: '#dc2626', bg: '#fef2f2' },
]

export default function ApplicationsPage() {
  const [user, setUser]       = useState<any>(null)
  const [apps, setApps]       = useState<any[]>([])
  const [stats, setStats]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState<'kanban' | 'list'>('kanban')
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { window.location.href = '/login'; return }
      setUser(u)
      try {
        const [appsData, statsData] = await Promise.all([
          getMyApplications(u.id),
          getApplicationStats(u.id),
        ])
        setApps(appsData || [])
        setStats(statsData)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  async function handleWithdraw(appId: string) {
    if (!confirm('Withdraw this application?')) return
    try {
      await withdrawApplication(appId)
      setApps(prev => prev.filter(a => a.id !== appId))
      setSelected(null)
    } catch (e: any) { alert(e.message) }
  }

  const appsForStatus = (status: string) =>
    apps.filter(a => a.status === status)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
        Loading your applications...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2dfd6', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/" style={{ fontSize: '16px', fontWeight: '800', textDecoration: 'none', color: '#0f172a', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Dashboard</a>
          <a href="/jobs" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Find Jobs</a>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>

        {/* Header + stats */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                My Applications 📊
              </h1>
              <p style={{ color: '#888', fontSize: '13px' }}>Track every application from applied to offer</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['kanban', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '7px 14px', border: `1px solid ${view === v ? '#0f172a' : '#e2dfd6'}`, borderRadius: '8px', background: view === v ? '#0f172a' : '#fff', color: view === v ? '#fff' : '#666', fontSize: '12px', cursor: 'pointer', fontWeight: '500', textTransform: 'capitalize' }}>
                  {v === 'kanban' ? '⬡ Board' : '☰ List'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Total',       val: stats.total,       color: '#0f172a' },
                { label: 'Shortlisted', val: stats.shortlisted, color: '#059669' },
                { label: 'Interviews',  val: stats.interview,   color: '#7c3aed' },
                { label: 'Rejected',    val: stats.rejected,    color: '#dc2626' },
                { label: '🎉 Offers',   val: stats.selected,    color: '#d97706' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', border: '1px solid #e2dfd6', textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KANBAN VIEW */}
        {view === 'kanban' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px' }}>
            {STATUS_COLS.map(col => {
              const colApps = appsForStatus(col.key)
              return (
                <div key={col.key} style={{ flexShrink: 0, width: '200px' }}>
                  <div style={{ padding: '8px 12px', borderRadius: '10px 10px 0 0', background: col.bg, border: `1px solid ${col.color}22`, borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: col.color, background: `${col.color}22`, padding: '1px 7px', borderRadius: '20px' }}>{colApps.length}</span>
                  </div>
                  <div style={{ background: '#f0efe9', border: `1px solid ${col.color}22`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '8px', minHeight: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {colApps.length === 0 ? (
                      <div style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', padding: '16px 0' }}>None</div>
                    ) : colApps.map(app => (
                      <div key={app.id}
                        onClick={() => setSelected(app)}
                        style={{ background: '#fff', border: '1px solid #e2dfd6', borderRadius: '8px', padding: '10px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                        onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px', lineHeight: 1.4 }}>
                          {app.jobs?.title}
                        </div>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>
                          {app.jobs?.companies?.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#bbb' }}>
                          {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        {app.is_auto_applied && (
                          <div style={{ fontSize: '9px', color: BRAND.accentColor, fontWeight: '700', marginTop: '4px' }}>🤖 AUTO</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {apps.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#888', border: '1px solid #e2dfd6' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>No applications yet</div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>Start applying to jobs to track them here</div>
                <a href="/jobs" style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                  Find Jobs →
                </a>
              </div>
            ) : apps.map(app => {
              const col = STATUS_COLS.find(c => c.key === app.status) || STATUS_COLS[0]
              return (
                <div key={app.id}
                  onClick={() => setSelected(app)}
                  style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', marginBottom: '8px', border: '1px solid #e2dfd6', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
                  onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#666', flexShrink: 0 }}>
                    {app.jobs?.companies?.name?.slice(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.jobs?.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {app.jobs?.companies?.name} · Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: col.bg, color: col.color, fontWeight: '600', flexShrink: 0 }}>
                    {col.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Application detail side panel */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ width: '380px', background: '#fff', height: '100%', overflow: 'auto', padding: '24px', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>Application Detail</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ background: '#f5f4f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{selected.jobs?.title}</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{selected.jobs?.companies?.name}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fff', color: '#666', border: '1px solid #e2dfd6' }}>
                  {selected.jobs?.work_mode}
                </span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#059669', border: '1px solid #d1fae5', fontWeight: '600' }}>
                  ₹{Math.round((selected.jobs?.min_salary || 0) / 100000)}–{Math.round((selected.jobs?.max_salary || 0) / 100000)} LPA
                </span>
              </div>
            </div>

            {/* Status steps */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Application Progress</div>
              {STATUS_COLS.filter(c => c.key !== 'rejected').map((col, i) => {
                const statusOrder = STATUS_COLS.map(c => c.key)
                const currentIdx = statusOrder.indexOf(selected.status)
                const colIdx = statusOrder.indexOf(col.key)
                const isDone = colIdx <= currentIdx && selected.status !== 'rejected'
                const isActive = col.key === selected.status
                return (
                  <div key={col.key} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isDone ? col.color : '#f5f4f0', border: `2px solid ${isDone ? col.color : '#e2dfd6'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: isDone ? '#fff' : '#bbb', flexShrink: 0 }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: isActive ? '700' : '400', color: isActive ? col.color : isDone ? '#333' : '#bbb' }}>
                      {col.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {selected.cover_letter && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Cover Letter</div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.7, background: '#f5f4f0', padding: '10px 12px', borderRadius: '8px' }}>
                  {selected.cover_letter}
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#bbb', marginBottom: '16px' }}>
              Applied on {new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {selected.status === 'applied' && (
              <button onClick={() => handleWithdraw(selected.id)}
                style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Withdraw Application
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
