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
import { Water, BMI, CardioSteps } from './pages/OtherPages'
import MoreMenu from './components/MoreMenu'
import { GlossaryPage } from './components/UI'

// ── Trial helpers ─────────────────────────────────────────────────────────────
export function isTrialActive(profile) {
  if (!profile) return false
  if (profile.is_premium) return true
  const start = profile.trial_start_date ? new Date(profile.trial_start_date) : null
  if (!start) return true                                      // no date = fresh user, allow
  const diffDays = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 30
}

export function trialDaysLeft(profile) {
  if (profile?.is_premium) return null
  const start = profile?.trial_start_date ? new Date(profile.trial_start_date) : null
  if (!start) return 30
  return Math.max(0, 30 - Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

// ── Bottom nav items — max 4 + more ──────────────────────────────────────────
const BOTTOM = [
  { id: 'dashboard', label: 'Home', icon: '◈' },
  { id: 'workout', label: 'Treino', icon: '⬡' },
  { id: 'calories', label: 'Dieta', icon: '◉' },
  { id: 'more', label: 'Mais', icon: '≡' },
]

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [trialExpired, setTrialExpired] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (sess) => {
      setSession(sess)
      if (sess?.user) {
        setLoadingProfile(true)
        try {
          const p = await getProfile(sess.user.id)
          setProfile(p)
          if (p && !isTrialActive(p)) setTrialExpired(true)
        } catch (e) { console.error(e) }
        finally { setLoadingProfile(false) }
      } else { setProfile(null); setTrialExpired(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleLogout() { setSession(null); setProfile(null); setTab('dashboard') }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (session === undefined || loadingProfile) {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono',monospace" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#dc2626', fontSize: 13, letterSpacing: 4, marginBottom: 20 }}>HEALTH OS</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', animation: `ping 1s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />

  if (!profile || !profile.age) {
    return (
      <Onboarding
        userId={session.user.id}
        initialName={session.user.user_metadata?.name || ''}
        onComplete={setProfile}
      />
    )
  }

  const userId = session.user.id

  function renderTab() {
    switch (tab) {
      case 'dashboard': return <Dashboard user={profile} userId={userId} onNavigate={setTab} />
      case 'workout': return <WorkoutProgram user={profile} userId={userId} />
      case 'calendar': return <CalendarPage user={profile} userId={userId} />
      case 'calories': return <Calories user={profile} userId={userId} onUpdate={setProfile} />
      case 'water': return <Water user={profile} userId={userId} />
      case 'bmi': return <BMI user={profile} />
      case 'activity': case 'cardio': case 'steps':
        return <CardioSteps user={profile} userId={userId} onUpdate={setProfile} />
      case 'profile': return <Profile user={profile} userId={userId} onUpdate={setProfile} />
      case 'glossary': return <GlossaryPage />
      case 'more': return <MoreMenu setTab={setTab} user={profile} onLogout={handleLogout} />
      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minHeight: '100dvh' }}>
      <Sidebar tab={tab} setTab={setTab} user={profile} onLogout={handleLogout} />

      <main style={{
        flex: 1, overflow: 'auto', maxHeight: '100vh', maxHeight: '100dvh',
        background: '#080808', position: 'relative',
        padding: 'clamp(14px,3vw,32px)',
        paddingBottom: 'max(clamp(14px,3vw,32px), calc(72px + env(safe-area-inset-bottom)))',
      }}>
        {/* Grid background */}
        <div style={{ position: 'fixed', inset: 0, opacity: 0.015, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(#dc2626 1px,transparent 1px),linear-gradient(90deg,#dc2626 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Trial expired banner */}
        {trialExpired && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 50, marginBottom: 16,
            background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: 8, padding: '10px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#ca8a04', fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>
                ⏳ PERÍODO DE TESTE ENCERRADO
              </div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                Assine para continuar acessando todos os recursos.
              </div>
            </div>
            <button
              onClick={() => setTab('profile')}
              style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 6, color: '#ca8a04', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: 'pointer', padding: '7px 14px', whiteSpace: 'nowrap' }}
            >
              VER PLANOS →
            </button>
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>{renderTab()}</div>
      </main>

      <MobileNav tab={tab} setTab={setTab} />
    </div>
  )
}

// ── Mobile bottom nav — 4 items only ─────────────────────────────────────────
function MobileNav({ tab, setTab }) {
  return (
    <div
      id="mobile-nav"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5,5,5,0.98)',
        borderTop: '1px solid rgba(220,38,38,0.1)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 8 }}>
        {BOTTOM.map(item => {
          const active = tab === item.id || (item.id === 'more' && !BOTTOM.slice(0, -1).find(b => b.id === tab))
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer',
                color: active ? '#ef4444' : '#333',
                fontFamily: "'Space Mono',monospace", fontSize: 7, letterSpacing: 1,
                textTransform: 'uppercase', minWidth: 52, transition: 'color 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
              {/* active dot */}
              {active && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', marginTop: -2, animation: 'pulse-glow 2s infinite' }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}