// ============================================================
// CareerFlow AI — Razorpay Payment Integration
// lib/payments.js  (client)
// pages/api/payments/*.js  (server)
//
// FREE to integrate — Razorpay charges 2% per transaction only
// Sign up: https://razorpay.com
// ============================================================

// ════════════════════════════════════
// CLIENT SIDE: lib/payments.js
// ════════════════════════════════════

// Load Razorpay script dynamically
export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// Open Razorpay checkout
export async function openRazorpayCheckout({ orderId, amount, planName, userEmail, userName, onSuccess, onFailure }) {
  const loaded = await loadRazorpay()
  if (!loaded) throw new Error('Razorpay SDK failed to load')

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount,                             // in paise
    currency: 'INR',
    name: 'CareerFlow AI',
    description: `${planName} Plan Subscription`,
    image: '/logo.png',
    order_id: orderId,
    handler: async (response) => {
      // Verify on server
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
        }),
      })
      const data = await res.json()
      if (data.success) onSuccess(data)
      else onFailure(new Error('Payment verification failed'))
    },
    prefill: { name: userName, email: userEmail },
    theme: { color: '#0f172a' },
    modal: { ondismiss: () => onFailure(new Error('Payment cancelled')) },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (r) => onFailure(new Error(r.error.description)))
  rzp.open()
}

// ─────────────────────────────────────────────────────────────
// SERVER SIDE API ROUTES (put in pages/api/ or app/api/)
// ─────────────────────────────────────────────────────────────

// ════════════════════════════════════
// pages/api/payments/create-order.js
// ════════════════════════════════════
/*
import Razorpay from 'razorpay'
import { supabaseAdmin } from '../../../lib/supabase'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const PLAN_PRICES = {
  premium:      { monthly: 24900, annual: 208800 },   // paise
  premium_plus: { monthly: 49900, annual: 418800 },
  enterprise:   { monthly: null,  annual: null  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { planId, billing, coupon, userId } = req.body

  // Validate user
  const { data: user } = await supabaseAdmin
    .from('users').select('id, email, full_name').eq('id', userId).single()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Get price
  let amountPaise = PLAN_PRICES[planId]?.[billing]
  if (!amountPaise) return res.status(400).json({ error: 'Invalid plan' })

  // Apply coupon
  if (coupon === 'CAREERFLOW50') amountPaise = Math.floor(amountPaise * 0.5)

  // Add GST (18%)
  const gst   = Math.round(amountPaise * 0.18)
  const total = amountPaise + gst

  try {
    const order = await razorpay.orders.create({
      amount:   total,
      currency: 'INR',
      receipt:  `cf_${userId}_${Date.now()}`,
      notes: { user_id: userId, plan_id: planId, billing, coupon: coupon || '' },
    })

    // Save pending subscription in DB
    await supabaseAdmin.from('subscriptions').insert({
      user_id:    userId,
      plan:       planId,
      amount:     total / 100,
      currency:   'INR',
      status:     'pending',
    })

    return res.status(200).json({ orderId: order.id, amount: total, currency: 'INR' })
  } catch (e) {
    console.error('Razorpay order error:', e)
    return res.status(500).json({ error: 'Could not create order' })
  }
}
*/

// ════════════════════════════════════
// pages/api/payments/verify.js
// ════════════════════════════════════
/*
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '../../../lib/supabase'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  // STEP 1 — Verify signature (CRITICAL security check)
  const body      = razorpay_order_id + '|' + razorpay_payment_id
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Signature mismatch' })
  }

  // STEP 2 — Fetch order details
  const order = await razorpay.orders.fetch(razorpay_order_id)
  const { user_id, plan_id, billing } = order.notes

  try {
    // STEP 3 — Activate subscription in DB
    const endsAt = new Date()
    if (billing === 'annual') endsAt.setFullYear(endsAt.getFullYear() + 1)
    else endsAt.setMonth(endsAt.getMonth() + 1)

    await supabaseAdmin
      .from('subscriptions')
      .update({
        payment_id: razorpay_payment_id,
        status:     'success',
        starts_at:  new Date().toISOString(),
        ends_at:    endsAt.toISOString(),
      })
      .eq('user_id', user_id)
      .eq('status',  'pending')

    // STEP 4 — Upgrade user plan
    await supabaseAdmin
      .from('users')
      .update({
        subscription:     plan_id,
        subscription_end: endsAt.toISOString(),
      })
      .eq('id', user_id)

    // STEP 5 — Send welcome notification
    await supabaseAdmin.from('notifications').insert({
      user_id,
      type:  'payment',
      title: `✅ Payment successful! You're now on ${plan_id} plan.`,
      data:  { payment_id: razorpay_payment_id, plan: plan_id },
    })

    return res.status(200).json({
      success:    true,
      payment_id: razorpay_payment_id,
      plan:       plan_id,
      ends_at:    endsAt.toISOString(),
    })
  } catch (e) {
    console.error('Verify error:', e)
    return res.status(500).json({ success: false, error: 'DB update failed' })
  }
}
*/

// ════════════════════════════════════
// pages/api/payments/webhook.js
// Handles auto-renewal failures + Razorpay events
// ════════════════════════════════════
/*
import crypto from 'crypto'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify webhook signature
  const signature = req.headers['x-razorpay-signature']
  const body      = JSON.stringify(req.body)
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  if (signature !== expected) return res.status(400).end()

  const { event, payload } = req.body

  switch (event) {
    case 'payment.captured':
      // Handle successful payment
      break

    case 'payment.failed':
      const paymentEntity = payload.payment.entity
      // Mark subscription as failed, notify user
      await supabaseAdmin.from('notifications').insert({
        type:  'payment',
        title: '⚠️ Payment failed — please update your payment method',
        data:  { payment_id: paymentEntity.id },
        // user_id would be in notes
      })
      break

    case 'subscription.charged':
      // Auto-renewal success — extend subscription
      break

    case 'subscription.cancelled':
      // Downgrade user to free
      break
  }

  return res.status(200).json({ received: true })
}

// Disable body parsing for webhook (need raw body for signature)
export const config = { api: { bodyParser: false } }
*/
