import { useState, useEffect } from 'react'
import { onAuthChange, getProfile, signOut } from './lib/db'
import Auth from './pages/Auth'
import Onboarding from './components/Onboarding'
import Sidebar, { BottomNav } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import WorkoutProgram from './pages/WorkoutProgram'
import CalendarPage from './pages/Calendar'
import Calories from './pages/Calories'
import Profile from './pages/Profile'
import { Water, BMI, Cardio, Steps } from './pages/OtherPages'

// More pages reachable from mobile "..." menu
import MoreMenu from './components/MoreMenu'

export default function App() {
  const [session, setSession]       = useState(undefined)
  const [profile, setProfile]       = useState(null)
  const [tab, setTab]               = useState('dashboard')
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (sess) => {
      setSession(sess)
      if (sess?.user) {
        setLoadingProfile(true)
        try { setProfile(await getProfile(sess.user.id)) }
        catch (e) { console.error(e) }
        finally { setLoadingProfile(false) }
      } else { setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleLogout() { setSession(null); setProfile(null); setTab('dashboard') }
  function handleProfileUpdate(updated) { setProfile(updated) }

  if (session === undefined || loadingProfile) {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00ff88', fontSize: 14, letterSpacing: 4, marginBottom: 20 }}>HEALTH OS</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', animation: `ping 1s ${i*0.2}s infinite` }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />
  if (!profile || !profile.age) return <Onboarding userId={session.user.id} initialName={session.user.user_metadata?.name || ''} onComplete={setProfile} />

  const userId = session.user.id

  function renderTab() {
    switch(tab) {
      case 'dashboard': return <Dashboard   user={profile} userId={userId} />
      case 'workout':   return <WorkoutProgram user={profile} userId={userId} />
      case 'calendar':  return <CalendarPage user={profile} userId={userId} />
      case 'calories':  return <Calories    user={profile} userId={userId} onUpdate={handleProfileUpdate} />
      case 'water':     return <Water       user={profile} userId={userId} onUpdate={handleProfileUpdate} />
      case 'bmi':       return <BMI         user={profile} />
      case 'cardio':    return <Cardio      user={profile} userId={userId} />
      case 'steps':     return <Steps       user={profile} userId={userId} onUpdate={handleProfileUpdate} />
      case 'profile':   return <Profile     user={profile} userId={userId} onUpdate={handleProfileUpdate} />
      case 'more':      return <MoreMenu    tab={tab} setTab={setTab} user={profile} onLogout={handleLogout} />
      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minHeight: '100dvh' }}>
      {/* Desktop sidebar */}
      <Sidebar tab={tab} setTab={setTab} user={profile} onLogout={handleLogout} />

      {/* Main content */}
      <main style={{
        flex: 1, overflow: 'auto',
        maxHeight: '100vh', maxHeight: '100dvh',
        background: '#060608', position: 'relative',
        padding: 'clamp(12px, 3vw, 36px)',
        paddingBottom: 'max(clamp(12px,3vw,36px), calc(72px + env(safe-area-inset-bottom)))',
      }}>
        <div style={{ position: 'fixed', inset: 0, opacity: 0.012, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {renderTab()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav tab={tab} setTab={setTab} />
    </div>
  )
}

// ── Mobile bottom navigation ─────────────────────────────────────────────────
const BOTTOM = [
  { id:'dashboard', label:'Home',    icon:'◈' },
  { id:'workout',   label:'Treino',  icon:'⬡' },
  { id:'calories',  label:'Comida',  icon:'◉' },
  { id:'cardio',    label:'Cardio',  icon:'♡' },
  { id:'more',      label:'Mais',    icon:'≡' },
]

function MobileNav({ tab, setTab }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(6,6,8,0.97)',
      borderTop: '1px solid rgba(0,255,136,0.1)',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}
    // Hide on desktop via inline media — JS-based detection
    id="mobile-nav">
      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 8 }}>
        {BOTTOM.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === item.id ? '#00ff88' : '#444',
            fontFamily: 'monospace', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase',
            minWidth: 52, transition: 'color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <style>{`
        @media (min-width: 769px) { #mobile-nav { display: none !important; } }
        .sidebar-desktop { display: flex; }
        @media (max-width: 768px) { .sidebar-desktop { display: none !important; } }
      `}</style>
    </div>
  )
}
