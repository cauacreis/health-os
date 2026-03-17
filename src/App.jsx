import { useState, useEffect, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { onAuthChange, getProfile, getSubscription, signOut } from './lib/db'
import Auth from './pages/Auth'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import WorkoutProgram from './pages/WorkoutProgram'
import CalendarPage from './pages/Calendar'
import Calories from './pages/Calories'
import Profile from './pages/Profile'
import { Water, BMI, CardioSteps } from './pages/OtherPages'
import MoreMenu from './components/MoreMenu'
import { GlossaryPage } from './components/UI'
import Subscription from "./pages/Subscription"
import Chat from './pages/Chat'

export default function App() {
  const [session, setSession]   = useState(undefined)
  const [profile, setProfile]   = useState(null)
  const [tab, setTab]           = useState('dashboard')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const fetchingRef = useRef(false) // guard contra fetches duplicados

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (sess) => {
      setSession(sess)
      if (sess?.user) {
        // Se já está buscando ou já temos o perfil desse usuário, ignora
        if (fetchingRef.current) return
        setProfile(prev => {
          if (prev?.id === sess.user.id) return prev // mesmo usuário, mantém
          return null
        })

        fetchingRef.current = true
        setLoadingProfile(true)
        try {
          const prof = await getProfile(sess.user.id)
          const sub  = await getSubscription(sess.user.id)
          const isPro = sub?.plan === 'pro' && sub?.status === 'active'
          setProfile({ ...prof, isPro })
        }
        catch(e) { console.error(e) }
        finally {
          setLoadingProfile(false)
          fetchingRef.current = false
        }
      } else {
        setProfile(null)
        fetchingRef.current = false
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = e => setTab(e.detail)
    window.addEventListener('goto-tab', handler)
    return () => window.removeEventListener('goto-tab', handler)
  }, [])

  function handleLogout() { setSession(null); setProfile(null); setTab('dashboard') }

  if (session === undefined || loadingProfile) {
    return (
      <div style={{ minHeight:'100dvh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace" }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#dc2626', fontSize:13, letterSpacing:4, marginBottom:20 }}>HEALTH OS</div>
          <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
            {[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#dc2626', animation:`ping 1s ${i*0.2}s infinite` }} />)}
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
      case 'chat':         return <Chat           user={profile} userId={userId} />
      case 'dashboard':    return <Dashboard      user={profile} userId={userId} />
      case 'workout':      return <WorkoutProgram user={profile} userId={userId} />
      case 'calendar':     return <CalendarPage   user={profile} userId={userId} />
      case 'calories':     return <Calories       user={profile} userId={userId} onUpdate={setProfile} />
      case 'water':        return <Water          user={profile} userId={userId} />
      case 'bmi':          return <BMI            user={profile} />
      case 'activity': case 'cardio': case 'steps': return <CardioSteps user={profile} userId={userId} onUpdate={setProfile} />
      case 'profile':      return <Profile        user={profile} userId={userId} onUpdate={setProfile} />
      case 'glossary':     return <GlossaryPage />
      case 'subscription': return <Subscription />
      case 'more':         return <MoreMenu       setTab={setTab} user={profile} onLogout={handleLogout} />
      default: return null
    }
  }

  return (
    <>
      <div style={{ display:'flex', minHeight:'100dvh' }}>
        <Sidebar tab={tab} setTab={setTab} user={profile} onLogout={handleLogout} />
        <main style={{ flex:1, overflow:'auto', maxHeight:'100dvh', background:'#080808', position:'relative', padding:'clamp(14px,3vw,32px)', paddingBottom:'max(clamp(14px,3vw,32px), calc(72px + env(safe-area-inset-bottom)))' }}>
          <div style={{ position:'fixed', inset:0, opacity:0.015, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(#dc2626 1px,transparent 1px),linear-gradient(90deg,#dc2626 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
          <div style={{ position:'relative', zIndex:1 }}>{renderTab()}</div>
        </main>
        <MobileNav tab={tab} setTab={setTab} />
      </div>
      <Analytics />
    </>
  )
}

const BOTTOM = [
  { id:'chat',      label:'IA',        icon:'◎' },
  { id:'dashboard', label:'Home',      icon:'◈' },
  { id:'workout',   label:'Treino',    icon:'⬡' },
  { id:'calories',  label:'Comida',    icon:'◉' },
  { id:'activity',  label:'Atividade', icon:'♡' },
  { id:'more',      label:'Mais',      icon:'≡' },
]

function MobileNav({ tab, setTab }) {
  return (
    <div id="mobile-nav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(5,5,5,0.98)', borderTop:'1px solid rgba(220,38,38,0.1)', paddingBottom:'max(8px, env(safe-area-inset-bottom))', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
      <div style={{ display:'flex', justifyContent:'space-around', paddingTop:8 }}>
        {BOTTOM.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 8px', background:'none', border:'none', cursor:'pointer', color:tab===item.id?'#ef4444':'#333', fontFamily:"'Space Mono',monospace", fontSize:7, letterSpacing:1, textTransform:'uppercase', minWidth:52, transition:'color 0.15s', WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}