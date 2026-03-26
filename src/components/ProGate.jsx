// src/components/ProGate.jsx
// Componente que bloqueia conteúdo premium e mostra paywall.
// Uso: <ProGate isPro={user.is_pro} onUpgrade={() => setTab('subscription')}>
//         <ConteudoPro />
//      </ProGate>

const R = '#dc2626'
const R2 = '#ef4444'

export default function ProGate({ isPro, children, onUpgrade, label }) {
  if (isPro) return children

  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      {/* Conteúdo desfocado por baixo */}
      <div style={{ filter: 'blur(4px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Overlay de paywall */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,8,8,0.75)',
        backdropFilter: 'blur(2px)',
        borderRadius: 8,
        border: '1px solid rgba(220,38,38,0.2)',
        padding: '20px 16px',
        textAlign: 'center',
        gap: 10,
      }}>
        <div style={{ fontSize: 28 }}>🔒</div>
        <div style={{
          color: R, fontSize: 11, fontWeight: 700,
          letterSpacing: 3, fontFamily: "'Space Mono',monospace",
        }}>
          RECURSO PRO
        </div>
        {label && (
          <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>{label}</div>
        )}
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            style={{
              marginTop: 6,
              padding: '9px 22px',
              background: `${R}18`,
              border: `1px solid ${R}50`,
              borderRadius: 6,
              color: R2,
              fontFamily: "'Space Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${R}30` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${R}18` }}
          >
            VER PLANOS →
          </button>
        )}
      </div>
    </div>
  )
}