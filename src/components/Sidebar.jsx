import { useState } from 'react'
import { signOut } from '../lib/db'

const NAV = [
  { id:'dashboard', label:'Dashboard',  icon:'◈' },
  { id:'workout',   label:'Treinos',    icon:'⬡' },
  { id:'calendar',  label:'Calendário', icon:'◫' },
  { id:'calories',  label:'Calorias',   icon:'◉' },
  { id:'water',     label:'Hidratação', icon:'◌' },
  { id:'bmi',       label:'IMC',        icon:'◎' },
  { id:'cardio',    label:'Cardio',     icon:'♡' },
  { id:'steps',     label:'Passos',     icon:'▷' },
  { id:'profile',   label:'Perfil',     icon:'◯' },
]

// Bottom navigation — mostra os 5 principais no mobile
const BOTTOM_NAV = [
  { id:'dashboard', label:'Home',    icon:'◈' },
  { id:'workout',   label:'Treino',  icon:'⬡' },
  { id:'calories',  label:'Comida',  icon:'◉' },
  { id:'cardio',    label:'Cardio',  icon:'♡' },
  { id:'profile',   label:'Perfil',  icon:'◯' },
]

export function BottomNav({ tab, setTab }) {
  return (
    <div style={{
      display: 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(6,6,8,0.97)',
      borderTop: '1px solid rgba(0,255,136,0.1)',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}
    className="bottom-nav-container"
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 8 }}>
        {BOTTOM_NAV.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === item.id ? '#00ff88' : '#444',
              fontFamily: 'monospace', fontSize: 8, letterSpacing: 1,
              textTransform: 'uppercase', minWidth: 44,
              WebkitTapHighlightColor: 'transparent', transition: 'color 0.15s',
            }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Sidebar({ tab, setTab, user, onLogout }) {
  async function handleLogout() {
    await signOut()
    onLogout()
  }

  return (
    <aside style={{
      width: 216, flexShrink: 0,
      background: 'rgba(0,0,0,0.85)',
      borderRight: '1px solid rgba(0,255,136,0.07)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 12px',
      height: '100vh', height: '100dvh',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}
    className="sidebar-desktop"
    >
      <div style={{ paddingLeft: 8, marginBottom: 22 }}>
        <div style={{ color: '#00ff88', fontSize: 17, fontWeight: 700, letterSpacing: 4 }}>HEALTH OS</div>
        <div style={{ color: '#00d4ff', fontSize: 9, letterSpacing: 5, marginTop: 2 }}>v2.5</div>
        <div style={{ marginTop: 10, height: 1, background: 'linear-gradient(90deg,#00ff88,transparent)' }} />
      </div>

      {/* User badge */}
      <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {user.photo_url
              ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
              : <span style={{ color: '#00ff88', fontSize: 15 }}>{(user.name||'?')[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#e0e0e0', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: '#444', fontSize: 9, letterSpacing: 1, marginTop: 1 }}>{user.weight}kg · {user.height}cm</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = tab === item.id
          return (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 6, border: active ? '1px solid rgba(0,255,136,0.15)' : '1px solid transparent', background: active ? 'rgba(0,255,136,0.1)' : 'transparent', color: active ? '#00ff88' : '#555', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, cursor: 'pointer', textAlign: 'left', textTransform: 'uppercase', transition: 'all 0.15s', borderLeft: active ? '2px solid #00ff88' : '2px solid transparent', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ paddingTop: 12 }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 6, color: '#444', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.color='#ff6b6b'; e.currentTarget.style.borderColor='rgba(255,107,107,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.color='#444'; e.currentTarget.style.borderColor='rgba(255,107,107,0.15)' }}>
          ← SAIR
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px 0' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', animation: 'pulse-glow 2s infinite' }} />
          <span style={{ color: '#333', fontSize: 9, letterSpacing: 1 }}>ONLINE</span>
        </div>
      </div>
    </aside>
  )
}
