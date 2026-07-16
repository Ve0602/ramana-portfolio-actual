// app/api/ai/chat/route.ts
// ─────────────────────────────────────────────────────────────
// AI Career Coach chat endpoint
// Premium users only — free users get a prompt to upgrade
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

export async function POST(request: NextRequest) {
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

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 })
    }

    // Check subscription (AI coach is premium+ only)
    const { data: profile } = await supabase
      .from('users')
      .select('subscription, full_name')
      .eq('id', user.id)
      .single()

    // Allow free users limited access (3 messages) — remove this if you want premium only
    // if (profile?.subscription === 'free') {
    //   return NextResponse.json({
    //     error: 'AI Career Coach is a Premium feature. Upgrade for ₹249/month.',
    //   }, { status: 403 })
    // }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 })
    }

    const prompt = `
You are an expert AI Career Coach for ${process.env.NEXT_PUBLIC_BRAND_NAME || 'CareerFlow AI'}, 
an Indian job platform helping students and professionals.

STUDENT CONTEXT:
- Name: ${context?.name || profile?.full_name || 'Student'}
- ATS Score: ${context?.atsScore || 'Unknown'}/100
- Skills: ${context?.skills?.join(', ') || 'Not provided'}
- Experience: ${context?.experience || 'Unknown'} years
- Target Role: ${context?.targetRole || 'Not specified'}
- Applications this month: ${context?.applicationCount || 0}

STUDENT MESSAGE: "${message}"

INSTRUCTIONS:
- Be warm, encouraging, and specific
- Focus on Indian job market (LPA salaries, Indian companies)
- Give actionable advice they can do TODAY
- Mention specific companies, platforms, salary ranges when relevant
- Keep response under 200 words
- Use emojis sparingly for readability
- If asked about auto-apply, mention it's a Premium feature
`

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
      }),
    })

    if (!geminiRes.ok) throw new Error('Gemini API failed')

    const data = await geminiRes.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not get response. Please try again.'

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({
      reply: 'I\'m having trouble connecting right now. Please try again in a moment.',
    })
  }
}
