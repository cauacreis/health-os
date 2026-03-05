// src/pages/Subscription.jsx
// Adicione esta rota no seu App.jsx:
//   <Route path="/subscription" element={<Subscription />} />

import { useState, useEffect } from "react";
function useSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return [params];
}import { supabase } from "../lib/supabase";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Planos ─────────────────────────────────────────────────────
const PLANS = {
  free: {
    name: "FREE",
    price: "R$ 0",
    period: "",
    features: [
      "Dashboard básico",
      "Registro de treinos",
      "Controle de água",
      "Glossário fitness",
    ],
    locked: [
      "Histórico de bioimpedância",
      "Gráficos avançados",
      "Cardio com zonas HR",
      "Todos os programas de treino",
      "Log alimentar completo",
      "Calendário de treinos",
    ],
  },
  pro: {
    name: "PRO",
    price: "R$ 19,90",
    period: "/mês",
    features: [
      "Tudo do plano Free",
      "Histórico de bioimpedância",
      "Gráficos avançados",
      "Cardio com zonas HR",
      "Todos os programas de treino",
      "Log alimentar completo",
      "Calendário de treinos",
      "Suporte prioritário",
    ],
    locked: [],
  },
};

export default function Subscription() {
  const [searchParams] = useSearchParams();
  const [sub, setSub]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading]     = useState(false);
  const [coupon, setCoupon]   = useState("");
  const [couponMsg, setCouponMsg] = useState(null);   // { valid, message, discount }
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [toast, setToast]     = useState(null);

  const isSuccess  = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";

  // ── Carregar assinatura ──────────────────────────────────────
  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (isSuccess) showToast("✅ Assinatura ativada! Bem-vindo ao Pro.", "success");
    if (isCanceled) showToast("Pagamento cancelado.", "error");
  }, [isSuccess, isCanceled]);

  async function fetchSubscription() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    setSub(data);
    setLoading(false);
  }

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Validar cupom ────────────────────────────────────────────
  async function handleValidateCoupon() {
    if (!coupon.trim()) return;
    setValidatingCoupon(true);
    setCouponMsg(null);

    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.rpc("validate_coupon", {
      coupon_code: coupon.trim().toUpperCase(),
      p_user_id: session.user.id,
    });

    if (error || !data?.[0]) {
      setCouponMsg({ valid: false, message: "Erro ao validar cupom." });
    } else {
      const r = data[0];
      if (r.valid) {
        const label = r.discount_type === "percent"
          ? `${r.discount_value}% de desconto`
          : `R$ ${r.discount_value.toFixed(2)} de desconto`;
        setCouponMsg({ valid: true, message: `Cupom válido! ${label}`, discount: r });
      } else {
        setCouponMsg({ valid: false, message: r.message });
      }
    }
    setValidatingCoupon(false);
  }

  // ── Iniciar checkout ─────────────────────────────────────────
  async function handleCheckout() {
    setCheckoutLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showToast("Faça login primeiro.", "error"); setCheckoutLoading(false); return; }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey":        SUPABASE_ANON,
        },
        body: JSON.stringify({
          coupon_code: couponMsg?.valid ? coupon.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Erro ao iniciar pagamento.", "error");
      }
    } catch {
      showToast("Erro de conexão. Tente novamente.", "error");
    }
    setCheckoutLoading(false);
  }

  // ── Portal do cliente ────────────────────────────────────────
  async function handlePortal() {
    setPortalLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/customer-portal`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey":        SUPABASE_ANON,
        },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || "Erro ao abrir portal.", "error");
    } catch {
      showToast("Erro de conexão.", "error");
    }
    setPortalLoading(false);
  }

  // ── Status helpers ───────────────────────────────────────────
  const isPro     = sub?.plan === "pro" && sub?.status === "active";
  const isTrialing = sub?.status === "trialing";
  const isPastDue  = sub?.status === "past_due";
  const willCancel = sub?.cancel_at_period_end;

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
    : null;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === "success" ? "#dc2626" : toast.type === "error" ? "#333" : "#222",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.tag}>PLANOS</div>
          <h1 style={styles.title}>Health OS</h1>
          <p style={styles.subtitle}>
            Escolha seu plano e monitore sua saúde sem limites.
          </p>
        </header>

        {/* Status da assinatura atual */}
        {!loading && (isPro || isTrialing || isPastDue) && (
          <div style={styles.statusCard}>
            <div style={styles.statusRow}>
              <span style={styles.statusBadge}>
                {isTrialing ? "⏳ TRIAL" : isPastDue ? "⚠️ PAGAMENTO PENDENTE" : "✓ PRO ATIVO"}
              </span>
              {periodEnd && (
                <span style={styles.statusDate}>
                  {willCancel ? `Cancela em ${periodEnd}` : `Renova em ${periodEnd}`}
                </span>
              )}
            </div>
            {willCancel && (
              <p style={styles.cancelNotice}>
                Sua assinatura não será renovada. Você mantém o acesso até {periodEnd}.
              </p>
            )}
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              style={styles.portalBtn}
            >
              {portalLoading ? "Carregando..." : "Gerenciar assinatura →"}
            </button>
          </div>
        )}

        {/* Cards de plano */}
        <div style={styles.plansGrid}>
          {/* FREE */}
          <div style={{
            ...styles.planCard,
            opacity: isPro ? 0.5 : 1,
          }}>
            <div style={styles.planHeader}>
              <span style={styles.planName}>{PLANS.free.name}</span>
              <div>
                <span style={styles.planPrice}>{PLANS.free.price}</span>
              </div>
            </div>
            <ul style={styles.featureList}>
              {PLANS.free.features.map(f => (
                <li key={f} style={styles.featureItem}>
                  <span style={{ color: "#dc2626", marginRight: 8 }}>▸</span>{f}
                </li>
              ))}
              {PLANS.free.locked.map(f => (
                <li key={f} style={{ ...styles.featureItem, opacity: 0.3 }}>
                  <span style={{ marginRight: 8 }}>✕</span>{f}
                </li>
              ))}
            </ul>
            {!isPro && (
              <div style={styles.currentBadge}>PLANO ATUAL</div>
            )}
          </div>

          {/* PRO */}
          <div style={{
            ...styles.planCard,
            ...styles.planCardPro,
            ...(isPro ? styles.planCardActive : {}),
          }}>
            <div style={styles.proGlow} />
            <div style={styles.planHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={styles.planName}>{PLANS.pro.name}</span>
                <span style={styles.popularTag}>POPULAR</span>
              </div>
              <div>
                <span style={styles.planPrice}>{PLANS.pro.price}</span>
                <span style={styles.planPeriod}>{PLANS.pro.period}</span>
              </div>
            </div>
            <ul style={styles.featureList}>
              {PLANS.pro.features.map(f => (
                <li key={f} style={styles.featureItem}>
                  <span style={{ color: "#dc2626", marginRight: 8 }}>▸</span>{f}
                </li>
              ))}
            </ul>

            {!isPro && (
              <>
                {/* Input de cupom */}
                <div style={styles.couponSection}>
                  <div style={styles.couponRow}>
                    <input
                      type="text"
                      value={coupon}
                      onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponMsg(null); }}
                      onKeyDown={e => e.key === "Enter" && handleValidateCoupon()}
                      placeholder="CUPOM DE DESCONTO"
                      style={styles.couponInput}
                      maxLength={20}
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !coupon.trim()}
                      style={styles.couponBtn}
                    >
                      {validatingCoupon ? "..." : "OK"}
                    </button>
                  </div>
                  {couponMsg && (
                    <div style={{
                      ...styles.couponMsg,
                      color: couponMsg.valid ? "#4ade80" : "#f87171",
                    }}>
                      {couponMsg.message}
                    </div>
                  )}
                </div>

                {/* Botão assinar */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || loading}
                  style={styles.checkoutBtn}
                >
                  {checkoutLoading ? "Aguarde..." : "ASSINAR AGORA →"}
                </button>
                <p style={styles.secureNote}>🔒 Pagamento seguro via Stripe</p>
              </>
            )}

            {isPro && (
              <div style={styles.currentBadge}>PLANO ATUAL</div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div style={styles.faq}>
          <h2 style={styles.faqTitle}>PERGUNTAS FREQUENTES</h2>
          {[
            ["Posso cancelar a qualquer momento?", "Sim. Você pode cancelar pelo portal do cliente a qualquer momento. O acesso Pro continua até o fim do período pago."],
            ["Os cupons expiram?", "Depende do cupom. Alguns são por tempo limitado, outros ilimitados. Aplique antes de finalizar o pagamento."],
            ["Quais formas de pagamento?", "Cartão de crédito, débito e boleto via Stripe. Processamento 100% seguro."],
            ["O que acontece no fim do trial?", "Após o período trial, a cobrança mensal inicia automaticamente. Cancele antes se não quiser continuar."],
          ].map(([q, a]) => (
            <FaqItem key={q} question={q} answer={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={styles.faqItem}>
      <button
        onClick={() => setOpen(o => !o)}
        style={styles.faqQuestion}
      >
        <span>{question}</span>
        <span style={{ color: "#dc2626" }}>{open ? "−" : "+"}</span>
      </button>
      {open && <p style={styles.faqAnswer}>{answer}</p>}
    </div>
  );
}

// ── Estilos (inline, sem dependências externas) ───────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e5e5e5",
    fontFamily: "'Space Mono', monospace",
    padding: "40px 16px 80px",
  },
  container: {
    maxWidth: 800,
    margin: "0 auto",
  },
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "'Space Mono', monospace",
    zIndex: 9999,
    color: "#fff",
    whiteSpace: "nowrap",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  tag: {
    display: "inline-block",
    fontSize: 10,
    letterSpacing: 4,
    color: "#dc2626",
    border: "1px solid #dc2626",
    padding: "3px 10px",
    marginBottom: 16,
  },
  title: {
    fontSize: "clamp(28px, 6vw, 48px)",
    fontWeight: 700,
    margin: "0 0 8px",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    letterSpacing: 1,
  },
  statusCard: {
    border: "1px solid #dc2626",
    background: "rgba(220,38,38,0.05)",
    borderRadius: 4,
    padding: "16px 20px",
    marginBottom: 32,
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#dc2626",
    letterSpacing: 2,
  },
  statusDate: {
    fontSize: 11,
    color: "#888",
  },
  cancelNotice: {
    fontSize: 11,
    color: "#f87171",
    margin: "8px 0 0",
  },
  portalBtn: {
    marginTop: 12,
    background: "transparent",
    border: "1px solid #555",
    color: "#e5e5e5",
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: 1,
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: 2,
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 48,
  },
  planCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 6,
    padding: 28,
    position: "relative",
    overflow: "hidden",
  },
  planCardPro: {
    border: "1px solid #dc2626",
    background: "#0f0f0f",
  },
  planCardActive: {
    boxShadow: "0 0 40px rgba(220,38,38,0.15)",
  },
  proGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    background: "rgba(220,38,38,0.07)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  planHeader: {
    marginBottom: 24,
  },
  planName: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#888",
    display: "block",
    marginBottom: 8,
  },
  popularTag: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#dc2626",
    border: "1px solid #dc2626",
    padding: "2px 6px",
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 700,
    color: "#fff",
  },
  planPeriod: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 24px",
  },
  featureItem: {
    fontSize: 12,
    lineHeight: 2,
    color: "#ccc",
    letterSpacing: 0.5,
  },
  currentBadge: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 3,
    color: "#555",
    border: "1px solid #333",
    padding: "6px 0",
    marginTop: 8,
  },
  couponSection: {
    marginBottom: 16,
  },
  couponRow: {
    display: "flex",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#e5e5e5",
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: 2,
    padding: "10px 12px",
    borderRadius: 2,
    outline: "none",
  },
  couponBtn: {
    background: "transparent",
    border: "1px solid #555",
    color: "#e5e5e5",
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: "0 14px",
    cursor: "pointer",
    borderRadius: 2,
    letterSpacing: 1,
  },
  couponMsg: {
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  checkoutBtn: {
    width: "100%",
    background: "#dc2626",
    border: "none",
    color: "#fff",
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    padding: "14px 0",
    cursor: "pointer",
    borderRadius: 2,
    transition: "background 0.2s",
  },
  secureNote: {
    textAlign: "center",
    fontSize: 10,
    color: "#555",
    margin: "8px 0 0",
    letterSpacing: 1,
  },
  faq: {
    borderTop: "1px solid #222",
    paddingTop: 40,
  },
  faqTitle: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#888",
    marginBottom: 24,
  },
  faqItem: {
    borderBottom: "1px solid #1a1a1a",
    paddingBottom: 4,
    marginBottom: 4,
  },
  faqQuestion: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    border: "none",
    color: "#e5e5e5",
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    textAlign: "left",
    padding: "14px 0",
    cursor: "pointer",
    lineHeight: 1.5,
  },
  faqAnswer: {
    fontSize: 11,
    color: "#888",
    lineHeight: 1.8,
    margin: "0 0 14px",
    letterSpacing: 0.3,
  },
};
