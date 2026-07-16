// app/api/admin/stats/route.ts
// ─────────────────────────────────────────────────────────────
// Secure API endpoint — only admin role can access this
// Returns platform stats for the admin dashboard
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    // Check if admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get stats from database
    const [usersRes, jobsRes, appsRes, revenueRes] = await Promise.all([
      supabase.from('users').select('id, subscription, created_at', { count: 'exact' }),
      supabase.from('jobs').select('id, status', { count: 'exact' }).eq('status', 'active'),
      supabase.from('applications').select('id, created_at', { count: 'exact' }),
      supabase.from('subscriptions').select('amount').eq('status', 'success'),
    ])

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalUsers   = usersRes.count || 0
    const activeJobs   = jobsRes.count  || 0
    const totalApps    = appsRes.count  || 0

    const newThisMonth = (usersRes.data || [])
      .filter(u => new Date(u.created_at) >= monthStart).length

    const monthlyRevenue = (revenueRes.data || [])
      .reduce((sum, r) => sum + Number(r.amount), 0)

    const planBreakdown = {
      free:         (usersRes.data || []).filter(u => u.subscription === 'free').length,
      premium:      (usersRes.data || []).filter(u => u.subscription === 'premium').length,
      premium_plus: (usersRes.data || []).filter(u => u.subscription === 'premium_plus').length,
      enterprise:   (usersRes.data || []).filter(u => u.subscription === 'enterprise').length,
    }

    return NextResponse.json({
      totalUsers,
      newThisMonth,
      activeJobs,
      totalApps,
      monthlyRevenue,
      planBreakdown,
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
