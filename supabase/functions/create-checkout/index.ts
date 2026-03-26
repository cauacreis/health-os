// supabase/functions/create-checkout/index.ts
// Deploy: supabase functions deploy create-checkout

import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!; // Price do plano Pro no Stripe
const APP_URL  = Deno.env.get("APP_URL")!;          // ex: https://healthos.vercel.app

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Autenticar usuário via JWT do Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return error("Não autorizado", 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return error("Token inválido", 401);

    const body = await req.json();
    const couponCode: string | undefined = body.coupon_code?.trim().toUpperCase();

    // Buscar ou criar cliente Stripe
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    // Validar e aplicar cupom (se fornecido)
    let stripeCouponId: string | undefined;
    let discountInfo: { type: string; value: number } | undefined;

    if (couponCode) {
      // Valida no nosso banco
      const { data: validation } = await supabase
        .rpc("validate_coupon", { coupon_code: couponCode, p_user_id: user.id });

      if (!validation?.[0]?.valid) {
        return error(validation?.[0]?.message || "Cupom inválido", 400);
      }

      const couponData = validation[0];
      discountInfo = { type: couponData.discount_type, value: couponData.discount_value };

      // Criar/buscar cupom no Stripe
      const couponIdInStripe = `HEALTHOS_${couponCode}`;
      try {
        await stripe.coupons.retrieve(couponIdInStripe);
        stripeCouponId = couponIdInStripe;
      } catch {
        const newCoupon = await stripe.coupons.create({
          id: couponIdInStripe,
          ...(couponData.discount_type === "percent"
            ? { percent_off: couponData.discount_value }
            : { amount_off: Math.round(couponData.discount_value * 100), currency: "brl" }),
          duration: "once",
          name: couponCode,
        });
        stripeCouponId = newCoupon.id;
      }
    }

    // Criar sessão de checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}?success=true`,
      cancel_url:  `${APP_URL}?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        coupon_code: couponCode || "",
      },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      locale: "pt-BR",
      currency: "brl",
    };

    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return json({ url: session.url, discount: discountInfo });
  } catch (err) {
    console.error(err);
    return error("Erro interno: " + (err as Error).message, 500);
  }
});

// ── Portal do cliente (gerenciar/cancelar assinatura) ──────────
// Rota adicional: POST /create-checkout com body { action: "portal" }
// Separado para simplicidade, mas pode ser adicionado aqui

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}
