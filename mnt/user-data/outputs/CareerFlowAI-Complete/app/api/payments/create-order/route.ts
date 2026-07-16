// app/api/payments/create-order/route.ts
// ─────────────────────────────────────────────────────────────
// Creates a Razorpay order when user clicks "Pay"
// Run this ONLY after completing Razorpay KYC and getting live keys
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Plan prices in paise (₹1 = 100 paise)
const PLAN_PRICES: Record<string, Record<string, number>> = {
  premium:      { monthly: 24900,  annual: 208800  },  // ₹249, ₹2088
  premium_plus: { monthly: 49900,  annual: 418800  },  // ₹499, ₹4188
}

export async function POST(request: NextRequest) {
  try {
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
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

    const { planId, billing = 'monthly', coupon } = await request.json()

    let amountPaise = PLAN_PRICES[planId]?.[billing]
    if (!amountPaise) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    // Apply coupon discount
    if (coupon === 'CAREERFLOW50') {
      amountPaise = Math.floor(amountPaise * 0.5)
    }

    // Add GST 18%
    const gst   = Math.round(amountPaise * 0.18)
    const total = amountPaise + gst

    // Create Razorpay order
    // NOTE: Install razorpay package: npm install razorpay
    // Uncomment below when you have Razorpay keys:

    /*
    const Razorpay = require('razorpay')
    const rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await rzp.orders.create({
      amount:   total,
      currency: 'INR',
      receipt:  `cf_${user.id}_${Date.now()}`,
      notes: { user_id: user.id, plan_id: planId, billing },
    })

    return NextResponse.json({
      orderId:  order.id,
      amount:   total,
      currency: 'INR',
      keyId:    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
    */

    // Temporary response until Razorpay is set up:
    return NextResponse.json({
      orderId:  'order_test_' + Date.now(),
      amount:   total,
      currency: 'INR',
      keyId:    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxx',
      message:  'Razorpay not configured yet — add your keys to .env.local',
    })

  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
