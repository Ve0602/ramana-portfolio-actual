'use client'
// app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────
// Student Dashboard — main hub after login
// Shows stats, recent applications, matched jobs, quick links
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { getMyApplications, getApplicationStats, getSavedJobs } from '@/lib/student'
import { getMatchedJobs } from '@/lib/jobs'
import { BRAND } from '@/lib/config'

const NAV_LINKS = [
  { href: '/jobs',         label: 'Find Jobs',      icon: '🔍' },
  { href: '/applications', label: 'Applications',   icon: '📊' },
  { href: '/resume',       label: 'Resume AI',      icon: '📄' },
  { href: '/ai-coach',     label: 'AI Coach',       icon: '🤖' },
  { href: '/profile',      label: 'Profile',        icon: '👤' },
  { href: '/pricing',      label: 'Upgrade',        icon: '⚡' },
]

const STATUS_COLOR: Record<string, string> = {
  applied:     '#64748b',
  viewed:      '#2563eb',
  shortlisted: '#059669',
  interview:   '#7c3aed',
  assessment:  '#d97706',
  selected:    '#059669',
  rejected:    '#dc2626',
}

export default function DashboardPage() {
  const [user, setUser]         = useState<any>(null)
  const [stats, setStats]       = useState<any>(null)
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [matchedJobs, setMatchedJobs] = useState<any[]>([])
  const [savedJobs, setSavedJobs]  = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [greeting, setGreeting] = useState('Good day')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')

    async function load() {
      const u = await getCurrentUser()
      if (!u) { window.location.href = '/login'; return }
      setUser(u)

      // Load all data in parallel
      try {
        const [appsData, statsData, matchData, savedData] = await Promise.all([
          getMyApplications(u.id).catch(() => []),
          getApplicationStats(u.id).catch(() => null),
          getMatchedJobs(u.id, 5).catch(() => []),
          getSavedJobs(u.id).catch(() => []),
        ])
        setRecentApps((appsData || []).slice(0, 5))
        setStats(statsData)
        setMatchedJobs(matchData || [])
        setSavedJobs((savedData || []).slice(0, 3))
      } catch (e) {
        console.error('Dashboard load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  const userName = user?.user_metadata?.full_name ||
                   user?.email?.split('@')[0] || 'there'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
        <div style={{ fontSize: '14px' }}>Loading your dashboard...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: '220px', background: '#0f172a', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <a href="/" style={{ fontSize: '16px', fontWeight: '800', color: '#fff', textDecoration: 'none', letterSpacing: '-0.4px' }}>
            Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
          </a>
        </div>

        {/* User chip */}
        <div style={{ margin: '12px 10px', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: BRAND.accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', marginBottom: '7px' }}>
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
            {user?.subscription === 'free' ? 'Free Plan' : user?.subscription}
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 8px 4px' }}>Main</div>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', background: 'rgba(255,255,255,0.1)', color: '#fff', marginBottom: '2px' }}>
            <span>⬡</span> Dashboard
          </a>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px', transition: 'all 0.15s' }}
              onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
              onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)' }}>
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleSignOut}
            style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', textAlign: 'left', fontFamily: 'inherit' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '28px', maxWidth: '900px' }}>

          {/* Welcome banner */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', padding: '28px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-40px', fontSize: '140px', opacity: 0.04, lineHeight: 1 }}>🚀</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.4px', marginBottom: '6px' }}>
              {greeting}, {userName}! 👋
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
              {stats?.total > 0
                ? `You have ${stats.total} application${stats.total > 1 ? 's' : ''} active. Keep going!`
                : 'Ready to find your dream job? Start by browsing jobs below.'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href="/jobs" style={{ padding: '9px 20px', background: BRAND.accentColor, color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                🔍 Find Jobs
              </a>
              <a href="/resume" style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                📄 Analyze Resume
              </a>
              <a href="/ai-coach" style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                🤖 AI Coach
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Applied',     val: stats?.applied     || 0, color: '#2563eb',  icon: '📤' },
              { label: 'Shortlisted', val: stats?.shortlisted || 0, color: '#059669',  icon: '⭐' },
              { label: 'Interviews',  val: stats?.interview   || 0, color: '#7c3aed',  icon: '🎙' },
              { label: 'Offers',      val: stats?.selected    || 0, color: '#d97706',  icon: '🎉' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', border: '1px solid #e2dfd6' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Two column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* Recent Applications */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2dfd6', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f4f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>Recent Applications</div>
                <a href="/applications" style={{ fontSize: '12px', color: BRAND.accentColor, textDecoration: 'none', fontWeight: '600' }}>View all →</a>
              </div>
              {recentApps.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                  No applications yet<br />
                  <a href="/jobs" style={{ color: BRAND.accentColor, fontWeight: '600', textDecoration: 'none' }}>Browse jobs →</a>
                </div>
              ) : recentApps.map(app => (
                <div key={app.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#666', flexShrink: 0 }}>
                    {app.jobs?.companies?.name?.slice(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobs?.title}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{app.jobs?.companies?.name}</div>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontWeight: '600', background: `${STATUS_COLOR[app.status]}18`, color: STATUS_COLOR[app.status], flexShrink: 0 }}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Top Job Matches */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2dfd6', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f4f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>Top Matches For You</div>
                <a href="/jobs" style={{ fontSize: '12px', color: BRAND.accentColor, textDecoration: 'none', fontWeight: '600' }}>See all →</a>
              </div>
              {matchedJobs.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                  Add skills to your profile<br />to see job matches
                </div>
              ) : matchedJobs.map((job: any) => (
                <div key={job.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f9f9f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{job.companies?.name} · {job.city || 'India'}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#059669', flexShrink: 0, marginLeft: '8px' }}>
                      {job.match_score}%
                    </span>
                  </div>
                  <a href="/jobs" style={{ fontSize: '11px', color: BRAND.accentColor, textDecoration: 'none', fontWeight: '600' }}>Apply →</a>
                </div>
              ))}
            </div>
          </div>

          {/* Quick action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { href: '/resume',   icon: '📄', title: 'AI Resume Scorer', desc: 'Upload resume and get ATS score instantly', color: '#f0fdf4', iconColor: '#059669' },
              { href: '/ai-coach', icon: '🤖', title: 'Career Coach AI',  desc: 'Get advice, interview tips and salary info', color: '#f5f3ff', iconColor: '#7c3aed' },
              { href: '/pricing',  icon: '⚡', title: 'Upgrade to Premium', desc: 'Auto-apply to 100s of jobs automatically', color: '#fffbeb', iconColor: '#d97706' },
            ].map(card => (
              <a key={card.href} href={card.href} style={{ background: card.color, borderRadius: '14px', padding: '18px', textDecoration: 'none', border: '1px solid #e2dfd6', display: 'block', transition: 'transform 0.15s' }}
                onMouseOver={e => (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'}
                onMouseOut={e => (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{card.title}</div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{card.desc}</div>
              </a>
            ))}
          </div>

          {/* Saved Jobs */}
          {savedJobs.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2dfd6', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f4f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>🔖 Saved Jobs</div>
                <a href="/jobs" style={{ fontSize: '12px', color: BRAND.accentColor, textDecoration: 'none', fontWeight: '600' }}>Browse more →</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
                {savedJobs.map((saved: any) => (
                  <div key={saved.id} style={{ padding: '14px 18px', borderRight: '1px solid #f5f4f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {saved.jobs?.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                      {saved.jobs?.companies?.name}
                    </div>
                    <a href="/jobs" style={{ fontSize: '11px', color: BRAND.accentColor, textDecoration: 'none', fontWeight: '600' }}>Apply →</a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
