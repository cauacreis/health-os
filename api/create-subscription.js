export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, userEmail } = req.body
  if (!userId || !userEmail) return res.status(400).json({ error: 'Missing fields' })

  const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: 'Health OS PRO',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 19.90,
        currency_id: 'BRL',
      },
      back_url: `${process.env.APP_URL}/?payment=success`,
      external_reference: userId,
    }),
  })

  const plan = await response.json()

  if (!plan.id) {
    console.error('MP error:', plan)
    return res.status(500).json({ error: 'Erro ao criar plano' })
  }

  // Cria a assinatura para o usuário
  const subResponse = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      preapproval_plan_id: plan.id,
      reason: 'Health OS PRO',
      external_reference: userId,
      payer_email: userEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 19.90,
        currency_id: 'BRL',
      },
      back_url: `${process.env.APP_URL}/?payment=success`,
      status: 'pending',
    }),
  })

  const sub = await subResponse.json()

  if (!sub.init_point) {
    console.error('MP sub error:', sub)
    return res.status(500).json({ error: 'Erro ao criar assinatura' })
  }

  res.json({ init_point: sub.init_point })
}