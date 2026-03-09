import { useState, useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar } from '../components/UI'
import { getBioLog, getSleepLog, getFoodLog, getStepsLog, getTodaySteps, getTodayWater, getMealPlans, getMealLog, today } from '../lib/db'
import { supabase } from '../lib/supabase'
import { FUN_FACTS } from '../data/funfacts'

const RADAR_KEYS = [
  { metric:'Força',      key:'strength'   },
  { metric:'Cardio',     key:'cardio'     },
  { metric:'Flex',       key:'flex'       },
  { metric:'Resistência',key:'resistance' },
  { metric:'Equilíbrio', key:'balance'    },
  { metric:'Velocidade', key:'speed'      },
]
const DAY_ABBREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function clamp(v, min=0, max=100) { return Math.min(max, Math.max(min, Math.round(v))) }

// ─── Motor de cálculo do perfil de fitness ────────────────────────────────────
async function computeFitnessProfile(userId, user) {
  try {
    const thirtyAgo = new Date(Date.now() - 30*86400000).toISOString().split('T')[0]
    const sevenAgo  = new Date(Date.now() - 7*86400000).toISOString().split('T')[0]

    // Busca em paralelo
    const [
      { data: workoutLogs },
      { data: cardioLogs  },
      sleepLogs,
      bioLogs,
      stepsLogs,
    ] = await Promise.all([
      supabase.from('workout_logs').select('date,exercises,completed').eq('user_id', userId).gte('date', thirtyAgo),
      supabase.from('cardio_log').select('date,minutes,zone,kcal').eq('user_id', userId).gte('date', thirtyAgo).catch(() => ({ data: [] })),
      getSleepLog(userId, 30).catch(() => []),
      getBioLog(userId, 1).catch(() => []),
      getStepsLog(userId, 30).catch(() => []),
    ])

    const wLogs   = workoutLogs  || []
    const cLogs   = cardioLogs   || []
    const bio     = bioLogs[0]

    // ── FORÇA ─────────────────────────────────────────────────────────────────
    // Frequência semanal de treinos + volume médio (sets×reps×weight)
    const workoutsLast7  = wLogs.filter(l => l.date >= sevenAgo).length
    const workoutsLast30 = wLogs.length
    const freqScore = clamp((workoutsLast7 / 4) * 60 + (workoutsLast30 / 12) * 40)

    // Volume médio de carga (kg×reps) por sessão
    let totalVolume = 0, sessionsWithWeight = 0
    wLogs.forEach(log => {
      let sessionVol = 0
      ;(log.exercises || []).forEach(ex => {
        const w = parseFloat(ex.weight) || 0
        const r = parseInt(ex.reps) || 0
        const s = parseInt(ex.sets)  || 1
        sessionVol += w * r * s
      })
      if (sessionVol > 0) { totalVolume += sessionVol; sessionsWithWeight++ }
    })
    const avgVolume  = sessionsWithWeight > 0 ? totalVolume / sessionsWithWeight : 0
    // Escala: 0=0, 5000=50, 10000=100 (volume por sessão)
    const volScore   = clamp((avgVolume / 10000) * 100)
    const strength   = clamp(freqScore * 0.5 + volScore * 0.5)

    // ── CARDIO ────────────────────────────────────────────────────────────────
    const cardioSessions7  = cLogs.filter(l => l.date >= sevenAgo).length
    const avgSteps7 = stepsLogs.filter(l => l.date >= sevenAgo).reduce((s,e,_,a) => s + e.steps/a.length, 0)
    const cardioFreqScore  = clamp((cardioSessions7 / 3) * 60)
    const stepsScore       = clamp((avgSteps7 / 10000) * 40)
    const cardio           = clamp(cardioFreqScore + stepsScore)

    // ── FLEXIBILIDADE (proxy: % gordura corporal inversa + consistência nutricional) ──
    // Menor gordura = mais flex (atletas são mais flexíveis em geral)
    let flex = 50 // default quando não há bioimpedância
    if (bio?.body_fat) {
      const fat = parseFloat(bio.body_fat)
      // Escala: 8%=100, 15%=80, 25%=50, 35%=25, 40%+=10
      if (fat <= 8)       flex = 100
      else if (fat <= 15) flex = clamp(80 + (15 - fat) * (20/7))
      else if (fat <= 25) flex = clamp(50 + (25 - fat) * (30/10))
      else if (fat <= 35) flex = clamp(25 + (35 - fat) * (25/10))
      else                flex = clamp(10)
    }
    // Boost se treinando consistentemente (mobilidade melhora com treino)
    flex = clamp(flex + Math.min(workoutsLast30 * 1.5, 15))

    // ── RESISTÊNCIA ───────────────────────────────────────────────────────────
    // Total de minutos de cardio no mês + consistência de treinos
    const totalCardioMin = cLogs.reduce((s, l) => s + (parseInt(l.minutes) || 0), 0)
    const minScore       = clamp((totalCardioMin / 300) * 60)  // 300min/mês = 60pts
    const consistScore   = clamp((workoutsLast30 / 12) * 40)   // 12 treinos/mês = 40pts
    const resistance     = clamp(minScore + consistScore)

    // ── EQUILÍBRIO (sono) ─────────────────────────────────────────────────────
    // Média de horas + consistência (baixo desvio padrão)
    let balance = 50
    if (sleepLogs.length >= 3) {
      const hours  = sleepLogs.map(l => parseFloat(l.hours) || 0).filter(h => h > 0)
      const avg    = hours.reduce((s,h) => s+h, 0) / hours.length
      const avgScore = clamp((avg / 8) * 70)  // 8h = 70pts

      const variance = hours.reduce((s,h) => s + Math.pow(h - avg, 2), 0) / hours.length
      const stdDev   = Math.sqrt(variance)
      const consistSleep = clamp((1 - stdDev / 3) * 30)  // baixo desvio = +30pts

      balance = clamp(avgScore + consistSleep)
    }

    // ── VELOCIDADE ────────────────────────────────────────────────────────────
    // Passos diários médios + sessões de cardio de alta intensidade (Z3/Z4/Z5)
    const avgSteps30   = stepsLogs.length > 0
      ? stepsLogs.reduce((s,e) => s + e.steps, 0) / stepsLogs.length
      : 0
    const stepsSpd     = clamp((avgSteps30 / 12000) * 60)
    const hiitSessions = cLogs.filter(l => ['Z3','Z4','Z5'].includes(l.zone)).length
    const hiitScore    = clamp((hiitSessions / 8) * 40)
    const speed        = clamp(stepsSpd + hiitScore)

    const profile = { strength, cardio, flex, resistance, balance, speed }

    // Salva no banco
    await supabase.from('profiles').update({ fitness_profile: profile }).eq('id', userId)

    return profile
  } catch(e) {
    console.warn('computeFitnessProfile error:', e)
    return null
  }
}

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
  const [factIdx,       setFactIdx]      = useState(0)
  const [bioLog,        setBioLog]       = useState([])
  const [sleepLog,      setSleepLog]     = useState([])
  const [foodLog,       setFoodLog]      = useState([])
  const [stepsLog,      setStepsLog]     = useState([])
  const [todaySteps,    setTodaySteps]   = useState(null)
  const [todayWater,    setTodayWater]   = useState(null)
  const [mealPlans,     setMealPlans]    = useState([])
  const [mealLog,       setMealLog]      = useState([])
  const [fitnessProf,   setFitnessProf]  = useState(null)
  const [computing,     setComputing]    = useState(false)
  const isMobile  = useIsMobile()
  const todayStr  = today()

  // ── Carrega dados base ──────────────────────────────────────────────────────
  useEffect(() => {
    getBioLog(userId, 1).then(setBioLog).catch(()=>{})
    getSleepLog(userId, 7).then(setSleepLog).catch(()=>{})
    getFoodLog(userId, todayStr).then(setFoodLog).catch(()=>{})
    getStepsLog(userId, 7).then(setStepsLog).catch(()=>{})
    getTodaySteps(userId).then(setTodaySteps).catch(()=> setTodaySteps(0))
    getTodayWater(userId).then(setTodayWater).catch(()=> setTodayWater(0))
    getMealPlans(userId).then(setMealPlans).catch(()=>{})
    getMealLog(userId, todayStr).then(setMealLog).catch(()=>{})
  }, [userId])

  // ── Calcula perfil de fitness uma vez por dia ───────────────────────────────
  useEffect(() => {
    if (!userId) return
    const cacheKey  = `hos_fitness_calc_${userId}`
    const lastCalc  = localStorage.getItem(cacheKey)
    if (lastCalc === todayStr) {
      // Já calculou hoje — usa o que tem no perfil do usuário
      setFitnessProf(user.fitness_profile || null)
      return
    }
    // Calcula agora (primeira entrada do dia)
    setComputing(true)
    computeFitnessProfile(userId, user).then(profile => {
      if (profile) {
        setFitnessProf(profile)
        localStorage.setItem(cacheKey, todayStr)
      } else {
        setFitnessProf(user.fitness_profile || null)
      }
      setComputing(false)
    })
  }, [userId])

  // ── Atualiza quando usuário marca refeição ──────────────────────────────────
  useEffect(() => {
    function onDietUpdate() {
      getMealPlans(userId).then(setMealPlans).catch(()=>{})
      getMealLog(userId, todayStr).then(setMealLog).catch(()=>{})
      getFoodLog(userId, todayStr).then(setFoodLog).catch(()=>{})
    }
    window.addEventListener('diet-plan-saved',  onDietUpdate)
    window.addEventListener('meal-log-updated', onDietUpdate)
    return () => {
      window.removeEventListener('diet-plan-saved',  onDietUpdate)
      window.removeEventListener('meal-log-updated', onDietUpdate)
    }
  }, [userId])

  // ── Perfil de fitness para o radar ─────────────────────────────────────────
  const activeFitnessProfile = fitnessProf || user.fitness_profile || { strength:50, cardio:50, flex:50, resistance:50, balance:50, speed:50 }
  const radarData = RADAR_KEYS.map(({ metric, key }) => ({ metric, value: activeFitnessProfile[key] ?? 50 }))

  // ── Steps semanais ──────────────────────────────────────────────────────────
  const weeklySteps = (() => {
    const byDate = {}
    stepsLog.forEach(e => { byDate[e.date] = e.steps })
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      out.push({ day: DAY_ABBREV[d.getDay()], steps: byDate[dStr] ?? 0 })
    }
    return out
  })()

  // ── Valores ─────────────────────────────────────────────────────────────────
  const bmr  = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee = Math.round(bmr*(user.activity||1.55))
  const bmi  = (user.weight/Math.pow(user.height/100,2)).toFixed(1)
  const bmiColor    = bmi<18.5?'#94a3b8':bmi<25?'#dc2626':bmi<30?'#ef4444':'#ff6b6b'
  const waterGoal   = Math.round(user.weight*35)
  const waterConsumed = todayWater !== null ? todayWater : (user.water_today||0)*250
  const steps       = todaySteps !== null ? todaySteps : (user.steps_today||0)
  const latestSleep = sleepLog[0]

  // Calorias: food log + planos marcados
  const todayPlans = mealPlans.filter(p => {
    if (!p.active) return false
    if (p.frequency === 'Segunda a sexta') { const d=new Date().getDay(); return d>=1&&d<=5 }
    if (p.frequency === 'Fins de semana')  { const d=new Date().getDay(); return d===0||d===6 }
    return true
  })
  const checkedIds    = new Set((mealLog||[]).map(l => l.meal_id))
  const planKcalDone  = todayPlans.filter(p => checkedIds.has(p.id)).reduce((s,p) => s+(parseInt(p.calories)||0), 0)
  const planMealsDone = todayPlans.filter(p => checkedIds.has(p.id)).length
  const foodKcal      = foodLog.reduce((s,e) => s+e.calories, 0)
  const foodMeals     = new Set(foodLog.map(e=>e.meal).filter(Boolean)).size
  const totalKcal     = foodKcal + planKcalDone
  const totalMeals    = foodMeals + planMealsDone
  const totalPlans    = Math.max(6, todayPlans.length)

  const fact = FUN_FACTS[factIdx % FUN_FACTS.length]

  const stats = [
    { label:'IMC',       value:bmi,                            c:bmiColor  },
    { label:'TDEE',      value:`${tdee.toLocaleString('pt-BR')} kcal`, c:'#94a3b8' },
    { label:'Água',      value:`${waterConsumed}ml`,           c:'#94a3b8' },
    { label:'Passos',    value:steps.toLocaleString('pt-BR'),  c:'#94a3b8' },
    { label:'Kcal hoje', value:totalKcal||'—',                 c:'#ef4444' },
    { label:'Sono',      value:`${latestSleep?.hours||'—'}h`,  c:'#64748b' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:20 }}>
        <div style={{ color:'#dc2626', fontSize:isMobile?18:22, letterSpacing:4, fontWeight:700 }}>PAINEL</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>
          {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).toUpperCase()}
        </div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(148,163,184,0.04)', border:'1px solid rgba(148,163,184,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:16, WebkitTapHighlightColor:'transparent' }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'#94a3b8', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 FATO CURIOSO · toque para próximo</div>
          <div style={{ color:'#888', fontSize:11, lineHeight:1.5 }}>{fact.fact}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {stats.map(s=>(
          <NeonCard key={s.label} color={s.c} style={{ padding:'12px 10px', textAlign:'center' }}>
            <div style={{ color:s.c, fontSize:isMobile?16:20, fontWeight:700 }}>{s.value}</div>
            <div style={{ color:'#444', fontSize:8, letterSpacing:1.5, marginTop:4, textTransform:'uppercase' }}>{s.label}</div>
          </NeonCard>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>

        {/* Radar — com indicador de atualização */}
        <NeonCard color="#dc2626" style={{ padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <SectionTitle color="#dc2626" style={{ marginBottom:0 }}>PERFIL DE FITNESS</SectionTitle>
            {computing
              ? <span style={{ color:'#555', fontSize:9, letterSpacing:1 }}>⟳ CALCULANDO...</span>
              : <span style={{ color:'#333', fontSize:9, letterSpacing:1 }} title="Atualiza diariamente com base nos seus dados">↻ HOJE</span>
            }
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#dc262618" />
              <PolarAngleAxis dataKey="metric" tick={{ fill:'#555', fontSize:9, fontFamily:'monospace' }} />
              <Radar dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.12} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
          {/* Scores abaixo do radar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, marginTop:8 }}>
            {RADAR_KEYS.map(k => (
              <div key={k.key} style={{ textAlign:'center', padding:'4px 0' }}>
                <div style={{ color:'#dc2626', fontSize:13, fontWeight:700 }}>{activeFitnessProfile[k.key] ?? 50}</div>
                <div style={{ color:'#333', fontSize:8, letterSpacing:1 }}>{k.metric.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </NeonCard>

        <NeonCard color="#94a3b8" style={{ padding:16 }}>
          <SectionTitle color="#94a3b8">PASSOS SEMANAIS</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklySteps}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:'#555', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background:'#0a0a0c', border:'1px solid #94a3b825', borderRadius:4, fontFamily:'monospace', fontSize:11 }} />
              <Area type="monotone" dataKey="steps" stroke="#94a3b8" strokeWidth={2} fill="url(#sg)" />
            </AreaChart>
          </ResponsiveContainer>
        </NeonCard>
      </div>

      {/* Metas diárias */}
      <NeonCard color="#94a3b8" style={{ padding:16 }}>
        <SectionTitle color="#94a3b8">METAS DIÁRIAS</SectionTitle>
        <ProgressBar value={waterConsumed} max={waterGoal}  color="#94a3b8" label={`Água (${waterGoal}ml)`} />
        <ProgressBar value={steps}         max={10000}       color="#94a3b8" label="Passos (10.000)" />
        <ProgressBar value={totalMeals}    max={totalPlans}  color="#ef4444" label={`Refeições (${totalPlans})`} />
        <ProgressBar value={totalKcal}     max={tdee}        color="#dc2626" label="Kcal consumidas" />
        <ProgressBar value={latestSleep?.hours||0} max={8}  color="#94a3b8" label="Sono (8h)" />
      </NeonCard>
    </div>
  )
}