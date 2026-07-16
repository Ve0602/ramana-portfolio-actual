'use client'
// app/pricing/page.tsx
// ─────────────────────────────────────────────────────────────
// Pricing page — shows all plans with Razorpay checkout
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { BRAND, PLANS } from '@/lib/config'

const FEATURES_COMPARE = [
  { feature: 'Job Applications / month', free: '20', premium: 'Unlimited', plus: 'Unlimited' },
  { feature: 'Job Search & Filters',     free: 'Basic', premium: 'Advanced', plus: 'Advanced' },
  { feature: 'AI Resume Builder',        free: false, premium: true, plus: true },
  { feature: 'ATS Score & Optimization', free: false, premium: true, plus: true },
  { feature: 'Auto Apply / day',         free: false, premium: '10 jobs', plus: 'Unlimited' },
  { feature: 'AI Career Coach Chat',     free: false, premium: false, plus: true },
  { feature: 'Interview Prep AI',        free: false, premium: false, plus: true },
  { feature: 'Cover Letter Generator',   free: false, premium: true, plus: true },
  { feature: 'Priority Support',         free: false, premium: false, plus: true },
  { feature: 'Resume Versions',          free: '1', premium: '5', plus: 'Unlimited' },
]

export default function PricingPage() {
  const [billing, setBilling]   = useState<'monthly' | 'annual'>('monthly')
  const [coupon, setCoupon]     = useState('')
  const [couponOk, setCouponOk] = useState(false)
  const [loading, setLoading]   = useState<string | null>(null)

  const discount = billing === 'annual' ? 0.7 : 1
  const premiumPrice = Math.round(PLANS.premium.price * discount)
  const plusPrice    = Math.round(PLANS.premium_plus.price * discount)

  function applyCoupon() {
    if (coupon.toUpperCase() === 'CAREERFLOW50') {
      setCouponOk(true)
      alert('✅ Coupon applied! 50% off your first month.')
    } else {
      setCouponOk(false)
      alert('❌ Invalid coupon code. Try CAREERFLOW50')
    }
  }

  async function handleCheckout(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing, coupon: couponOk ? coupon : '' }),
      })
      const data = await res.json()

      if (data.error) { alert(data.error); return }
      if (!data.keyId || data.keyId.includes('xxx')) {
        alert('Payment gateway not configured yet.\n\nAdd your Razorpay keys to .env.local to enable payments.')
        return
      }

      // Load Razorpay checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: 'INR',
          name: BRAND.name,
          description: `${planId} Plan - ${billing}`,
          order_id: data.orderId,
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              alert('🎉 Payment successful! Welcome to ' + planId)
              window.location.href = '/dashboard'
            } else {
              alert('Payment verification failed. Contact support.')
            }
          },
          prefill: { name: '', email: '' },
          theme: { color: BRAND.darkColor },
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  const cardStyle = (featured: boolean) => ({
    background: featured ? '#0f172a' : '#fff',
    border: `2px solid ${featured ? '#0f172a' : '#e2dfd6'}`,
    borderRadius: '20px',
    padding: '28px',
    flex: 1,
    minWidth: '220px',
    position: 'relative' as const,
    transform: featured ? 'scale(1.03)' : 'scale(1)',
    boxShadow: featured ? '0 20px 60px rgba(15,23,42,0.2)' : '0 4px 16px rgba(0,0,0,0.04)',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2dfd6' }}>
        <a href="/" style={{ fontSize: '16px', fontWeight: '800', textDecoration: 'none', color: '#0f172a', letterSpacing: '-0.4px' }}>
          Career<span style={{ color: BRAND.accentColor }}>Flow</span> AI
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/jobs" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Jobs</a>
          <a href="/login" style={{ padding: '7px 16px', background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>Sign in</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: '#0f172a', padding: '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: BRAND.accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Pricing
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '12px', lineHeight: 1.2 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '28px' }}>
          Start free. Upgrade when you need AI features.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px', border: '1px solid rgba(255,255,255,0.12)' }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              style={{ padding: '7px 20px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: billing === b ? '#fff' : 'transparent', color: billing === b ? '#0f172a' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && <span style={{ marginLeft: '6px', fontSize: '10px', background: BRAND.accentColor, color: '#fff', padding: '1px 6px', borderRadius: '20px' }}>Save 30%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: '960px', margin: '-40px auto 40px', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Free */}
          <div style={cardStyle(false)}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🆓</div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Get started with basic job search</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>₹0</span>
              <span style={{ fontSize: '13px', color: '#888' }}>/forever</span>
            </div>
            <a href="/signup" style={{ display: 'block', width: '100%', padding: '11px', textAlign: 'center', background: '#f5f4f0', color: '#333', border: '1.5px solid #e2dfd6', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', marginBottom: '20px' }}>
              Get Started Free
            </a>
            {['20 applications/month', 'Basic job search', 'Resume upload', 'Application tracking'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#555' }}>
                <span style={{ color: BRAND.accentColor, fontWeight: '700' }}>✓</span> {f}
              </div>
            ))}
          </div>

          {/* Premium */}
          <div style={cardStyle(true)}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: BRAND.accentColor, color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              ⭐ MOST POPULAR
            </div>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>Premium</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>AI-powered job applications</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px' }}>₹{couponOk ? Math.round(premiumPrice * 0.5) : premiumPrice}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>/month</span>
            </div>
            {billing === 'annual' && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginBottom: '16px' }}>₹{PLANS.premium.price}/mo</div>}
            <button onClick={() => handleCheckout('premium')} disabled={loading === 'premium'}
              style={{ display: 'block', width: '100%', padding: '11px', background: BRAND.accentColor, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', opacity: loading === 'premium' ? 0.7 : 1 }}>
              {loading === 'premium' ? 'Processing...' : 'Upgrade to Premium →'}
            </button>
            {PLANS.premium.features.map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ color: BRAND.accentColor, fontWeight: '700' }}>✓</span> {f}
              </div>
            ))}
          </div>

          {/* Plus */}
          <div style={cardStyle(false)}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>Premium Plus</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Full AI career automation</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>₹{couponOk ? Math.round(plusPrice * 0.5) : plusPrice}</span>
              <span style={{ fontSize: '13px', color: '#888' }}>/month</span>
            </div>
            {billing === 'annual' && <div style={{ fontSize: '12px', color: '#bbb', textDecoration: 'line-through', marginBottom: '16px' }}>₹{PLANS.premium_plus.price}/mo</div>}
            <button onClick={() => handleCheckout('premium_plus')} disabled={loading === 'premium_plus'}
              style={{ display: 'block', width: '100%', padding: '11px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', opacity: loading === 'premium_plus' ? 0.7 : 1 }}>
              {loading === 'premium_plus' ? 'Processing...' : 'Upgrade to Plus →'}
            </button>
            {PLANS.premium_plus.features.map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#555' }}>
                <span style={{ color: BRAND.accentColor, fontWeight: '700' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Coupon */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', marginTop: '20px', border: '1px solid #e2dfd6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>🎁 Have a coupon?</span>
          <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Enter code (try CAREERFLOW50)"
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: `1.5px solid ${couponOk ? BRAND.accentColor : '#e2dfd6'}`, borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={applyCoupon}
            style={{ padding: '8px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            Apply
          </button>
          {couponOk && <span style={{ fontSize: '12px', color: BRAND.accentColor, fontWeight: '700' }}>✅ 50% OFF applied!</span>}
        </div>

        {/* Compare table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2dfd6', overflow: 'hidden', marginTop: '40px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2dfd6' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>Full Feature Comparison</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f4f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', width: '40%' }}>Feature</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Free</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#0f172a', fontSize: '11px', textTransform: 'uppercase', background: 'rgba(15,23,42,0.04)' }}>Premium</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Plus</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES_COMPARE.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f5f4f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>{row.feature}</td>
                    {(['free', 'premium', 'plus'] as const).map(plan => (
                      <td key={plan} style={{ padding: '12px 16px', textAlign: 'center', background: plan === 'premium' ? 'rgba(15,23,42,0.02)' : 'transparent' }}>
                        {row[plan] === true
                          ? <span style={{ color: BRAND.accentColor, fontWeight: '700', fontSize: '16px' }}>✓</span>
                          : row[plan] === false
                          ? <span style={{ color: '#ddd', fontSize: '14px' }}>—</span>
                          : <span style={{ color: '#555', fontWeight: '500' }}>{row[plan]}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ marginTop: '48px', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '24px', letterSpacing: '-0.5px' }}>
            Frequently Asked Questions
          </h2>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes! Cancel anytime from your dashboard. You keep access until the end of your billing period. No questions asked.' },
            { q: 'Is auto-apply safe?', a: 'Yes. We only apply to jobs using official APIs and user-authorized workflows. We never violate platform terms of service.' },
            { q: 'What payment methods are accepted?', a: 'We accept all UPI apps (GPay, PhonePe, Paytm), debit/credit cards, net banking, and wallets via Razorpay.' },
            { q: 'Will I get a GST invoice?', a: 'Yes! Every payment generates a GST-compliant invoice sent to your email and available for download.' },
            { q: 'What happens after the free plan limit?', a: 'After 20 applications, you\'ll be prompted to upgrade. Your profile and data are always safe.' },
          ].map((faq, i) => (
            <details key={i} style={{ background: '#fff', border: '1px solid #e2dfd6', borderRadius: '12px', padding: '0', marginBottom: '8px', overflow: 'hidden' }}>
              <summary style={{ padding: '16px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.q} <span style={{ fontSize: '18px', color: '#888', fontWeight: '300' }}>+</span>
              </summary>
              <div style={{ padding: '0 20px 16px', fontSize: '13px', color: '#666', lineHeight: 1.7 }}>{faq.a}</div>
            </details>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ background: '#0f172a', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.5px' }}>
            Ready to get hired faster?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Join thousands of students using AI to land their dream jobs</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" style={{ padding: '13px 28px', background: BRAND.accentColor, color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
              Start Free Today →
            </a>
            <a href="/jobs" style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
              Browse Jobs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
