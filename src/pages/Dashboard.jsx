import { useState, useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar } from '../components/UI'
import { WEEKLY_STEPS } from '../data/nutrition'
import { getBioLog, getSleepLog, getFoodLog, getCardioLog, today } from '../lib/db'
import { FUN_FACTS } from '../data/funfacts'

const RADAR_DATA = [
  { metric:'Força', value:70 },{ metric:'Cardio', value:55 },
  { metric:'Flex', value:40 },{ metric:'Resistência', value:65 },
  { metric:'Equilíbrio', value:50 },{ metric:'Velocidade', value:60 },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 769)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 769)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function Dashboard({ user, userId }) {
  const [factIdx, setFactIdx] = useState(0)
  const [bioLog, setBioLog] = useState([])
  const [sleepLog, setSleepLog] = useState([])
  const [foodLog, setFoodLog] = useState([])
  const isMobile = useIsMobile()

  useEffect(() => {
    getBioLog(userId, 1).then(setBioLog).catch(()=>{})
    getSleepLog(userId, 7).then(setSleepLog).catch(()=>{})
    getFoodLog(userId, today()).then(setFoodLog).catch(()=>{})
  }, [userId])

  const bmr = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee = Math.round(bmr*(user.activity||1.55))
  const bmi = (user.weight/Math.pow(user.height/100,2)).toFixed(1)
  const bmiColor = bmi<18.5?'#00d4ff':bmi<25?'#00ff88':bmi<30?'#ff9f43':'#ff6b6b'
  const waterGoal = Math.round(user.weight*35)
  const waterConsumed = (user.water_today||0)*250
  const steps = user.steps_today||0
  const latestBio = bioLog[0]
  const latestSleep = sleepLog[0]
  const todayFoodKcal = foodLog.reduce((s,e)=>s+e.calories,0)
  const fact = FUN_FACTS[factIdx % FUN_FACTS.length]

  const stats = [
    { label:'IMC', value:bmi, c:bmiColor },
    { label:'TDEE', value:`${tdee.toLocaleString('pt-BR')} kcal`, c:'#00d4ff' },
    { label:'Água', value:`${waterConsumed}ml`, c:'#00d4ff' },
    { label:'Passos', value:steps.toLocaleString('pt-BR'), c:'#f7c59f' },
    { label:'Kcal hoje', value:todayFoodKcal||'—', c:'#ff9f43' },
    { label:'Sono', value:`${latestSleep?.hours||'—'}h`, c:'#4ecdc4' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ color:'#00ff88', fontSize: isMobile?18:22, letterSpacing:4, fontWeight:700 }}>PAINEL</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>
          {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).toUpperCase()}
        </div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:16, WebkitTapHighlightColor:'transparent' }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'#00d4ff', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 FATO CURIOSO · toque para próximo</div>
          <div style={{ color:'#888', fontSize:11, lineHeight:1.5 }}>{fact.fact}</div>
        </div>
      </div>

      {/* Stats grid — 3 cols mobile, 3 cols desktop */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {stats.map(s=>(
          <NeonCard key={s.label} color={s.c} style={{ padding:'12px 10px', textAlign:'center' }}>
            <div style={{ color:s.c, fontSize:isMobile?16:20, fontWeight:700 }}>{s.value}</div>
            <div style={{ color:'#444', fontSize:8, letterSpacing:1.5, marginTop:4, textTransform:'uppercase' }}>{s.label}</div>
          </NeonCard>
        ))}
      </div>

      {/* Charts — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>
        <NeonCard color="#00ff88" style={{ padding:16 }}>
          <SectionTitle color="#00ff88">PERFIL DE FITNESS</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#00ff8812" />
              <PolarAngleAxis dataKey="metric" tick={{ fill:'#555', fontSize:9, fontFamily:'monospace' }} />
              <Radar dataKey="value" stroke="#00ff88" fill="#00ff88" fillOpacity={0.12} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </NeonCard>
        <NeonCard color="#f7c59f" style={{ padding:16 }}>
          <SectionTitle color="#f7c59f">PASSOS SEMANAIS</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={WEEKLY_STEPS}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7c59f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f7c59f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:'#555', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background:'#0a0a0c', border:'1px solid #f7c59f25', borderRadius:4, fontFamily:'monospace', fontSize:11 }} />
              <Area type="monotone" dataKey="steps" stroke="#f7c59f" strokeWidth={2} fill="url(#sg)" />
            </AreaChart>
          </ResponsiveContainer>
        </NeonCard>
      </div>

      {/* Progress bars */}
      <NeonCard color="#00d4ff" style={{ padding:16 }}>
        <SectionTitle color="#00d4ff">METAS DIÁRIAS</SectionTitle>
        <ProgressBar value={waterConsumed} max={waterGoal} color="#00d4ff" label={`Água (${waterGoal}ml)`} />
        <ProgressBar value={steps} max={10000} color="#f7c59f" label="Passos (10.000)" />
        <ProgressBar value={user.meals_today||0} max={6} color="#ff9f43" label="Refeições (6)" />
        <ProgressBar value={todayFoodKcal} max={tdee} color="#00ff88" label="Kcal consumidas" />
        <ProgressBar value={latestSleep?.hours||0} max={8} color="#4ecdc4" label="Sono (8h)" />
      </NeonCard>
    </div>
  )
}
