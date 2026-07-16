'use client'
import { BRAND, PLANS } from '@/lib/config'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* NAV */}
      <nav style={{ padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: '#0f172a' }}>
          {BRAND.shortName}<span style={{ color: BRAND.accentColor }}> AI</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/jobs" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Find Jobs</a>
          <a href="/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>Login</a>
          <a href="/signup" style={{ padding: '8px 18px', background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            Get Started Free →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: '#0f172a', padding: '80px 28px', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: BRAND.accentColor, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(5,150,105,0.1)', display: 'inline-block', padding: '5px 14px', borderRadius: '20px' }}>
            🤖 AI-Powered · Made for India
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '800', color: '#fff', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '20px' }}>
            Get hired faster<br />with AI
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', marginBottom: '36px', lineHeight: 1.7 }}>
            {BRAND.description}. Free to start.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" style={{ padding: '14px 36px', background: BRAND.accentColor, color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '700', textDecoration: 'none' }}>
              Start Free →
            </a>
            <a href="/jobs" style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none' }}>
              Browse Jobs
            </a>
          </div>
          <div style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            ✓ Free forever plan &nbsp;·&nbsp; ✓ No credit card needed &nbsp;·&nbsp; ✓ Indian companies
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background: '#f8f8f8', padding: '20px 28px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', borderBottom: '1px solid #eee' }}>
        {[
          { num: '10,000+', label: 'Students placed' },
          { num: '500+', label: 'Companies hiring' },
          { num: '94%', label: 'Match accuracy' },
          { num: '₹0', label: 'To get started' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{s.num}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div style={{ padding: '72px 28px', maxWidth: '960px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-1px' }}>
          Everything you need to land your dream job
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '48px', fontSize: '16px' }}>
          One platform. AI-powered. Built for Indian students.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🎯', title: 'AI Job Matching', desc: 'AI scores every job against your profile and shows a match percentage so you apply smarter, not harder.' },
            { icon: '📄', title: 'ATS Resume Optimizer', desc: 'Upload your resume → get an ATS score in seconds → AI tells you exactly what to fix to get shortlisted.' },
            { icon: '🤖', title: 'Auto Apply Agent', desc: 'AI applies to 100s of matching jobs automatically while you sleep. Premium feature — set your preferences and relax.' },
            { icon: '💬', title: 'AI Career Coach', desc: 'Chat with AI for resume help, mock interviews, salary negotiation tips, and career roadmaps specific to India.' },
            { icon: '📊', title: 'Application Tracker', desc: 'Track every application from Applied → Shortlisted → Interview → Offer in a clean Kanban board.' },
            { icon: '🏢', title: 'Recruiter Portal', desc: 'Companies post jobs and our AI instantly ranks and matches the best candidates — saving hours of screening.' },
          ].map(f => (
            <div key={f.title} style={{ padding: '24px', border: '1px solid #e8e8e8', borderRadius: '16px', transition: 'box-shadow 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: '#f5f4f0', padding: '64px 28px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '48px', letterSpacing: '-0.8px' }}>
            Get hired in 4 steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
            {[
              { step: '1', title: 'Sign up free', desc: 'Create account with Google in 10 seconds' },
              { step: '2', title: 'Upload resume', desc: 'AI scores it and suggests improvements' },
              { step: '3', title: 'Find matches', desc: 'Browse AI-matched jobs with % score' },
              { step: '4', title: 'Get hired', desc: 'Apply manually or let AI auto-apply' },
            ].map(s => (
              <div key={s.step} style={{ background: '#fff', borderRadius: '16px', padding: '24px 16px', border: '1px solid #e2dfd6' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', margin: '0 auto 14px', fontSize: '15px' }}>{s.step}</div>
                <div style={{ fontWeight: '700', marginBottom: '6px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div style={{ padding: '72px 28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.8px' }}>Simple, transparent pricing</h2>
        <p style={{ color: '#666', marginBottom: '40px' }}>Start free. Upgrade when you need AI power.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: '#f5f4f0', borderRadius: '20px', padding: '28px', flex: '1', minWidth: '200px', border: '1px solid #e2dfd6', textAlign: 'left' }}>
            <div style={{ fontWeight: '700', marginBottom: '4px', color: '#888' }}>Free</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>₹0</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>forever</div>
            {['20 applications/month', 'Basic job search', 'Resume upload', 'Application tracker'].map(f => (
              <div key={f} style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>✓ {f}</div>
            ))}
            <a href="/signup" style={{ display: 'block', marginTop: '20px', padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: '600', color: '#333' }}>Get Started Free</a>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '20px', padding: '28px', flex: '1', minWidth: '200px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: BRAND.accentColor, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>POPULAR</div>
            <div style={{ fontWeight: '700', marginBottom: '4px', color: 'rgba(255,255,255,0.6)' }}>Premium</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px', color: '#fff' }}>₹{PLANS.premium.price}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>per month</div>
            {PLANS.premium.features.map(f => (
              <div key={f} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>✓ {f}</div>
            ))}
            <a href="/signup" style={{ display: 'block', marginTop: '20px', padding: '10px', background: BRAND.accentColor, border: 'none', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: '700', color: '#fff' }}>Upgrade to Premium</a>
          </div>

          <div style={{ background: '#f5f4f0', borderRadius: '20px', padding: '28px', flex: '1', minWidth: '200px', border: '1px solid #e2dfd6', textAlign: 'left' }}>
            <div style={{ fontWeight: '700', marginBottom: '4px', color: '#888' }}>Premium Plus</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>₹{PLANS.premium_plus.price}</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>per month</div>
            {PLANS.premium_plus.features.map(f => (
              <div key={f} style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>✓ {f}</div>
            ))}
            <a href="/signup" style={{ display: 'block', marginTop: '20px', padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: '600', color: '#333' }}>Get Plus</a>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0f172a', padding: '64px 28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '12px' }}>Ready to supercharge your job search?</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '28px', fontSize: '15px' }}>Join thousands of Indian students already using {BRAND.name}</p>
        <a href="/signup" style={{ padding: '15px 40px', background: BRAND.accentColor, color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
          Create Free Account →
        </a>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: '24px 28px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700' }}>{BRAND.name}</div>
        <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/jobs" style={{ color: '#888', textDecoration: 'none' }}>Jobs</a>
          <a href="/signup" style={{ color: '#888', textDecoration: 'none' }}>Sign Up</a>
          <a href="/login" style={{ color: '#888', textDecoration: 'none' }}>Login</a>
          <span>© 2025 {BRAND.name} · Made in India 🇮🇳</span>
        </div>
      </footer>
    </div>
  )
}
