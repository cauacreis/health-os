import { useState, useEffect } from 'react'
import { onAuthChange, getProfile, signOut } from './lib/db'
import Auth from './pages/Auth'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import WorkoutProgram from './pages/WorkoutProgram'
import CalendarPage from './pages/Calendar'
import Calories from './pages/Calories'
import Profile from './pages/Profile'
import { Water, BMI, Cardio, Steps } from './pages/OtherPages'

export default function App() {
  const [session, setSession]   = useState(undefined) // undefined = loading
  const [profile, setProfile]   = useState(null)
  const [tab, setTab]           = useState('dashboard')
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Escuta mudanças de auth em tempo real
  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (sess) => {
      setSession(sess)
      if (sess?.user) {
        setLoadingProfile(true)
        try {
          const p = await getProfile(sess.user.id)
          setProfile(p)
        } catch (e) {
          console.error(e)
        } finally {
          setLoadingProfile(false)
        }
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await signOut()
    setSession(null)
    setProfile(null)
    setTab('dashboard')
  }

  function handleProfileUpdate(updated) {
    setProfile(updated)
  }

  // Loading inicial
  if (session === undefined || loadingProfile) {
    return (
      <div style={{ minHeight: '100vh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00ff88', fontSize: 14, letterSpacing: 4, marginBottom: 20 }}>HEALTH OS</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', animation: `ping 1s ${i*0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Não logado
  if (!session) return <Auth />

  // Logado mas sem perfil configurado (primeiro acesso)
  if (!profile || !profile.age) {
    return (
      <Onboarding
        userId={session.user.id}
        initialName={session.user.user_metadata?.name || ''}
        onComplete={(p) => setProfile(p)}
      />
    )
  }

  // App principal
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar tab={tab} setTab={setTab} user={profile} onLogout={handleLogout} />
      <main style={{ flex: 1, overflow: 'auto', maxHeight: '100vh', padding: '28px 36px', background: '#060608', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, opacity: 0.012, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {tab === 'dashboard' && <Dashboard  user={profile} userId={session.user.id} />}
          {tab === 'workout'   && <WorkoutProgram user={profile} userId={session.user.id} />}
          {tab === 'calendar'  && <CalendarPage   user={profile} userId={session.user.id} />}
          {tab === 'calories'  && <Calories       user={profile} userId={session.user.id} onUpdate={handleProfileUpdate} />}
          {tab === 'water'     && <Water          user={profile} userId={session.user.id} onUpdate={handleProfileUpdate} />}
          {tab === 'bmi'       && <BMI            user={profile} />}
          {tab === 'cardio'    && <Cardio         user={profile} userId={session.user.id} />}
          {tab === 'steps'     && <Steps          user={profile} userId={session.user.id} onUpdate={handleProfileUpdate} />}
          {tab === 'profile'   && <Profile        user={profile} userId={session.user.id} onUpdate={handleProfileUpdate} />}
        </div>
      </main>
    </div>
  )
}
