import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Buscar o usuário para pegar o mp_subscription_id
    const { data: user, error: dbError } = await supabase
      .from('profiles')
      .select('mp_subscription_id')
      .eq('id', userId)
      .single()

    if (dbError || !user || !user.mp_subscription_id) {
      return res.status(404).json({ error: 'Assinatura não encontrada ou usuário não é PRO.' })
    }

    // Chama API do Mercado Pago para cancelar
    const response = await fetch(`https://api.mercadopago.com/preapproval/${user.mp_subscription_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    const result = await response.json()

    if (result.status !== 'cancelled') {
        console.error('MP Cancel Error:', result)
        // Mesmo se falhar, pode ser que já tenha sido cancelada no MP.
        // Vamos checar a mensagem de erro se a subscription já estava cancelled, mas para simplificar:
        return res.status(500).json({ error: 'Erro ao processar o cancelamento no Mercado Pago.' })
    }

    // Atualiza o banco de dados localmente para refletir o cancelamento imediatamente
    await supabase.from('profiles').update({
        is_pro: false,
        mp_subscription_id: null,
    }).eq('id', userId)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Cancel Subscription Error:', error)
    res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}
