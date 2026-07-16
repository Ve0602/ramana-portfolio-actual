// app/auth/callback/route.ts
// ─────────────────────────────────────────────────────────────
// This handles the redirect after Google/GitHub login.
// User clicks "Continue with Google" → Google → lands here
// → we exchange the code for a session → redirect to dashboard
// ─────────────────────────────────────────────────────────────
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { cookieStore.set(name, value, options) },
          remove(name, options) { cookieStore.delete({ name, ...options }) },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // ✅ Login success → go to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ❌ Login failed → go back to login with error message
  return NextResponse.redirect(
    `${origin}/login?error=Could+not+sign+in.+Please+try+again.`
  )
}
