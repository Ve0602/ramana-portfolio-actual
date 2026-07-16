# ============================================================
# CareerFlow AI — START HERE
# ============================================================
# Read this file first. Follow every step in order.
# Total time: ~45 minutes. Total cost: ₹0
# ============================================================

## WHAT YOU'RE BUILDING
A full AI-powered job platform:
- Student login, job search, applications tracker
- AI resume ATS scorer powered by Gemini
- AI career coach chat
- Recruiter portal with job posting
- Admin panel (you control everything)
- Payments via Razorpay (add later)

---

## FOLDER STRUCTURE (what's inside)

CareerFlowAI-Complete/
├── START_HERE.md          ← you are here
├── .env.local.example     ← copy this → .env.local → fill keys
├── middleware.ts          ← copy to project root
├── package.json           ← reference for dependencies
│
├── app/                   ← ALL page files (copy into Next.js)
│   ├── page.tsx           → yoursite.com (landing page)
│   ├── layout.tsx         → root layout
│   ├── login/page.tsx     → /login
│   ├── signup/page.tsx    → /signup
│   ├── dashboard/page.tsx → /dashboard
│   ├── jobs/page.tsx      → /jobs
│   ├── applications/page.tsx → /applications
│   ├── resume/page.tsx    → /resume
│   ├── ai-coach/page.tsx  → /ai-coach
│   ├── profile/page.tsx   → /profile
│   ├── recruiter/page.tsx → /recruiter
│   ├── admin/page.tsx     → /admin (you only)
│   ├── pricing/page.tsx   → /pricing
│   ├── auth/callback/route.ts     → OAuth redirect
│   └── api/
│       ├── admin/stats/route.ts
│       ├── ai/score-resume/route.ts
│       ├── ai/chat/route.ts
│       └── payments/create-order + verify/route.ts
│
├── lib/                   ← ALL backend files (copy into Next.js)
│   ├── config.js          ← EDIT THIS FIRST (brand name/color)
│   ├── supabase.js        ← database client
│   ├── auth.js            ← login functions
│   ├── student.js         ← student data
│   ├── jobs.js            ← job search/post
│   ├── ai.js              ← Gemini AI
│   ├── payments.js        ← Razorpay
│   └── admin.js           ← admin controls
│
├── database/
│   └── careerflow_schema.sql  ← run this in Supabase SQL Editor
│
└── html-previews/             ← open in browser to see UI designs
    ├── careerflow_admin.html
    ├── careerflow_student.html
    ├── careerflow_recruiter.html
    ├── careerflow_jobs.html
    ├── careerflow_resume.html
    └── careerflow_payments.html

---

## STEP 1 — Edit your brand (2 minutes)
Open lib/config.js and change:
  BRAND.name        → "YourBrandName AI"
  BRAND.accentColor → "#059669" (or any hex color)
  BRAND.email       → "you@youremail.com"
  BRAND.domain      → "yoursite.vercel.app"

---

## STEP 2 — Create Supabase (10 minutes)
1. Go to supabase.com → sign up free
2. New Project → name: careerflow-ai → region: Singapore
3. SQL Editor → New Query → paste database/careerflow_schema.sql → Run
4. Storage → create 3 buckets: resumes (private), avatars (public), documents (private)
5. Settings → API → copy: Project URL, anon key, service_role key → save in notepad

---

## STEP 3 — Google OAuth (8 minutes)
1. console.cloud.google.com → new project → APIs & Services → OAuth consent → External
2. Fill app name + email → Save
3. Credentials → Create → OAuth client ID → Web application
4. Authorized JavaScript origins: https://YOURPROJECTID.supabase.co
5. Authorized redirect URIs: https://YOURPROJECTID.supabase.co/auth/v1/callback
6. Save → copy Client ID and Client Secret
7. Supabase → Auth → Providers → Google → paste both → Save (leave "Client IDs" BLANK)

---

## STEP 4 — GitHub OAuth (5 minutes)
1. github.com/settings/developers → OAuth Apps → New OAuth App
2. Callback URL: https://YOURPROJECTID.supabase.co/auth/v1/callback
3. Homepage URL: http://localhost:3000 (update after deploy)
4. Register → generate client secret → copy both
5. Supabase → Auth → Providers → GitHub → paste both → Save

---

## STEP 5 — Get Gemini AI key (2 minutes)
1. aistudio.google.com/app/apikey → Create API key
2. Copy key (starts with AIzaSy...)

---

## STEP 6 — Create Next.js project on your laptop

Open terminal and run these commands one by one:

  npx create-next-app@14 careerflow-ai --typescript --tailwind --app

  cd careerflow-ai

  npm install @supabase/supabase-js @supabase/ssr razorpay lucide-react recharts react-hook-form zod @hookform/resolvers date-fns resend clsx tailwind-merge class-variance-authority

---

## STEP 7 — Copy files into project

From this CareerFlowAI-Complete folder, copy:
  • Everything in app/       → into your project's app/ folder
  • Everything in lib/       → into your project's lib/ folder (create it)
  • middleware.ts            → into your project root
  • .env.local.example       → rename to .env.local → fill in your keys

---

## STEP 8 — Fill in .env.local

Open .env.local and paste your values:

  NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECTID.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  GEMINI_API_KEY=AIzaSy...
  NEXTAUTH_SECRET=any-long-random-text-here-2024
  NEXT_PUBLIC_BRAND_NAME=CareerFlow AI
  NEXT_PUBLIC_SITE_URL=http://localhost:3000

---

## STEP 9 — Test locally

  npm run dev

Open http://localhost:3000 — your site should load!

---

## STEP 10 — Create GitHub repository

1. github.com → New repository → name: careerflow-ai → Private
2. In terminal:
   git init
   git add .
   git commit -m "first upload"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/careerflow-ai.git
   git push -u origin main

---

## STEP 11 — Deploy to Vercel

1. vercel.com → New Project → Import GitHub repo
2. Add Environment Variables (same as .env.local — all 7 keys)
3. Click Deploy → wait 3 minutes
4. Your site is LIVE at yourapp.vercel.app! 🎉

---

## STEP 12 — Make yourself Admin

1. Sign up on your live site with your email
2. Supabase → SQL Editor → New Query → paste:

   UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

3. Click Run → "1 row affected"
4. Go to yoursite.vercel.app/admin → YOU ARE ADMIN 👑

---

## STEP 13 — Update GitHub OAuth after deploy

1. github.com/settings/developers → your app → Edit
2. Homepage URL → change to https://yourapp.vercel.app

---

## EVERY FUTURE UPDATE (3 commands)

After making any change to your code:
  git add .
  git commit -m "describe your change"
  git push

Vercel auto-deploys in ~2 minutes. Done!

---

## ADD PAYMENTS LATER (when ready to charge)

1. Sign up at razorpay.com → complete KYC (Aadhaar + PAN + Bank)
2. Wait 1-2 days for verification
3. Dashboard → Settings → API Keys → copy test keys
4. Add to Vercel env variables:
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
5. Redeploy → test with card 4111 1111 1111 1111
6. Switch to rzp_live_ keys when ready for real money

---

## YOUR PLATFORM URLS

Page              URL                    Who
Landing           yoursite.com           Everyone
Login             yoursite.com/login     Everyone
Sign Up           yoursite.com/signup    Everyone
Jobs              yoursite.com/jobs      Everyone
Pricing           yoursite.com/pricing   Everyone
Dashboard         yoursite.com/dashboard Logged in
Applications      yoursite.com/applications Logged in
Resume AI         yoursite.com/resume    Logged in
AI Coach          yoursite.com/ai-coach  Logged in
Profile           yoursite.com/profile   Logged in
Recruiter         yoursite.com/recruiter Logged in
Admin Panel       yoursite.com/admin     You only 👑

---

## COST: ₹0/MONTH

Service    | Free tier           | You pay when
Supabase   | 50,000 users        | After 50k users
Vercel     | Unlimited deploys   | Never (hobby)
Gemini AI  | 60 req/min          | Heavy usage
Razorpay   | ₹0 setup            | 2% per payment
TOTAL      | ₹0/month            | Only after growth

---

## STUCK? COMMON FIXES

Error: "Cannot find module '@/lib/auth'"
Fix: lib/ folder must be at ROOT of project (same level as app/)

Error: White blank page
Fix: Check .env.local has all keys filled in. Restart: npm run dev

Error: "redirect_uri_mismatch" on Google login
Fix: Check Supabase callback URL in Google Cloud Console exactly matches

Error: /admin redirects to /dashboard
Fix: Run the SQL admin command in Supabase SQL Editor

Error: Build fails on Vercel
Fix: Run "npm run build" locally first — read the error message carefully

Still stuck? Share the exact error message and I will fix it!
