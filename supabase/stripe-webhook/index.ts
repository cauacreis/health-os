// supabase/functions/stripe-webhook/index.ts
// Deploy: supabase functions deploy stripe-webhook

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

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("Webhook event:", event.type);

  try {
    switch (event.type) {

      // ── Checkout concluído → ativar plano ────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.supabase_user_id;
        const couponCode = session.metadata?.coupon_code;

        if (!userId || session.mode !== "subscription") break;

        const stripeSubId = session.subscription as string;
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

        await supabase.from("subscriptions").upsert({
          user_id:                userId,
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: stripeSubId,
          plan:                   "pro",
          status:                 "active",
          current_period_start:   new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end:     new Date(stripeSub.current_period_end * 1000).toISOString(),
          cancel_at_period_end:   stripeSub.cancel_at_period_end,
          coupon_used:            couponCode || null,
        }, { onConflict: "user_id" });

        // Registrar uso do cupom
        if (couponCode) {
          const { data: coupon } = await supabase
            .from("coupons")
            .select("id")
            .eq("code", couponCode)
            .single();

          if (coupon) {
            await supabase.from("coupon_uses").insert({
              coupon_id: coupon.id,
              user_id:   userId,
            });
            await supabase.rpc("increment_coupon_uses", { p_coupon_id: coupon.id });
          }
        }
        break;
      }

      // ── Renovação mensal bem-sucedida ────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== "subscription_cycle") break;

        const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription as string);

        await supabase.from("subscriptions")
          .update({
            status:               "active",
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(stripeSub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", invoice.subscription as string);
        break;
      }

      // ── Pagamento falhou ─────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", invoice.subscription as string);
        break;
      }

      // ── Assinatura cancelada/encerrada ────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("subscriptions")
          .update({ plan: "free", status: "canceled", stripe_subscription_id: null })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      // ── Atualização (ex: solicitou cancelamento ao fim do período) ──
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("subscriptions")
          .update({
            status:               sub.status as string,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end:   new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }
});
