import { signOut } from '../lib/db'

const ALL_PAGES = [
  { id:'dashboard', label:'Dashboard',  icon:'◈', color:'#00ff88' },
  { id:'workout',   label:'Treinos',    icon:'⬡', color:'#00ff88' },
  { id:'calendar',  label:'Calendário', icon:'◫', color:'#00d4ff' },
  { id:'calories',  label:'Calorias',   icon:'◉', color:'#ff9f43' },
  { id:'water',     label:'Hidratação', icon:'◌', color:'#00d4ff' },
  { id:'bmi',       label:'IMC',        icon:'◎', color:'#00ff88' },
  { id:'cardio',    label:'Cardio',     icon:'♡', color:'#ff6b6b' },
  { id:'steps',     label:'Passos',     icon:'▷', color:'#f7c59f' },
  { id:'profile',   label:'Perfil',     icon:'◯', color:'#4ecdc4' },
]

export default function MoreMenu({ setTab, user, onLogout }) {
  async function handleLogout() {
    await signOut()
    onLogout()
  }

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#00ff88', fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>MENU</div>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>TODAS AS SEÇÕES</div>
      </div>

      {/* User card */}
      <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {user.photo_url
            ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
            : <span style={{ color: '#00ff88', fontSize: 22 }}>{(user.name||'?')[0].toUpperCase()}</span>
          }
        </div>
        <div>
          <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 700 }}>{user.name}</div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{user.weight}kg · {user.height}cm · {user.age}a</div>
        </div>
      </div>

      {/* Grid de páginas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {ALL_PAGES.map(p => (
          <button key={p.id} onClick={() => setTab(p.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '16px 8px',
            background: `${p.color}06`, border: `1px solid ${p.color}20`, borderRadius: 10,
            cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
            letterSpacing: 1.5, color: p.color, textTransform: 'uppercase',
            transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${p.color}14`}
          onMouseLeave={e => e.currentTarget.style.background = `${p.color}06`}>
            <span style={{ fontSize: 26 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{
        width: '100%', padding: 14, background: 'transparent',
        border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8,
        color: '#ff6b6b', fontFamily: 'monospace', fontSize: 11,
        letterSpacing: 3, cursor: 'pointer', textTransform: 'uppercase',
        WebkitTapHighlightColor: 'transparent',
      }}>
        ← SAIR DA CONTA
      </button>
    </div>
  )
}
