// ============================================================
// CareerFlow AI — Supabase Client
// lib/supabase.js
//
// HOW TO USE:
//   1. Go to supabase.com → your project → Settings → API
//   2. Copy "Project URL" and "anon public" key
//   3. Paste them below (or use .env.local in Next.js)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY   // server-side only

// Public client — used in browser / React components
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Admin client — used in API routes only (never expose to browser)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE)
