import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()

    const { type, data } = req.body
    console.log('Webhook received:', type, data)

    try {
        // Assinatura recorrente (cartão)
        if (type === 'subscription_preapproval') {
            const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            })
            const sub = await mpRes.json()
            const userId = sub.external_reference
            const isActive = sub.status === 'authorized'

            await supabase.from('profiles').update({
                is_pro: isActive,
                pro_since: isActive ? new Date().toISOString() : null,
                mp_subscription_id: data.id,
            }).eq('id', userId)
        }

        // Pagamento único (Pix)
        if (type === 'payment') {
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            })
            const payment = await mpRes.json()
            console.log('Payment status:', payment.status)

            if (payment.status === 'approved') {
                const userId = payment.external_reference

                // Calcula 30 dias a partir de agora
                const proUntil = new Date()
                proUntil.setDate(proUntil.getDate() + 30)

                await supabase.from('profiles').update({
                    is_pro: true,
                    pro_since: new Date().toISOString(),
                    pro_until: proUntil.toISOString(),
                }).eq('id', userId)
            }
        }
    } catch (e) {
        console.error('Webhook error:', e)
    }

    res.status(200).end()
}