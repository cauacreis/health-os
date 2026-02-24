import { useState, useEffect } from 'react'
import { onAuthChange, getProfile, signOut } from './lib/db'
import { getTheme, setTheme as saveTheme, applyTheme } from './lib/theme'
import Auth from './pages/Auth'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import WorkoutProgram from './pages/WorkoutProgram'
import CalendarPage from './pages/Calendar'
import Calories from './pages/Calories'
import Profile from './pages/Profile'
import { Water, BMI, Cardio, Steps } from './pages/OtherPages'
import MoreMenu from './components/MoreMenu'
import { GlossaryPage, ThemeToggle } from './components/UI'

export default function App() {
  const [session, setSession]   = useState(undefined)
  const [profile, setProfile]   = useState(null)
  const [tab, setTab]           = useState('dashboard')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [theme, setThemeState]  = useState(() => getTheme())

  // Apply saved theme on mount
  useEffect(() => { applyTheme(theme) }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    saveTheme(next)
  }

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (sess) => {
      setSession(sess)
      if (sess?.user) {
        setLoadingProfile(true)
        try { setProfile(await getProfile(sess.user.id)) }
        catch(e) { console.error(e) }
        finally { setLoadingProfile(false) }
      } else { setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleLogout() { setSession(null); setProfile(null); setTab('dashboard') }

  if (session === undefined || loadingProfile) {
    return (
      <div style={{ minHeight:'100vh', minHeight:'100dvh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'var(--green)', fontSize:14, letterSpacing:4, marginBottom:20 }}>HEALTH OS</div>
          <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
            {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:`ping 1s ${i*0.2}s infinite` }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />
  if (!profile || !profile.age) return (
    <Onboarding userId={session.user.id} initialName={session.user.user_metadata?.name||''} onComplete={setProfile} />
  )

  const userId = session.user.id

  function renderTab() {
    switch(tab) {
      case 'dashboard':  return <Dashboard    user={profile} userId={userId} />
      case 'workout':    return <WorkoutProgram user={profile} userId={userId} />
      case 'calendar':   return <CalendarPage  user={profile} userId={userId} />
      case 'calories':   return <Calories      user={profile} userId={userId} onUpdate={setProfile} />
      case 'water':      return <Water         user={profile} userId={userId} onUpdate={setProfile} />
      case 'bmi':        return <BMI           user={profile} />
      case 'cardio':     return <Cardio        user={profile} userId={userId} />
      case 'steps':      return <Steps         user={profile} userId={userId} onUpdate={setProfile} />
      case 'profile':    return <Profile       user={profile} userId={userId} onUpdate={setProfile} />
      case 'glossary':   return <GlossaryPage />
      case 'more':       return <MoreMenu      setTab={setTab} user={profile} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      default: return null
    }
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', minHeight:'100dvh' }}>
      <Sidebar tab={tab} setTab={setTab} user={profile} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      <main style={{ flex:1, overflow:'auto', maxHeight:'100vh', maxHeight:'100dvh', background:'var(--bg)', position:'relative', padding:'clamp(12px,3vw,36px)', paddingBottom:'max(clamp(12px,3vw,36px), calc(72px + env(safe-area-inset-bottom)))' }}>
        <div style={{ position:'fixed', inset:0, opacity:0.012, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(var(--green) 1px,transparent 1px),linear-gradient(90deg,var(--green) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          {renderTab()}
        </div>
      </main>
      <MobileNav tab={tab} setTab={setTab} />
    </div>
  )
}

const BOTTOM = [
  { id:'dashboard', label:'Home',     icon:'◈' },
  { id:'workout',   label:'Treino',   icon:'⬡' },
  { id:'calories',  label:'Comida',   icon:'◉' },
  { id:'cardio',    label:'Cardio',   icon:'♡' },
  { id:'more',      label:'Mais',     icon:'≡' },
]

function MobileNav({ tab, setTab }) {
  return (
    <div id="mobile-nav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(6,6,8,0.97)', borderTop:'1px solid rgba(0,255,136,0.1)', paddingBottom:'max(8px, env(safe-area-inset-bottom))', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
      <div style={{ display:'flex', justifyContent:'space-around', paddingTop:8 }}>
        {BOTTOM.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 8px', background:'none', border:'none', cursor:'pointer', color:tab===item.id?'var(--green)':'#444', fontFamily:'monospace', fontSize:8, letterSpacing:1, textTransform:'uppercase', minWidth:52, transition:'color 0.15s', WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
