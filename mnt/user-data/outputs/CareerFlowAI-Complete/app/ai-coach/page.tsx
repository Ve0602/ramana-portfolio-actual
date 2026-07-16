'use client'
// app/ai-coach/page.tsx
// ─────────────────────────────────────────────────────────────
// AI Career Coach — chat interface powered by Gemini AI
// Helps with resume, interview prep, salary advice, job search
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getStudentProfile } from '@/lib/student'
import { BRAND } from '@/lib/config'

type Message = { role: 'user' | 'ai'; text: string; time: string }

const SUGGESTIONS = [
  'Review my resume and give me a score',
  'What skills am I missing for a React developer role?',
  'How do I negotiate my salary?',
  'Prepare me for a technical interview',
  'What is a good salary for 2 years experience in Bangalore?',
  'Apply to remote React jobs above ₹15 LPA automatically',
]

const AI_NAME = `${BRAND.name} AI Coach`

export default function AICoachPage() {
  const [user, setUser]         = useState<any>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [typing, setTyping]     = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { window.location.href = '/login'; return }
      setUser(u)
      try {
        const p = await getStudentProfile(u.id)
        setProfile(p)
      } catch { /* no profile yet */ }

      // Welcome message
      setMessages([{
        role: 'ai',
        text: `Hi there! 👋 I'm your AI Career Coach from ${BRAND.name}.\n\nI can help you with:\n• 📄 Resume review and ATS optimization\n• 💼 Job matching and application strategy\n• 🎙 Interview preparation\n• 💰 Salary negotiation tips\n• 🔍 Skill gap analysis\n\nWhat would you like to work on today?`,
        time: now(),
      }])
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', text: msg, time: now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    setLoading(true)

    try {
      const context = {
        name: profile?.users?.full_name || user?.email?.split('@')[0],
        atsScore: profile?.ats_score,
        skills: profile?.user_skills?.map((s: any) => s.skills?.name) || [],
        experience: profile?.total_experience_yrs || 0,
        targetRole: profile?.headline,
        applicationCount: 0,
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context }),
      })
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.reply || 'Sorry, I could not get a response. Please try again.',
        time: now(),
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Connection error. Please check your internet and try again.',
        time: now(),
      }])
    } finally {
      setTyping(false)
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Format AI message text (newlines → paragraphs)
  function formatText(text: string) {
    return text.split('\n').map((line, i) => (
      <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>
    ))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ background: '#0f172a', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #1f2535', flexShrink: 0 }}>
        <a href="/" style={{ fontSize: '16px', fontWeight: '800', textDecoration: 'none', color: '#fff', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
        </a>
        <span style={{ marginLeft: '12px', fontSize: '12px', color: BRAND.accentColor, background: `${BRAND.accentColor}22`, padding: '3px 10px', borderRadius: '20px' }}>
          AI Coach
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>Dashboard</a>
          <a href="/resume" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>Resume AI</a>
        </div>
      </nav>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', maxWidth: '760px', width: '100%', margin: '0 auto', paddingBottom: '0' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '16px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
            {msg.role === 'ai' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND.accentColor}, #3b82f6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                AI
              </div>
            )}
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#0f172a' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#333',
                fontSize: '14px',
                lineHeight: 1.7,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: msg.role === 'ai' ? '1px solid #e2dfd6' : 'none',
              }}>
                {formatText(msg.text)}
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginTop: '3px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.time}
              </div>
            </div>
            {msg.role === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                {user?.email?.slice(0, 2).toUpperCase() || 'ME'}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-end' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND.accentColor}, #3b82f6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>AI</div>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid #e2dfd6', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#bbb', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div style={{ padding: '10px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #e2dfd6', background: '#fff', cursor: 'pointer', color: '#555', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f172a'; (e.currentTarget as HTMLButtonElement).style.color = '#0f172a' }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2dfd6'; (e.currentTarget as HTMLButtonElement).style.color = '#555' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ background: '#fff', borderTop: '1px solid #e2dfd6', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your career... (Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #e2dfd6', borderRadius: '14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'none', maxHeight: '120px', lineHeight: 1.6, background: '#f5f4f0' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ width: '44px', height: '44px', borderRadius: '12px', background: (loading || !input.trim()) ? '#f5f4f0' : '#0f172a', border: 'none', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.15s', flexShrink: 0 }}>
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        <div style={{ maxWidth: '760px', margin: '6px auto 0', fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
          Powered by Google Gemini AI · Responses may not always be accurate
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
