// src/components/ProGate.jsx
// Uso: <ProGate isPro={user.isPro}> ... conteúdo PRO ... </ProGate>

const R = '#dc2626'

export default function ProGate({ isPro, children, feature = 'este recurso' }) {
  if (isPro) return children

  return (
    <div style={{ position: 'relative', minHeight: 320 }}>
      {/* Conteúdo borrado atrás */}
      <div style={{ filter: 'blur(6px)', opacity: 0.25, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Overlay de lock */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 32,
        background: 'rgba(8,8,8,0.7)',
        backdropFilter: 'blur(2px)',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
        }}>🔒</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: '#e5e5e5', marginBottom: 6, letterSpacing: 1 }}>
            RECURSO PRO
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#555', lineHeight: 1.7, maxWidth: 280 }}>
            {feature} está disponível apenas no plano Pro. Assine e desbloqueie acesso completo ao Health OS.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 260 }}>
          <a href="?tab=subscription" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('goto-tab', { detail: 'subscription' })) }}
            style={{
              display: 'block', textAlign: 'center',
              background: R, border: 'none', color: '#fff',
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: 2, padding: '12px 0',
              borderRadius: 4, cursor: 'pointer', textDecoration: 'none',
            }}>
            ⚡ VER PLANOS →
          </a>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#333', textAlign: 'center', letterSpacing: 1 }}>
            R$ 19,90/mês · cancele quando quiser
          </div>
        </div>
      </div>
    </div>
  )
}
