import { signOut } from '../lib/db'

// ── Navigation groups ─────────────────────────────────────────────────────────
const NAV_PRIMARY = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'workout', label: 'Treinos', icon: '💪' },
  { id: 'calendar', label: 'Agenda', icon: '📒' },
  { id: 'calories', label: 'Dieta', icon: '🍽️' },
  { id: 'chat', label: 'Chat IA', icon: '🤖' },
]

const NAV_HEALTH = [
  { id: 'water', label: 'Hidratação', icon: '💧' },
  { id: 'bmi', label: 'IMC', icon: '⚖️' },
  { id: 'activity', label: 'Atividade', icon: '🏃' },
]

const NAV_OTHER = [
  { id: 'profile', label: 'Perfil', icon: '👤' },
  { id: 'subscription', label: 'Planos', icon: '💎' },
  { id: 'glossary', label: 'Glossário', icon: '📖' },
]

function NavButton({ item, active, setTab }) {
  return (
    <button
      onClick={() => setTab(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        borderRadius: 5, border: `1px solid ${active ? 'rgba(220,38,38,0.2)' : 'transparent'}`,
        background: active ? 'rgba(220,38,38,0.1)' : 'transparent',
        color: active ? '#ef4444' : '#444',
        fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 1.5,
        cursor: 'pointer', textAlign: 'left', textTransform: 'uppercase',
        transition: 'all 0.15s', borderLeft: `2px solid ${active ? '#dc2626' : 'transparent'}`,
        WebkitTapHighlightColor: 'transparent', width: '100%',
      }}
    >
      <span style={{ fontSize: 12, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
      {item.label}
    </button>
  )
}

// Trial days remaining helper
function trialDaysLeft(profile) {
  if (profile?.is_premium) return null
  const start = profile?.trial_start_date ? new Date(profile.trial_start_date) : null
  if (!start) return null
  const diff = 30 - Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export default function Sidebar({ tab, setTab, user, onLogout }) {
  async function handleLogout() { await signOut(); onLogout() }

  const daysLeft = trialDaysLeft(user)
  const showTrialBanner = daysLeft !== null && daysLeft <= 10

  return (
    <aside
      className="sidebar-desktop"
      style={{
        width: 200, flexShrink: 0,
        background: 'rgba(5,5,5,0.98)',
        borderRight: '1px solid rgba(220,38,38,0.08)',
        display: 'flex', flexDirection: 'column',
        padding: '18px 8px', height: '100vh', height: '100dvh',
        position: 'sticky', top: 0, overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ paddingLeft: 8, marginBottom: 18 }}>
        <div style={{ color: '#dc2626', fontSize: 15, fontWeight: 700, letterSpacing: 4 }}>HEALTH OS</div>
        <div style={{ color: '#1e1e1e', fontSize: 7, letterSpacing: 4, marginTop: 2 }}>v2.5 · BIOMETRIC</div>
        <div style={{ marginTop: 10, height: 1, background: 'linear-gradient(90deg,#dc2626,transparent)' }} />
      </div>

      {/* User badge */}
      <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.1)', borderRadius: 7, padding: '8px 10px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {user.photo_url
              ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              : <span style={{ color: '#dc2626', fontSize: 13 }}>{(user.name || '?')[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#d0d0d0', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: '#444', fontSize: 9, marginTop: 1 }}>{user.weight}kg · {user.age}a</div>
          </div>
        </div>
      </div>

      {/* Trial banner */}
      {showTrialBanner && (
        <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
          <div style={{ color: '#ca8a04', fontSize: 9, letterSpacing: 1, fontWeight: 700 }}>⏳ TRIAL</div>
          <div style={{ color: '#555', fontSize: 9, marginTop: 2 }}>
            {daysLeft === 0 ? 'Expirou hoje' : `${daysLeft} dias restantes`}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
        {/* Primary */}
        <div style={{ marginBottom: 12 }}>
          {NAV_PRIMARY.map(item => (
            <NavButton key={item.id} item={item} active={tab === item.id} setTab={setTab} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 8px 10px' }} />
        <div style={{ color: '#222', fontSize: 7, letterSpacing: 3, paddingLeft: 12, marginBottom: 6 }}>SAÚDE</div>

        <div style={{ marginBottom: 12 }}>
          {NAV_HEALTH.map(item => (
            <NavButton key={item.id} item={item} active={tab === item.id} setTab={setTab} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 8px 10px' }} />
        <div style={{ color: '#222', fontSize: 7, letterSpacing: 3, paddingLeft: 12, marginBottom: 6 }}>OUTROS</div>

        <div>
          {NAV_OTHER.map(item => (
            <NavButton key={item.id} item={item} active={tab === item.id} setTab={setTab} />
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div style={{ paddingTop: 8 }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '7px 12px', background: 'transparent', border: '1px solid rgba(220,38,38,0.12)', borderRadius: 5, color: '#444', fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.12)' }}
        >
          ← SAIR
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 4px 0' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#dc2626', animation: 'pulse-glow 2s infinite' }} />
          <span style={{ color: '#1e1e1e', fontSize: 7, letterSpacing: 1 }}>ONLINE</span>
        </div>
      </div>
    </aside>
  )
}