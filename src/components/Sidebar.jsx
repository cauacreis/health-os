import { signOut } from '../lib/db'

const NAV = [
  { id:'dashboard', label:'Dashboard',  icon:'◈' },
  { id:'workout',   label:'Treinos',    icon:'⬡' },
  { id:'calendar',  label:'Calendário', icon:'◫' },
  { id:'calories',  label:'Calorias',   icon:'◉' },
  { id:'water',     label:'Hidratação', icon:'◌' },
  { id:'meals',     label:'Refeições',  icon:'⬡' },
  { id:'bmi',       label:'IMC',        icon:'◎' },
  { id:'cardio',    label:'Cardio',     icon:'♡' },
  { id:'steps',     label:'Passos',     icon:'▷' },
  { id:'profile',   label:'Perfil',     icon:'◯' },
  { id:'glossary',  label:'Glossário',  icon:'?' },
]

export default function Sidebar({ tab, setTab, user, onLogout }) {
  async function handleLogout() { await signOut(); onLogout() }

  return (
    <aside className="sidebar-desktop" style={{ width:210, flexShrink:0, background:'rgba(5,5,5,0.98)', borderRight:'1px solid rgba(220,38,38,0.08)', display:'flex', flexDirection:'column', padding:'22px 10px', height:'100vh', height:'100dvh', position:'sticky', top:0, overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ paddingLeft:8, marginBottom:20 }}>
        <div style={{ color:'#dc2626', fontSize:16, fontWeight:700, letterSpacing:4 }}>HEALTH OS</div>
        <div style={{ color:'#2a2a2a', fontSize:8, letterSpacing:4, marginTop:3 }}>v2.5 · BIOMETRIC</div>
        <div style={{ marginTop:10, height:1, background:'linear-gradient(90deg,#dc2626,transparent)' }} />
      </div>

      {/* User badge */}
      <div style={{ background:'rgba(220,38,38,0.04)', border:'1px solid rgba(220,38,38,0.1)', borderRadius:7, padding:'10px 12px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            {user.photo_url
              ? <img src={user.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
              : <span style={{ color:'#dc2626', fontSize:14 }}>{(user.name||'?')[0].toUpperCase()}</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ color:'#d0d0d0', fontSize:11, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
            <div style={{ color:'#444', fontSize:9, marginTop:1 }}>{user.weight}kg · {user.height}cm</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:1, overflowY:'auto' }}>
        {NAV.map(item => {
          const active = tab === item.id
          return (
            <button key={item.id} onClick={()=>setTab(item.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:5, border:`1px solid ${active?'rgba(220,38,38,0.2)':'transparent'}`, background:active?'rgba(220,38,38,0.1)':'transparent', color:active?'#ef4444':'#444', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1.5, cursor:'pointer', textAlign:'left', textTransform:'uppercase', transition:'all 0.15s', borderLeft:active?'2px solid #dc2626':'2px solid transparent', WebkitTapHighlightColor:'transparent' }}>
              <span style={{ fontSize:13, opacity:active?1:0.5 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ paddingTop:10 }}>
        <div style={{ height:1, background:'rgba(255,255,255,0.04)', marginBottom:8 }} />
        <button onClick={handleLogout} style={{ width:'100%', padding:'8px 12px', background:'transparent', border:'1px solid rgba(220,38,38,0.12)', borderRadius:5, color:'#444', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, cursor:'pointer', textTransform:'uppercase', transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.borderColor='rgba(220,38,38,0.4)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='#444';e.currentTarget.style.borderColor='rgba(220,38,38,0.12)'}}>
          ← SAIR
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 4px 0' }}>
          <div style={{ width:4, height:4, borderRadius:'50%', background:'#dc2626', animation:'pulse-glow 2s infinite' }} />
          <span style={{ color:'#2a2a2a', fontSize:8, letterSpacing:1 }}>ONLINE</span>
        </div>
      </div>
    </aside>
  )
}
