'use client'
import { useState } from 'react'
import { signUpWithEmail, signInWithGoogle, signInWithGitHub } from '@/lib/auth'
import { BRAND } from '@/lib/config'

export default function SignupPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', marginBottom: '10px',
    border: '1.5px solid #e2dfd6', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#fafaf8',
  }

  async function handleSignup() {
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await signUpWithEmail(email, password, name)
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Signup failed. Try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.darkColor }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
        <h2 style={{ fontWeight: '800', marginBottom: '8px' }}>Check your email!</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          We sent a verification link to <strong>{email}</strong>.<br />
          Click it to activate your account.
        </p>
        <a href="/login" style={{ padding: '11px 28px', background: BRAND.darkColor, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'inline-block' }}>
          Go to Login →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.darkColor, padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', width: '420px', maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            Join <span style={{ color: BRAND.accentColor }}>{BRAND.name}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>{BRAND.tagline}</div>
        </div>

        <button onClick={() => signInWithGoogle()} style={{ width: '100%', padding: '11px', marginBottom: '8px', border: '1.5px solid #e2dfd6', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
          🔵 Continue with Google
        </button>
        <button onClick={() => signInWithGitHub()} style={{ width: '100%', padding: '11px', marginBottom: '20px', background: '#24292e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
          ⚫ Continue with GitHub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
          <span style={{ fontSize: '12px', color: '#bbb' }}>or sign up with email</span>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *" style={inp} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address *" type="email" style={inp} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password (min 8 chars) *" type="password" style={inp} onKeyDown={e => e.key === 'Enter' && handleSignup()} />

        <button onClick={handleSignup} disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : BRAND.darkColor, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Creating account...' : 'Create Free Account →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#aaa' }}>
          By signing up, you agree to our Terms of Service
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: '#888' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: BRAND.darkColor, fontWeight: '600', textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
