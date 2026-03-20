import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()

    const { type, data } = req.body

    if (type === 'subscription_preapproval') {
        const subId = data.id

        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        })
        const sub = await mpRes.json()

        const userId = sub.external_reference
        const isActive = sub.status === 'authorized'

        await supabase
            .from('profiles')
            .update({
                is_pro: isActive,
                pro_since: isActive ? new Date().toISOString() : null,
                mp_subscription_id: subId,
            })
            .eq('id', userId)
    }

    res.status(200).end()
}