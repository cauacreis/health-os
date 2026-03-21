import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, userEmail, couponCode } = req.body
  if (!userId || !userEmail) return res.status(400).json({ error: 'Missing fields' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Valida cupom se fornecido
  let discount = 0
  let coupon = null
  if (couponCode) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase().trim())
      .eq('active', true)
      .single()
    if (data) {
      coupon = data
      discount = data.discount_pct || data.discount_value || 0
    }
  }

  const basePrice = 19.90
  const finalPrice = coupon
    ? parseFloat((basePrice * (1 - discount / 100)).toFixed(2))
    : basePrice

  const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: coupon
        ? `Health OS PRO (${discount}% OFF com ${coupon.code})`
        : 'Health OS PRO',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: finalPrice,
        currency_id: 'BRL',
      },
      back_url: `${process.env.APP_URL}/?payment=success`,
      external_reference: userId,
    }),
  })

  const plan = await response.json()
  console.log('MP plan response:', JSON.stringify(plan))

  if (!plan.init_point) {
    console.error('MP error:', JSON.stringify(plan))
    return res.status(500).json({ error: 'Erro ao criar plano' })
  }

  // Registra uso do cupom
  if (coupon) {
    const commission = parseFloat((finalPrice * (coupon.commission_pct / 100)).toFixed(2))
    await supabase.from('coupon_uses').insert({
      coupon_id: coupon.id,
      user_id: userId,
      amount_paid: finalPrice,
      commission,
    })
    await supabase.from('coupons')
      .update({ uses: (coupon.uses || 0) + 1 })
      .eq('id', coupon.id)
  }

  res.json({ init_point: plan.init_point, final_price: finalPrice, discount })