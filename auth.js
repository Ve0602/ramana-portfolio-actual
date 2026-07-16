// ============================================================
// CareerFlow AI — Authentication
// lib/auth.js
//
// Handles: Google, GitHub, LinkedIn OAuth + Email OTP + Phone OTP
// All built on Supabase Auth (free, no extra setup)
// ============================================================

import { supabase } from './supabase'

// ─── GOOGLE LOGIN ───────────────────────────────────────────
// Setup: Supabase Dashboard → Auth → Providers → Google
// Add your Google OAuth credentials from console.cloud.google.com
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw error
  return data
}

// ─── GITHUB LOGIN ────────────────────────────────────────────
// Setup: Supabase Dashboard → Auth → Providers → GitHub
export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
  return data
}

// ─── EMAIL OTP ───────────────────────────────────────────────
// Step 1: Send OTP to email
export async function sendEmailOTP(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return { success: true, message: 'OTP sent to ' + email }
}

// Step 2: Verify OTP
export async function verifyEmailOTP(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  if (error) throw error
  return data
}

// ─── PHONE OTP ───────────────────────────────────────────────
// Setup: Supabase Dashboard → Auth → Providers → Phone (Twilio/Msg91)
export async function sendPhoneOTP(phone) {
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw error
  return { success: true }
}

export async function verifyPhoneOTP(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  if (error) throw error
  return data
}

// ─── EMAIL + PASSWORD ────────────────────────────────────────
export async function signUpWithEmail(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'student' },
    },
  })
  if (error) throw error
  return data
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── SIGN OUT ────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─── GET CURRENT USER ────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─── GET CURRENT SESSION ─────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ─── LISTEN TO AUTH CHANGES ──────────────────────────────────
// Use this in your root layout/App component
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

// ─── RESET PASSWORD ──────────────────────────────────────────
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
