import { signOut } from '../lib/db'

const ALL_PAGES = [
  { id:'dashboard', label:'Dashboard',  icon:'◈', color:'#dc2626' },
  { id:'workout',   label:'Treinos',    icon:'⬡', color:'#dc2626' },
  { id:'calendar',  label:'Calendário', icon:'◫', color:'#94a3b8' },
  { id:'calories',  label:'Calorias & Refeições', icon:'◉', color:'#f97316' },
  { id:'water',     label:'Hidratação', icon:'◌', color:'#94a3b8' },
  { id:'bmi',       label:'IMC',        icon:'◎', color:'#dc2626' },
  { id:'activity',  label:'Atividade',  icon:'♡', color:'#ef4444' },
  { id:'profile',   label:'Perfil',     icon:'◯', color:'#64748b' },
  { id:'glossary',  label:'Glossário',  icon:'?', color:'#94a3b8' },
]

export default function MoreMenu({ setTab, user, onLogout }) {
  async function handleLogout() { await signOut(); onLogout() }

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:20 }}>
        <div style={{ color:'#dc2626', fontSize:20, letterSpacing:4, fontWeight:700 }}>MENU</div>
        <div style={{ color:'#444', fontSize:9, letterSpacing:3, marginTop:4 }}>TODAS AS SEÇÕES</div>
      </div>

      {/* User card */}
      <div style={{ background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.1)', borderRadius:10, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          {user.photo_url
            ? <img src={user.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
            : <span style={{ color:'#dc2626', fontSize:20 }}>{(user.name||'?')[0].toUpperCase()}</span>}
        </div>
        <div>
          <div style={{ color:'#d0d0d0', fontSize:15, fontWeight:700 }}>{user.name}</div>
          <div style={{ color:'#555', fontSize:10, marginTop:2 }}>{user.weight}kg · {user.height}cm · {user.age}a</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {ALL_PAGES.map(p => (
          <button key={p.id} onClick={()=>setTab(p.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 6px', background:`${p.color}06`, border:`1px solid ${p.color}18`, borderRadius:8, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:1.5, color:p.color, textTransform:'uppercase', transition:'all 0.15s', WebkitTapHighlightColor:'transparent' }}
            onMouseEnter={e=>e.currentTarget.style.background=`${p.color}14`}
            onMouseLeave={e=>e.currentTarget.style.background=`${p.color}06`}>
            <span style={{ fontSize:22 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      <button onClick={handleLogout} style={{ width:'100%', padding:14, background:'transparent', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, color:'#ef4444', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, cursor:'pointer', textTransform:'uppercase' }}>
        ← SAIR DA CONTA
      </button>
    </div>
  )
}
