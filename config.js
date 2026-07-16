// lib/config.js
// ─────────────────────────────────────────────────────────────
// YOUR BRAND CONFIGURATION
// Edit this file to change your brand name, colors, prices
// everywhere on the site at once.
// ─────────────────────────────────────────────────────────────

export const BRAND = {
  // ── Identity ──────────────────────────────────────────────
  name:        "CareerFlow AI",          // ← YOUR BRAND NAME
  shortName:   "CareerFlow",             // ← Short version
  tagline:     "India's AI-powered career platform",
  description: "AI resume builder, job matching, auto-apply and career coaching",

  // ── Colors ────────────────────────────────────────────────
  accentColor: "#059669",   // Main green  → try #2563eb (blue) or #7c3aed (purple)
  darkColor:   "#0f172a",   // Dark nav/header
  lightBg:     "#f5f4f0",   // Page background

  // ── Contact ───────────────────────────────────────────────
  email:       "hello@yoursite.com",     // ← YOUR EMAIL
  phone:       "+91 98765 43210",        // ← YOUR PHONE (optional)
  domain:      "careerflow-ai.vercel.app", // ← YOUR DOMAIN

  // ── Social ────────────────────────────────────────────────
  instagram:   "https://instagram.com/yourhandle",
  linkedin:    "https://linkedin.com/company/yourcompany",
  twitter:     "https://twitter.com/yourhandle",

  // ── Razorpay business name ────────────────────────────────
  razorpayName: "CareerFlow AI",         // Shown in payment popup
}

// ── Plan Prices (₹) ───────────────────────────────────────────
export const PLANS = {
  premium: {
    name:     "Premium",
    price:    249,           // ← Change price here
    features: [
      "Unlimited job applications",
      "AI Resume Builder",
      "ATS Score & Optimization",
      "Auto Apply — 10 jobs/day",
      "Job match alerts",
    ],
  },
  premium_plus: {
    name:     "Premium Plus",
    price:    499,           // ← Change price here
    features: [
      "Everything in Premium",
      "Unlimited Auto Apply",
      "AI Career Coach",
      "Interview Preparation AI",
      "Priority Support 24/7",
    ],
  },
  enterprise: {
    name:     "Enterprise",
    price:    null,          // Custom pricing
    features: [
      "Everything in Plus",
      "Recruiter Suite (10 seats)",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
}

// ── Free Plan Limits ──────────────────────────────────────────
export const FREE_LIMITS = {
  applications_per_month: 20,
  resume_analyses:         5,
  saved_jobs:             10,
}
