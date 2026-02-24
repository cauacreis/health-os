import { useState, useEffect } from 'react'
import { getUsers, getActiveUserId, getUserById } from './lib/storage'
import UserSelect from './components/UserSelect'
import AddUser from './components/AddUser'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import WorkoutProgram from './pages/WorkoutProgram'
import CalendarPage from './pages/Calendar'
import Calories from './pages/Calories'
import Profile from './pages/Profile'
import { Water, BMI, Cardio, Steps } from './pages/OtherPages'

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    const activeId = getActiveUserId()
    const active = activeId ? getUserById(activeId) : null
    if (active) { setUser(active); setScreen('app') }
    else setScreen('select')
  }, [])

  function handleUserSelected(u) { setUser(u); setScreen('app'); setTab('dashboard') }
  function handleLogout() { setUser(null); setScreen('select'); setTab('dashboard') }
  function handleUserUpdate(updated) { setUser(updated) }

  if (screen === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#060608', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', color:'#00ff88', letterSpacing:4, fontSize:12 }}>
      INICIANDO...
    </div>
  )
  if (screen === 'select') return <UserSelect onSelect={handleUserSelected} onAdd={() => setScreen('add')} />
  if (screen === 'add') return <AddUser onCreated={handleUserSelected} onBack={() => setScreen('select')} />

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />
      <main style={{ flex:1, overflow:'auto', maxHeight:'100vh', padding:'28px 36px', background:'#060608', position:'relative' }}>
        <div style={{ position:'fixed', inset:0, opacity:0.012, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          {tab==='dashboard' && <Dashboard user={user} />}
          {tab==='workout'   && <WorkoutProgram user={user} />}
          {tab==='calendar'  && <CalendarPage user={user} />}
          {tab==='calories'  && <Calories user={user} onUpdate={handleUserUpdate} />}
          {tab==='water'     && <Water user={user} onUpdate={handleUserUpdate} />}
          {tab==='bmi'       && <BMI user={user} />}
          {tab==='cardio'    && <Cardio user={user} />}
          {tab==='steps'     && <Steps user={user} onUpdate={handleUserUpdate} />}
          {tab==='profile'   && <Profile user={user} onUpdate={handleUserUpdate} />}
        </div>
      </main>
    </div>
  )
}
