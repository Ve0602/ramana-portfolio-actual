// middleware.ts  ← PUT THIS IN PROJECT ROOT (same level as app/ folder)
// ─────────────────────────────────────────────────────────────
// Protects pages:
//   /dashboard → must be logged in
//   /admin     → must be logged in AND have role = 'admin'
//   /login     → redirect to /dashboard if already logged in
// ─────────────────────────────────────────────────────────────
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Protect /dashboard and child routes ───────────────────
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Protect /recruiter routes ─────────────────────────────
  if (!user && request.nextUrl.pathname.startsWith('/recruiter')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Protect /resume route ─────────────────────────────────
  if (!user && request.nextUrl.pathname.startsWith('/resume')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Protect /admin — must be admin role ───────────────────
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role in database
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      // Not admin → send to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── Already logged in → skip login/signup ────────────────
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/recruiter/:path*',
    '/resume/:path*',
    '/login',
    '/signup',
  ],
}
