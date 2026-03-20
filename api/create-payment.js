export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()

    const { userId, userEmail } = req.body
    if (!userId || !userEmail) return res.status(400).json({ error: 'Missing fields' })

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            items: [{
                title: 'Health OS PRO — 1 mês',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 19.90,
            }],
            payer: { email: userEmail },
            payment_methods: {
                excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
            },
            back_urls: {
                success: `${process.env.APP_URL}/?payment=success`,
                failure: `${process.env.APP_URL}/?payment=failure`,
                pending: `${process.env.APP_URL}/?payment=pending`,
            },
            auto_return: 'approved',
            external_reference: userId,
            notification_url: `${process.env.APP_URL}/api/webhook-mp`,
        }),
    })

    const data = await response.json()
    console.log('MP payment response:', JSON.stringify(data))

    if (!data.init_point) {
        return res.status(500).json({ error: 'Erro ao criar pagamento' })
    }

    res.json({ init_point: data.init_point })
}