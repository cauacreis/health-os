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
        transaction_amount: 1.00,
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

  res.json({ init_point: plan.init_point })
}