// src/pages/Subscription.jsx

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const LOSSES = [
  { icon: "📊", title: "Gráficos avançados", desc: "Seu histórico completo de evolução desaparece da tela." },
  { icon: "🧬", title: "Bioimpedância", desc: "Todos os registros de gordura, músculo e hidratação bloqueados." },
  { icon: "❤️", title: "Zonas de frequência cardíaca", desc: "Treinos de cardio sem análise de zona Z1–Z5." },
  { icon: "🏋️", title: "Todos os programas de treino", desc: "Volta apenas para o plano básico de treino." },
  { icon: "🍽️", title: "Log alimentar completo", desc: "Sem controle detalhado de refeições e macros." },
  { icon: "📅", title: "Calendário de treinos", desc: "Sem visão histórica dos treinos realizados." },
];

const PLANS = {
  free: {
    features: [
      "Dashboard básico",
      "Registro de treinos",
      "Controle de água e refeições",
      "Glossário fitness",
      "🤖 IA: 5 mensagens por dia",
      "🤖 IA: Montar treino do dia",
      "🤖 IA: Montar plano alimentar",
      "🤖 IA: Dúvidas sobre treino e nutrição",
    ],
    locked: [
      "Histórico de bioimpedância",
      "Gráficos avançados",
      "Cardio com zonas HR",
      "Todos os programas de treino",
      "Log alimentar completo",
      "Calendário de treinos",
      "🤖 IA ilimitada com dados reais",
      "🤖 IA: Sobrecarga progressiva automática",
      "🤖 IA: Detecção de platô + técnicas avançadas",
      "🤖 IA: Análise de recuperação muscular",
      "🤖 IA: Auto-regulação por fadiga (sono + bio)",
      "🤖 IA: Checkin semanal personalizado",
    ],
  },
  pro: {
    features: [
      "Tudo do plano Free",
      "Histórico de bioimpedância",
      "Gráficos avançados",
      "Cardio com zonas HR",
      "Todos os programas de treino",
      "Log alimentar completo",
      "Calendário de treinos",
      "Suporte prioritário",
      "🤖 IA ilimitada com seus dados reais",
      "🤖 IA: Sobrecarga progressiva baseada no seu histórico",
      "🤖 IA: Detecção de platô + técnicas avançadas",
      "🤖 IA: Análise de recuperação muscular real",
      "🤖 IA: Auto-regulação por sono e bioimpedância",
      "🤖 IA: Checkin e análise semanal completa",
    ],
  },
};

export default function Subscription() {
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("payment") === "success";
  const isFailure = params.get("payment") === "failure";
  const isPending = params.get("payment") === "pending";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Cupom
  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (isSuccess) showToast("✅ Pagamento aprovado! Bem-vindo ao Pro.", "success");
    if (isFailure) showToast("Pagamento cancelado ou falhou. Tente novamente.", "error");
    if (isPending) showToast("⏳ Pagamento pendente. Assim que confirmado, seu PRO será ativado.", "info");
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("is_pro, pro_since, pro_until, mp_subscription_id")
      .eq("id", session.user.id)
      .single();
    setProfile({ ...data, email: session.user.email, id: session.user.id });
    setLoading(false);
  }

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 6000);
  }

  async function handleValidateCoupon() {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponStatus(null);
    const { data } = await supabase
      .from('coupons')
      .select('discount_pct, discount_value')
      .eq('code', couponInput.trim().toUpperCase())
      .eq('active', true)
      .single();
    if (data) {
      const pct = data.discount_pct || data.discount_value || 0;
      const finalPrice = (19.90 * (1 - pct / 100)).toFixed(2);
      setCouponStatus({ valid: true, discount: pct, finalPrice });
    } else {
      setCouponStatus({ valid: false });
    }
    setValidatingCoupon(false);
  }

  async function handleCardCheckout() {
    setCardLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showToast("Faça login primeiro.", "error"); setCardLoading(false); return; }
    try {
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          userEmail: session.user.email,
          couponCode: couponStatus?.valid ? couponInput.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.init_point) window.location.href = data.init_point;
      else showToast(data.error || "Erro ao iniciar pagamento.", "error");
    } catch {
      showToast("Erro de conexão. Tente novamente.", "error");
    }
    setCardLoading(false);
  }

  async function handlePixCheckout() {
    setPixLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showToast("Faça login primeiro.", "error"); setPixLoading(false); return; }
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email }),
      });
      const data = await res.json();
      if (data.init_point) window.location.href = data.init_point;
      else showToast(data.error || "Erro ao iniciar pagamento.", "error");
    } catch {
      showToast("Erro de conexão. Tente novamente.", "error");
    }
    setPixLoading(false);
  }

  async function handleCancelSubscription() {
    showToast("Entre em contato pelo suporte para cancelar sua assinatura.", "info");
    setShowCancelModal(false);
  }

  const isPro = profile?.is_pro === true;
  const proSince = profile?.pro_since ? new Date(profile.pro_since).toLocaleDateString("pt-BR") : null;
  const proUntil = profile?.pro_until ? new Date(profile.pro_until).toLocaleDateString("pt-BR") : null;

  return (
    <div style={S.page}>

      {toast && (
        <div style={{
          ...S.toast,
          background: toast.type === "success" ? "#dc2626" : toast.type === "info" ? "#1e3a5f" : "#222"
        }}>
          {toast.msg}
        </div>
      )}

      {showCancelModal && (
        <CancelModal
          step={cancelStep}
          setStep={setCancelStep}
          onClose={() => { setShowCancelModal(false); setCancelStep(1); }}
          onConfirm={handleCancelSubscription}
        />
      )}

      <div style={S.container}>

        <header style={S.header}>
          <div style={S.tag}>PLANOS</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <h1 style={S.title}>Health OS</h1>
            {!loading && isPro && <ProBadge />}
          </div>
          <p style={S.subtitle}>Escolha seu plano e monitore sua saúde sem limites.</p>
        </header>

        {!loading && isPro && (
          <div style={S.statusCard}>
            <div style={S.statusRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={S.statusDot} />
                <span style={S.statusBadge}>✦ PRO ATIVO</span>
              </div>
              <div style={{ textAlign: "right" }}>
                {proSince && <div style={S.statusDate}>Ativo desde {proSince}</div>}
                {proUntil && <div style={{ ...S.statusDate, color: "#f97316" }}>Válido até {proUntil}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => { setShowCancelModal(true); setCancelStep(1); }} style={S.cancelTriggerBtn}>
                Cancelar assinatura
              </button>
            </div>
          </div>
        )}

        <div style={S.plansGrid}>

          {/* FREE */}
          <div style={{ ...S.planCard, opacity: isPro ? 0.45 : 1 }}>
            <div style={S.planHeader}>
              <span style={S.planName}>FREE</span>
              <span style={S.planPrice}>R$ 0</span>
            </div>
            <ul style={S.featureList}>
              {PLANS.free.features.map(f => (
                <li key={f} style={S.featureItem}><span style={{ color: "#dc2626", marginRight: 8 }}>▸</span>{f}</li>
              ))}
              {PLANS.free.locked.map(f => (
                <li key={f} style={{ ...S.featureItem, opacity: 0.25 }}><span style={{ marginRight: 8 }}>✕</span>{f}</li>
              ))}
            </ul>
            {!isPro && <div style={S.currentBadge}>PLANO ATUAL</div>}
          </div>

          {/* PRO */}
          <div style={{ ...S.planCard, ...S.planCardPro, ...(isPro ? S.planCardActive : {}) }}>
            <div style={S.proGlow} />
            <div style={S.planHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={S.planName}>PRO</span>
                <span style={S.popularTag}>POPULAR</span>
              </div>
              <div>
                <span style={S.planPrice}>R$ 19,90</span>
                <span style={S.planPeriod}>/mês</span>
              </div>
            </div>
            <ul style={S.featureList}>
              {PLANS.pro.features.map(f => (
                <li key={f} style={S.featureItem}><span style={{ color: "#dc2626", marginRight: 8 }}>▸</span>{f}</li>
              ))}
            </ul>

            {!isPro && !loading && (
              <>
                {/* Seletor de método */}
                <div style={S.methodSelector}>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    style={{ ...S.methodBtn, ...(paymentMethod === 'card' ? S.methodBtnActive : {}) }}
                  >
                    💳 Cartão mensal
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    style={{ ...S.methodBtn, ...(paymentMethod === 'pix' ? S.methodBtnPixActive : {}) }}
                  >
                    ⚡ Pix — 1 mês
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div style={S.methodDetail}>
                    <div style={S.methodDetailText}>
                      Renovação automática todo mês. Cancele quando quiser.
                    </div>

                    {/* Campo de cupom */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponStatus(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleValidateCoupon()}
                        placeholder="CUPOM DE DESCONTO"
                        maxLength={20}
                        style={{
                          flex: 1, background: '#1a1a1a',
                          border: `1px solid ${couponStatus?.valid ? '#22c55e' : couponStatus?.valid === false ? '#ef4444' : '#333'}`,
                          color: '#e5e5e5', fontFamily: "'Space Mono', monospace",
                          fontSize: 11, letterSpacing: 2, padding: '10px 12px',
                          borderRadius: 2, outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleValidateCoupon}
                        disabled={validatingCoupon || !couponInput.trim()}
                        style={{
                          background: 'transparent', border: '1px solid #555',
                          color: '#e5e5e5', fontFamily: "'Space Mono', monospace",
                          fontSize: 11, padding: '0 14px', cursor: 'pointer',
                          borderRadius: 2, letterSpacing: 1,
                        }}
                      >
                        {validatingCoupon ? '...' : 'OK'}
                      </button>
                    </div>

                    {couponStatus && (
                      <div style={{
                        fontSize: 11, marginBottom: 8, letterSpacing: 0.3,
                        color: couponStatus.valid ? '#22c55e' : '#ef4444',
                      }}>
                        {couponStatus.valid
                          ? `✓ ${couponStatus.discount}% de desconto aplicado — R$ ${couponStatus.finalPrice}/mês`
                          : '✕ Cupom inválido ou expirado'}
                      </div>
                    )}

                    <button onClick={handleCardCheckout} disabled={cardLoading} style={S.checkoutBtn}>
                      {cardLoading ? "Aguarde..." : couponStatus?.valid
                        ? `ASSINAR POR R$ ${couponStatus.finalPrice}/MÊS →`
                        : "ASSINAR COM CARTÃO →"}
                    </button>
                    <p style={S.secureNote}>🔒 Processado pelo Mercado Pago · Renovação automática</p>
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div style={S.methodDetail}>
                    <div style={S.methodDetailText}>
                      Pagamento único. Ativa 30 dias de PRO imediatamente após confirmação.
                    </div>
                    <button onClick={handlePixCheckout} disabled={pixLoading} style={{ ...S.checkoutBtn, background: "#059669" }}>
                      {pixLoading ? "Aguarde..." : "PAGAR COM PIX →"}
                    </button>
                    <p style={S.secureNote}>⚡ Aprovação instantânea · Sem renovação automática</p>
                  </div>
                )}
              </>
            )}

            {isPro && (
              <div style={{ ...S.currentBadge, color: "#dc2626", borderColor: "rgba(220,38,38,0.3)" }}>
                ✦ PLANO ATUAL
              </div>
            )}
          </div>
        </div>

        <DonationBanner />

        <div style={S.faq}>
          <h2 style={S.faqTitle}>PERGUNTAS FREQUENTES</h2>
          {[
            ["Posso cancelar a qualquer momento?", "Sim. Para cancelar a assinatura mensal, entre em contato com o suporte. O acesso continua até o fim do período pago."],
            ["O Pix ativa o PRO automaticamente?", "Sim, assim que o pagamento for confirmado pelo Mercado Pago (geralmente instantâneo), seu PRO é ativado por 30 dias."],
            ["Os cupons de desconto funcionam no Pix também?", "Por enquanto os cupons funcionam apenas na assinatura mensal via cartão."],
            ["O pagamento é seguro?", "Sim. Todo o processamento é feito pelo Mercado Pago, sem armazenar dados do cartão no Health OS."],
          ].map(([q, a]) => <FaqItem key={q} question={q} answer={a} />)}
        </div>

      </div>
    </div>
  );
}

function DonationBanner() {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      border: "1px solid #1e1e1e", borderLeft: "3px solid #dc2626",
      background: "rgba(220,38,38,0.03)", borderRadius: 6,
      padding: "24px 28px", marginBottom: 48,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 24, flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>❤️</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#dc2626" }}>
            APOIE O PROJETO
          </span>
        </div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#888", lineHeight: 1.8, margin: 0 }}>
          O Health OS é desenvolvido por um dev solo brasileiro. Qualquer apoio ajuda a manter o app no ar e acelera novas funcionalidades.
        </p>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#555", margin: "8px 0 0" }}>
          🎁 Apoiou? Manda o print no Instagram que eu ativo o PRO pra você.
        </p>
      </div>
      <a
        href="https://apoia.se/healthos"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: hover ? "rgba(220,38,38,0.12)" : "transparent",
          border: "1px solid #dc2626", color: "#dc2626",
          fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: 2, padding: "12px 22px", borderRadius: 2,
          textDecoration: "none", whiteSpace: "nowrap", transition: "background 0.15s", flexShrink: 0,
        }}
      >
        ♥ APOIAR NO APOIA.SE
      </a>
    </div>
  );
}

function ProBadge() {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "linear-gradient(135deg, #dc2626, #7f1d1d)",
      border: "1px solid rgba(220,38,38,0.5)",
      borderRadius: 4, padding: "4px 12px",
      boxShadow: "0 0 20px rgba(220,38,38,0.3)",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", boxShadow: "0 0 6px #fff" }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#fff" }}>PRO</span>
    </div>
  );
}

function CancelModal({ step, setStep, onClose, onConfirm }) {
  return (
    <div style={M.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={M.modal}>
        {step === 1 && (
          <>
            <div style={M.header}>
              <div style={M.warningIcon}>⚠</div>
              <h2 style={M.title}>Espera — você vai perder tudo isso</h2>
              <p style={M.subtitle}>Ao cancelar, você perde acesso a esses recursos.</p>
            </div>
            <div style={M.lossesList}>
              {LOSSES.map((l, i) => (
                <div key={i} style={M.lossItem}>
                  <span style={M.lossIcon}>{l.icon}</span>
                  <div>
                    <div style={M.lossTitle}>{l.title}</div>
                    <div style={M.lossDesc}>{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={M.footer}>
              <button onClick={onClose} style={M.keepBtn}>Manter meu PRO ✦</button>
              <button onClick={() => setStep(2)} style={M.continueBtn}>Quero cancelar mesmo assim</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={M.header}>
              <div style={{ ...M.warningIcon, background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)", color: "#888", fontSize: 22 }}>?</div>
              <h2 style={M.title}>Tem certeza?</h2>
              <p style={M.subtitle}>Para cancelar, entre em contato pelo suporte. Responderemos em até 24h.</p>
            </div>
            <div style={M.confirmBox}>
              <div style={M.confirmRow}>
                <span style={{ color: "#f87171", fontSize: 12 }}>✕</span>
                <span style={M.confirmText}>Todos os recursos Pro serão bloqueados</span>
              </div>
              <div style={M.confirmRow}>
                <span style={{ color: "#f87171", fontSize: 12 }}>✕</span>
                <span style={M.confirmText}>Sem reembolso proporcional</span>
              </div>
            </div>
            <div style={M.footer}>
              <button onClick={() => setStep(1)} style={M.continueBtn}>← Voltar</button>
              <button onClick={onConfirm} style={M.confirmBtn}>Confirmar cancelamento →</button>
            </div>
          </>
        )}
        <button onClick={onClose} style={M.closeBtn}>✕</button>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={S.faqItem}>
      <button onClick={() => setOpen(o => !o)} style={S.faqQuestion}>
        <span>{question}</span>
        <span style={{ color: "#dc2626" }}>{open ? "−" : "+"}</span>
      </button>
      {open && <p style={S.faqAnswer}>{answer}</p>}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "'Space Mono', monospace", padding: "40px 16px 80px" },
  container: { maxWidth: 800, margin: "0 auto" },
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: 4, fontSize: 13, fontFamily: "'Space Mono', monospace", zIndex: 9999, color: "#fff", whiteSpace: "nowrap" },
  header: { textAlign: "center", marginBottom: 40 },
  tag: { display: "inline-block", fontSize: 10, letterSpacing: 4, color: "#dc2626", border: "1px solid #dc2626", padding: "3px 10px", marginBottom: 16 },
  title: { fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: -1 },
  subtitle: { fontSize: 13, color: "#888", letterSpacing: 1 },
  statusCard: { border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.04)", borderRadius: 6, padding: "18px 22px", marginBottom: 32 },
  statusRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", flexShrink: 0 },
  statusBadge: { fontSize: 12, fontWeight: 700, color: "#dc2626", letterSpacing: 2 },
  statusDate: { fontSize: 11, color: "#888" },
  cancelTriggerBtn: { background: "transparent", border: "1px solid #333", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1, padding: "8px 14px", cursor: "pointer", borderRadius: 2 },
  plansGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 48 },
  planCard: { background: "#111", border: "1px solid #222", borderRadius: 6, padding: 28, position: "relative", overflow: "hidden" },
  planCardPro: { border: "1px solid #dc2626", background: "#0f0f0f" },
  planCardActive: { boxShadow: "0 0 40px rgba(220,38,38,0.15)" },
  proGlow: { position: "absolute", top: -60, right: -60, width: 160, height: 160, background: "rgba(220,38,38,0.07)", borderRadius: "50%", pointerEvents: "none" },
  planHeader: { marginBottom: 24 },
  planName: { fontSize: 11, letterSpacing: 4, color: "#888", display: "block", marginBottom: 8 },
  popularTag: { fontSize: 9, letterSpacing: 2, color: "#dc2626", border: "1px solid #dc2626", padding: "2px 6px" },
  planPrice: { fontSize: 32, fontWeight: 700, color: "#fff" },
  planPeriod: { fontSize: 12, color: "#888", marginLeft: 4 },
  featureList: { listStyle: "none", padding: 0, margin: "0 0 24px" },
  featureItem: { fontSize: 12, lineHeight: 2, color: "#ccc", letterSpacing: 0.5 },
  currentBadge: { textAlign: "center", fontSize: 10, letterSpacing: 3, color: "#555", border: "1px solid #333", padding: "6px 0", marginTop: 8 },
  methodSelector: { display: "flex", gap: 8, marginBottom: 14 },
  methodBtn: { flex: 1, padding: "10px 0", borderRadius: 4, border: "1px solid #333", background: "transparent", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: "pointer", transition: "all 0.15s" },
  methodBtnActive: { borderColor: "#dc2626", color: "#dc2626", background: "rgba(220,38,38,0.08)" },
  methodBtnPixActive: { borderColor: "#059669", color: "#059669", background: "rgba(5,150,105,0.08)" },
  methodDetail: { display: "flex", flexDirection: "column", gap: 10 },
  methodDetailText: { fontSize: 11, color: "#555", lineHeight: 1.6, letterSpacing: 0.3 },
  checkoutBtn: { width: "100%", background: "#dc2626", border: "none", color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: "14px 0", cursor: "pointer", borderRadius: 2 },
  secureNote: { textAlign: "center", fontSize: 10, color: "#555", margin: "0", letterSpacing: 0.3 },
  faq: { borderTop: "1px solid #222", paddingTop: 40 },
  faqTitle: { fontSize: 11, letterSpacing: 4, color: "#888", marginBottom: 24 },
  faqItem: { borderBottom: "1px solid #1a1a1a", paddingBottom: 4, marginBottom: 4 },
  faqQuestion: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: "#e5e5e5", fontFamily: "'Space Mono', monospace", fontSize: 12, textAlign: "left", padding: "14px 0", cursor: "pointer", lineHeight: 1.5 },
  faqAnswer: { fontSize: 11, color: "#888", lineHeight: 1.8, margin: "0 0 14px", letterSpacing: 0.3 },
};

const M = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 8, maxWidth: 520, width: "100%", padding: 32, position: "relative", maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#555", fontSize: 16, cursor: "pointer", fontFamily: "'Space Mono', monospace" },
  header: { textAlign: "center", marginBottom: 28 },
  warningIcon: { width: 52, height: 52, borderRadius: "50%", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22, color: "#dc2626" },
  title: { fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#888", lineHeight: 1.8, letterSpacing: 0.3 },
  lossesList: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 },
  lossItem: { display: "flex", gap: 14, alignItems: "flex-start", background: "#141414", border: "1px solid #1e1e1e", borderRadius: 6, padding: "12px 14px" },
  lossIcon: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  lossTitle: { fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#e5e5e5", marginBottom: 3, letterSpacing: 0.5 },
  lossDesc: { fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#666", lineHeight: 1.6 },
  confirmBox: { background: "#141414", border: "1px solid #1e1e1e", borderRadius: 6, padding: "16px 18px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 },
  confirmRow: { display: "flex", alignItems: "center", gap: 10 },
  confirmText: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#888" },
  footer: { display: "flex", flexDirection: "column", gap: 8 },
  keepBtn: { width: "100%", background: "#dc2626", border: "none", color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "14px 0", cursor: "pointer", borderRadius: 4 },
  continueBtn: { width: "100%", background: "transparent", border: "1px solid #333", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1, padding: "10px 0", cursor: "pointer", borderRadius: 4 },
  confirmBtn: { width: "100%", background: "transparent", border: "1px solid #dc2626", color: "#dc2626", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 1, padding: "12px 0", cursor: "pointer", borderRadius: 4 },
};