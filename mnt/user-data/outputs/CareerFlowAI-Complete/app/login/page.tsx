'use client'
import { useState } from 'react'
import { signInWithGoogle, signInWithGitHub, signInWithEmail, sendEmailOTP, verifyEmailOTP } from '@/lib/auth'
import { BRAND } from '@/lib/config'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp]           = useState('')
  const [mode, setMode]         = useState<'password'|'otp'>('password')
  const [otpSent, setOtpSent]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 13px', marginBottom: '10px',
    border: '1.5px solid #e2dfd6', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#fafaf8',
  }
  const btnDark: React.CSSProperties = {
    width: '100%', padding: '12px', background: BRAND.darkColor, color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'inherit',
  }

  async function handleLogin() {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    try {
      await signInWithEmail(email, password)
      window.location.href = '/dashboard'
    } catch (e: any) {
      setError(e.message || 'Login failed. Check your email and password.')
    } finally { setLoading(false) }
  }

  async function handleSendOTP() {
    if (!email) { setError('Please enter your email first'); return }
    setLoading(true); setError('')
    try {
      await sendEmailOTP(email)
      setOtpSent(true)
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setLoading(true); setError('')
    try {
      await verifyEmailOTP(email, otp)
      window.location.href = '/dashboard'
    } catch (e: any) {
      setError('Wrong OTP. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.darkColor, padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', width: '420px', maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            Welcome back to <span style={{ color: BRAND.accentColor }}>{BRAND.shortName}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>{BRAND.tagline}</div>
        </div>

        {/* Social login */}
        <button onClick={() => signInWithGoogle()} style={{ width: '100%', padding: '11px', marginBottom: '8px', border: '1.5px solid #e2dfd6', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
          <span>🔵</span> Continue with Google
        </button>
        <button onClick={() => signInWithGitHub()} style={{ width: '100%', padding: '11px', marginBottom: '20px', background: '#24292e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
          <span>⚫</span> Continue with GitHub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
          <span style={{ fontSize: '12px', color: '#bbb' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#f5f4f0', borderRadius: '10px', padding: '3px', marginBottom: '16px' }}>
          {(['password', 'otp'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setOtpSent(false) }} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: mode === m ? '#fff' : 'transparent', color: mode === m ? BRAND.darkColor : '#888', fontFamily: 'inherit', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {m === 'password' ? '🔑 Password' : '📱 OTP'}
            </button>
          ))}
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inputStyle} onFocus={e => e.target.style.borderColor = BRAND.darkColor} onBlur={e => e.target.style.borderColor = '#e2dfd6'} />

        {mode === 'password' ? (
          <>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleLogin()} onFocus={e => e.target.style.borderColor = BRAND.darkColor} onBlur={e => e.target.style.borderColor = '#e2dfd6'} />
            <button onClick={handleLogin} disabled={loading} style={{ ...btnDark, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </>
        ) : (
          <>
            {!otpSent ? (
              <button onClick={handleSendOTP} disabled={loading} style={{ ...btnDark, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
              </button>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: '#059669', marginBottom: '8px' }}>✅ OTP sent to {email}</div>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} />
                <button onClick={handleVerifyOTP} disabled={loading} style={{ ...btnDark, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Verifying...' : 'Verify OTP →'}
                </button>
              </>
            )}
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#888' }}>
          No account?{' '}
          <a href="/signup" style={{ color: BRAND.darkColor, fontWeight: '600', textDecoration: 'none' }}>Sign up free</a>
        </p>
      </div>
    </div>
  )
}
