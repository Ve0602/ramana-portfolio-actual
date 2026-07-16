// app/api/payments/verify/route.ts
// ─────────────────────────────────────────────────────────────
// Verifies Razorpay payment signature after checkout
// Activates subscription in database on success
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json()

    // ── STEP 1: Verify signature ──────────────────────────────
    // This is the most important security check
    // Never skip this — it prevents fake payment confirmations
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch — possible fraud attempt')
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // ── STEP 2: Get user from session ─────────────────────────
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not logged in' }, { status: 401 })
    }

    // ── STEP 3: Get order details from Razorpay ───────────────
    // Fetch the order to get plan details from notes
    let planId = 'premium'
    let billing = 'monthly'

    try {
      // Fetch order from Razorpay to get notes
      const orderRes = await fetch(
        `https://api.razorpay.com/v1/orders/${razorpay_order_id}`,
        {
          headers: {
            Authorization: 'Basic ' + Buffer.from(
              `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
            ).toString('base64'),
          },
        }
      )
      const orderData = await orderRes.json()
      planId = orderData.notes?.plan_id || 'premium'
      billing = orderData.notes?.billing  || 'monthly'
    } catch (e) {
      console.error('Could not fetch order details:', e)
      // Continue with defaults
    }

    // ── STEP 4: Calculate subscription end date ───────────────
    const endsAt = new Date()
    if (billing === 'annual') {
      endsAt.setFullYear(endsAt.getFullYear() + 1)
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1)
    }

    // ── STEP 5: Save subscription to database ─────────────────
    await supabase.from('subscriptions').upsert({
      user_id:    user.id,
      plan:       planId,
      amount:     0,               // will be updated from webhook
      currency:   'INR',
      payment_id: razorpay_payment_id,
      status:     'success',
      starts_at:  new Date().toISOString(),
      ends_at:    endsAt.toISOString(),
      auto_renew: true,
    })

    // ── STEP 6: Upgrade user plan ─────────────────────────────
    await supabase
      .from('users')
      .update({
        subscription:     planId,
        subscription_end: endsAt.toISOString(),
      })
      .eq('id', user.id)

    // ── STEP 7: Send success notification ─────────────────────
    await supabase.from('notifications').insert({
      user_id: user.id,
      type:    'payment',
      title:   `✅ Payment successful! You are now on ${planId} plan.`,
      data:    { payment_id: razorpay_payment_id, plan: planId },
    })

    console.log(`✅ Payment verified: ${razorpay_payment_id} → ${user.id} → ${planId}`)

    return NextResponse.json({
      success:    true,
      payment_id: razorpay_payment_id,
      plan:       planId,
      ends_at:    endsAt.toISOString(),
    })

  } catch (error: any) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error during verification' },
      { status: 500 }
    )
  }
}
