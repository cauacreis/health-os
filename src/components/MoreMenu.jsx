import { signOut } from '../lib/db'
import { trialDaysLeft } from '../lib/Trial.js'

const ALL_PAGES = [
  { id: 'water', label: 'Água', icon: '💧', color: '#94a3b8' },
  { id: 'bmi', label: 'IMC', icon: '⚖️', color: '#dc2626' },
  { id: 'activity', label: 'Atividade', icon: '❤️', color: '#ef4444' },
  { id: 'calendar', label: 'Calendário', icon: '📅', color: '#94a3b8' },
  { id: 'profile', label: 'Perfil', icon: '👤', color: '#64748b' },
  { id: 'glossary', label: 'Glossário', icon: '📖', color: '#94a3b8' },
  { id: 'subscription', label: 'Planos', icon: '💎', color: '#dc2626' },
]

export default function MoreMenu({ setTab, user, onLogout }) {
  async function handleLogout() { await signOut(); onLogout() }

  const daysLeft = trialDaysLeft(user)
  const showTrial = !user?.is_premium && daysLeft !== null

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#dc2626', fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>MENU</div>
        <div style={{ color: '#444', fontSize: 9, letterSpacing: 3, marginTop: 4 }}>TODAS AS SEÇÕES</div>
      </div>

      {/* User card */}
      <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.1)', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {user.photo_url
            ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            : <span style={{ color: '#dc2626', fontSize: 20 }}>{(user.name || '?')[0].toUpperCase()}</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#d0d0d0', fontSize: 15, fontWeight: 700 }}>{user.name}</div>
          <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{user.weight}kg · {user.height}cm · {user.age}a</div>
        </div>
        {showTrial && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#ca8a04', fontSize: 8, letterSpacing: 1 }}>TRIAL</div>
            <div style={{ color: '#555', fontSize: 9 }}>{daysLeft}d</div>
          </div>
        )}
      </div>

      {/* Trial progress bar */}
      {showTrial && (
        <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#ca8a04', fontSize: 10, letterSpacing: 1 }}>PERÍODO GRATUITO</span>
            <span style={{ color: '#555', fontSize: 10 }}>{daysLeft} / 30 dias</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
            <div style={{ width: `${(daysLeft / 30) * 100}%`, height: '100%', background: 'rgba(234,179,8,0.6)', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
          {daysLeft <= 5 && (
            <div style={{ color: '#ca8a04', fontSize: 10, marginTop: 6 }}>
              ⚠ Quase acabando! Assine para não perder acesso.
            </div>
          )}
        </div>
      )}

      {/* Grid 3×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {ALL_PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setTab(p.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '16px 6px',
              background: `${p.color}06`, border: `1px solid ${p.color}18`,
              borderRadius: 10, cursor: 'pointer', fontFamily: "'Space Mono',monospace",
              fontSize: 8, letterSpacing: 1.5, color: p.color, textTransform: 'uppercase',
              transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${p.color}14`; e.currentTarget.style.borderColor = `${p.color}35` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${p.color}06`; e.currentTarget.style.borderColor = `${p.color}18` }}
          >
            <span style={{ fontSize: 26 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{ width: '100%', padding: 14, background: 'transparent', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: '#ef4444', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 3, cursor: 'pointer', textTransform: 'uppercase' }}
      >
        ← SAIR DA CONTA
      </button>
    </div>
  )
}