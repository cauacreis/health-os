import { signOut } from '../lib/db'
import { ThemeToggle } from './UI'

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
  { id:'glossary',  label:'Glossário',  icon:'?' },
]

export default function Sidebar({ tab, setTab, user, onLogout, theme, onToggleTheme }) {
  async function handleLogout() { await signOut(); onLogout() }

  return (
    <aside className="sidebar-desktop" style={{ width:216, flexShrink:0, background:'var(--sidebar-bg)', borderRight:'1px solid var(--sidebar-border)', display:'flex', flexDirection:'column', padding:'24px 12px', height:'100vh', height:'100dvh', position:'sticky', top:0, overflow:'hidden' }}>
      <div style={{ paddingLeft:8, marginBottom:22 }}>
        <div style={{ color:'var(--green)', fontSize:17, fontWeight:700, letterSpacing:4 }}>HEALTH OS</div>
        <div style={{ color:'var(--cyan)', fontSize:9, letterSpacing:5, marginTop:2 }}>v2.5</div>
        <div style={{ marginTop:10, height:1, background:'linear-gradient(90deg,var(--green),transparent)' }} />
      </div>

      {/* User */}
      <div style={{ background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.1)', borderRadius:8, padding:'10px 12px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            {user.photo_url
              ? <img src={user.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
              : <span style={{ color:'var(--green)', fontSize:15 }}>{(user.name||'?')[0].toUpperCase()}</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ color:'var(--text)', fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
            <div style={{ color:'var(--muted)', fontSize:9, marginTop:1 }}>{user.weight}kg · {user.height}cm</div>
          </div>
        </div>
      </div>

      {/* Theme toggle */}
      <div style={{ marginBottom:12, paddingLeft:4 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {NAV.map(item => {
          const active = tab === item.id
          return (
            <button key={item.id} onClick={()=>setTab(item.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:6, border:active?'1px solid rgba(0,255,136,0.15)':'1px solid transparent', background:active?'rgba(0,255,136,0.1)':'transparent', color:active?'var(--green)':'var(--muted)', fontFamily:'monospace', fontSize:10, letterSpacing:1.5, cursor:'pointer', textAlign:'left', textTransform:'uppercase', transition:'all 0.15s', borderLeft:active?'2px solid var(--green)':'2px solid transparent', WebkitTapHighlightColor:'transparent' }}>
              <span style={{ fontSize:14, opacity:active?1:0.5 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ paddingTop:12 }}>
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', marginBottom:10 }} />
        <button onClick={handleLogout} style={{ width:'100%', padding:'9px 12px', background:'transparent', border:'1px solid rgba(255,107,107,0.15)', borderRadius:6, color:'var(--muted)', fontFamily:'monospace', fontSize:9, letterSpacing:2, cursor:'pointer', textTransform:'uppercase', transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.borderColor='rgba(255,107,107,0.4)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.borderColor='rgba(255,107,107,0.15)'}}>
          ← SAIR
        </button>
      </div>
    </aside>
  )
}
