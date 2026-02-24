import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar } from '../components/UI'
import { WEEKLY_STEPS } from '../data/nutrition'
import { getBioLog, getSleepLog, getFoodLog, getCardioLog, today } from '../lib/storage'
import { FUN_FACTS } from '../data/funfacts'

const RADAR_DATA = [
  { metric:'Força', value:70 }, { metric:'Cardio', value:55 },
  { metric:'Flex', value:40 }, { metric:'Resistência', value:65 },
  { metric:'Equilíbrio', value:50 }, { metric:'Velocidade', value:60 },
]

export default function Dashboard({ user }) {
  const [factIdx, setFactIdx] = useState(Math.floor(Math.random()*FUN_FACTS.length))

  const bmr = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee = Math.round(bmr*(user.activity||1.55))
  const bmi = (user.weight/Math.pow(user.height/100,2)).toFixed(1)
  const bmiColor = bmi<18.5?'#00d4ff':bmi<25?'#00ff88':bmi<30?'#ff9f43':'#ff6b6b'
  const waterGoal = Math.round(user.weight*35)
  const waterConsumed = (user.waterToday||0)*250
  const steps = user.stepsToday||0

  const latestBio = getBioLog(user.id)[0]
  const latestSleep = getSleepLog(user.id)[0]
  const todayFood = getFoodLog(user.id, today())
  const todayFoodKcal = todayFood.reduce((s,e)=>s+e.calories, 0)
  const cardioLog = getCardioLog(user.id)
  const fact = FUN_FACTS[factIdx % FUN_FACTS.length]

  const stats = [
    { label:'IMC', value:bmi, c:bmiColor },
    { label:'TDEE kcal', value:tdee.toLocaleString('pt-BR'), c:'#00d4ff' },
    { label:'Água hoje', value:`${waterConsumed}ml`, c:'#00d4ff' },
    { label:'Passos', value:steps.toLocaleString('pt-BR'), c:'#f7c59f' },
    { label:'Kcal consumidas', value:todayFoodKcal||'—', c:'#ff9f43' },
    { label:'Sono (últ.)', value:`${latestSleep?.hours||'—'}h`, c:'#4ecdc4' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#00ff88', fontSize:22, letterSpacing:4, fontWeight:700 }}>PAINEL BIOMÉTRICO</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>
          {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).toUpperCase()}
        </div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#00d4ff', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 FATO CURIOSO · clique para próximo</div>
          <div style={{ color:'#888', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
        {stats.map(s=>(
          <NeonCard key={s.label} color={s.c} style={{ padding:'14px 16px', textAlign:'center' }}>
            <div style={{ color:s.c, fontSize:22, fontWeight:700 }}>{s.value}</div>
            <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginTop:6 }}>{s.label.toUpperCase()}</div>
          </NeonCard>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <NeonCard color="#00ff88" style={{ padding:18 }}>
          <SectionTitle color="#00ff88">PERFIL DE FITNESS</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#00ff8812" />
              <PolarAngleAxis dataKey="metric" tick={{ fill:'#555', fontSize:10, fontFamily:'monospace' }} />
              <Radar dataKey="value" stroke="#00ff88" fill="#00ff88" fillOpacity={0.12} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </NeonCard>
        <NeonCard color="#f7c59f" style={{ padding:18 }}>
          <SectionTitle color="#f7c59f">PASSOS SEMANAIS</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={WEEKLY_STEPS}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7c59f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f7c59f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:'#555', fontSize:10, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background:'#0a0a0c', border:'1px solid #f7c59f25', borderRadius:4, fontFamily:'monospace', fontSize:11 }} />
              <Area type="monotone" dataKey="steps" stroke="#f7c59f" strokeWidth={2} fill="url(#sg)" />
            </AreaChart>
          </ResponsiveContainer>
        </NeonCard>
      </div>

      <NeonCard color="#00d4ff" style={{ padding:20 }}>
        <SectionTitle color="#00d4ff">METAS DIÁRIAS</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:40 }}>
          <div>
            <ProgressBar value={waterConsumed} max={waterGoal} color="#00d4ff" label={`Hidratação (meta: ${waterGoal}ml)`} />
            <ProgressBar value={steps} max={10000} color="#f7c59f" label="Passos (meta: 10.000)" />
            <ProgressBar value={user.mealsToday||0} max={6} color="#ff9f43" label="Refeições (meta: 6)" />
          </div>
          <div>
            <ProgressBar value={todayFoodKcal} max={tdee} color="#00ff88" label="Kcal consumidas" />
            <ProgressBar value={latestSleep?.hours||0} max={8} color="#4ecdc4" label="Sono (meta: 8h)" />
            {latestBio && <ProgressBar value={100-latestBio.bodyFat} max={100} color="#ff6b6b" label={`Gordura corporal: ${latestBio.bodyFat}%`} />}
          </div>
        </div>
      </NeonCard>
    </div>
  )
}
