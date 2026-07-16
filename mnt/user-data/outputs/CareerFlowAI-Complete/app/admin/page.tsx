'use client'
// app/admin/page.tsx
// ─────────────────────────────────────────────────────────────
// Admin Dashboard — only accessible by you (role = 'admin')
// Middleware already blocks everyone else
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { BRAND } from '@/lib/config'

type Stats = {
  totalUsers: number
  newThisMonth: number
  activeJobs: number
  totalApps: number
  monthlyRevenue: number
  planBreakdown: Record<string, number>
}

type User = {
  id: string
  email: string
  full_name: string
  role: string
  subscription: string
  is_banned: boolean
  created_at: string
}

export default function AdminPage() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [users, setUsers]       = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'overview' | 'users' | 'jobs' | 'settings'>('overview')
  const [search, setSearch]     = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Settings state
  const [freeLimitVal, setFreeLimitVal] = useState('20')
  const [featuredPrice, setFeaturedPrice] = useState('999')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { window.location.href = '/login'; return }

      // Load stats
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (data.error) { window.location.href = '/dashboard'; return }
        setStats(data)
      } catch (e) { console.error(e) }

      // Load users
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role, subscription, is_banned, created_at')
          .order('created_at', { ascending: false })
          .limit(100)
        setUsers(usersData || [])
      } catch (e) { console.error(e) }

      setLoading(false)
    }
    load()
  }, [])

  async function banUser(userId: string, ban: boolean) {
    setActionLoading(userId)
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      await supabaseAdmin
        .from('users')
        .update({ is_banned: ban, is_active: !ban })
        .eq('id', userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: ban } : u))
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(null) }
  }

  async function changePlan(userId: string, plan: string) {
    setActionLoading(userId)
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      await supabaseAdmin.from('users').update({ subscription: plan }).eq('id', userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription: plan } : u))
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(null) }
  }

  async function saveSettings() {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      await Promise.all([
        supabaseAdmin.from('platform_settings').upsert({ key: 'free_plan_apply_limit', value: freeLimitVal }),
        supabaseAdmin.from('platform_settings').upsert({ key: 'featured_job_price_inr', value: featuredPrice }),
        supabaseAdmin.from('platform_settings').upsert({ key: 'maintenance_mode', value: String(maintenanceMode) }),
      ])
      alert('✅ Settings saved!')
    } catch (e: any) { alert('Error: ' + e.message) }
  }

  const filteredUsers = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  // Colour helpers
  const planColor = (p: string) => ({
    free: '#888', premium: '#059669', premium_plus: '#2563eb', enterprise: '#d97706',
  }[p] || '#888')

  const inp = { padding: '9px 12px', border: '1.5px solid #2a3045', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#181c25', color: '#e8eaf0', width: '100%' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8eaf0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚙️</div>
        <div>Loading admin panel...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', color: '#e8eaf0', fontFamily: 'inherit' }}>

      {/* Nav */}
      <nav style={{ background: '#111318', borderBottom: '1px solid #1f2535', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 20 }}>
        <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: '#00e5a0' }}>Flow</span> AI
          <span style={{ fontSize: '11px', fontWeight: '400', color: '#00e5a0', marginLeft: '8px', background: 'rgba(0,229,160,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Admin</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {(['overview', 'users', 'jobs', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>
        <a href="/" style={{ marginLeft: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Back to site</a>
      </nav>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.4px' }}>Dashboard Overview</h1>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Total Users',    val: stats.totalUsers,       color: '#00e5a0', sub: `+${stats.newThisMonth} this month` },
                { label: 'Active Jobs',    val: stats.activeJobs,       color: '#4d9fff', sub: 'currently open' },
                { label: 'Applications',   val: stats.totalApps,        color: '#ffb347', sub: 'all time' },
                { label: 'Revenue (₹)',    val: `₹${stats.monthlyRevenue.toLocaleString()}`, color: '#ff4d6d', sub: 'this month' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '10px', color: '#8b90a4', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{s.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: '#565c72', marginTop: '6px' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Plan breakdown */}
            <div style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>Subscription Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                  <div key={plan} style={{ padding: '12px', background: '#181c25', borderRadius: '10px', border: '1px solid #2a3045' }}>
                    <div style={{ fontSize: '10px', color: '#8b90a4', textTransform: 'uppercase', marginBottom: '4px' }}>{plan.replace('_', ' ')}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: planColor(plan) }}>{count}</div>
                    <div style={{ fontSize: '10px', color: '#565c72', marginTop: '2px' }}>
                      {stats.totalUsers > 0 ? Math.round(count / stats.totalUsers * 100) : 0}% of users
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>Quick Actions</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: '👥 Manage Users', action: () => setTab('users') },
                  { label: '⚙️ Settings', action: () => setTab('settings') },
                  { label: '🔗 View Live Site', action: () => window.open('/', '_blank') },
                  { label: '📊 Supabase DB', action: () => window.open('https://supabase.com/dashboard', '_blank') },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action}
                    style={{ padding: '10px 18px', background: '#1f2535', color: '#e8eaf0', border: '1px solid #2a3045', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Users ({users.length})</h1>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{ ...inp, width: '280px' }}
              />
            </div>

            <div style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#181c25' }}>
                    {['User', 'Role', 'Plan', 'Joined', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#8b90a4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #1f2535' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1f2535' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '500', color: '#e8eaf0' }}>{u.full_name || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#8b90a4' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', background: u.role === 'admin' ? 'rgba(255,77,109,0.1)' : 'rgba(139,144,164,0.1)', color: u.role === 'admin' ? '#ff4d6d' : '#8b90a4' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select
                          value={u.subscription}
                          onChange={e => changePlan(u.id, e.target.value)}
                          disabled={actionLoading === u.id}
                          style={{ background: '#181c25', border: '1px solid #2a3045', borderRadius: '6px', color: planColor(u.subscription), fontSize: '11px', padding: '3px 6px', cursor: 'pointer' }}
                        >
                          {['free', 'premium', 'premium_plus', 'enterprise'].map(p => (
                            <option key={p} value={p}>{p.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#565c72', fontSize: '11px' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: u.is_banned ? 'rgba(255,77,109,0.1)' : 'rgba(0,229,160,0.1)', color: u.is_banned ? '#ff4d6d' : '#00e5a0', fontWeight: '600' }}>
                          {u.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => banUser(u.id, !u.is_banned)}
                            disabled={actionLoading === u.id}
                            style={{ padding: '4px 10px', fontSize: '11px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', background: u.is_banned ? 'rgba(0,229,160,0.1)' : 'rgba(255,77,109,0.1)', color: u.is_banned ? '#00e5a0' : '#ff4d6d' }}>
                            {actionLoading === u.id ? '...' : u.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <>
            <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Platform Settings</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>Plan Limits</div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#8b90a4', marginBottom: '5px' }}>FREE PLAN — Max applications/month</div>
                  <input value={freeLimitVal} onChange={e => setFreeLimitVal(e.target.value)} type="number" style={inp} />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#8b90a4', marginBottom: '5px' }}>FEATURED JOB PRICE (₹)</div>
                  <input value={featuredPrice} onChange={e => setFeaturedPrice(e.target.value)} type="number" style={inp} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#181c25', borderRadius: '10px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Maintenance Mode</div>
                    <div style={{ fontSize: '11px', color: '#8b90a4' }}>Show maintenance page to all users</div>
                  </div>
                  <button onClick={() => setMaintenanceMode(m => !m)}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: maintenanceMode ? '#ff4d6d' : '#2a3045', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', top: '3px', left: maintenanceMode ? '21px' : '3px', transition: 'left 0.2s' }} />
                  </button>
                </div>

                <button onClick={saveSettings}
                  style={{ width: '100%', padding: '10px', background: '#00e5a0', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                  Save Settings
                </button>
              </div>

              <div style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>Platform Info</div>
                {[
                  { label: 'Site URL', val: BRAND.domain },
                  { label: 'Brand Name', val: BRAND.name },
                  { label: 'Support Email', val: BRAND.email },
                  { label: 'Accent Color', val: BRAND.accentColor },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: '12px', padding: '10px', background: '#181c25', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#8b90a4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{row.label}</div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#e8eaf0' }}>{row.val}</div>
                  </div>
                ))}
                <div style={{ fontSize: '11px', color: '#565c72', marginTop: '8px' }}>
                  To change brand name/colors → edit <code style={{ fontFamily: 'monospace', background: '#181c25', padding: '1px 5px', borderRadius: '3px' }}>lib/config.js</code> → push to GitHub
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── JOBS (placeholder) ── */}
        {tab === 'jobs' && (
          <div style={{ background: '#111318', border: '1px solid #1f2535', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#8b90a4' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💼</div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px', color: '#e8eaf0' }}>Job Management</div>
            <div style={{ fontSize: '13px', marginBottom: '16px' }}>View and moderate all job postings directly in Supabase</div>
            <button onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              style={{ padding: '10px 20px', background: '#1f2535', color: '#e8eaf0', border: '1px solid #2a3045', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
              Open Supabase Table Editor →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
