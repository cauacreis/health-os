import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar, Modal } from '../components/UI'
import { CARDIO_ZONES } from '../data/nutrition'
import { upsertProfile, saveCardioEntry, getCardioLog, addCalendarEntry, getWaterLog, saveWaterLog, today } from '../lib/db'
import { FUN_FACTS } from '../data/funfacts'

const R  = '#dc2626'
const R2 = '#ef4444'
const S  = '#94a3b8'
const DIM = 'rgba(220,38,38,0.08)'

// ─── WATER ───────────────────────────────────────────────────────────────────
export function Water({ user, userId, onUpdate }) {
  const [tab, setTab]           = useState('hoje')
  const [consumed, setConsumed] = useState((user.water_today || 0) * 250)
  const [meals, setMeals]       = useState(user.meals_today || 0)
  const [saving, setSaving]     = useState(false)
  const [customMl, setCustomMl] = useState('')
  const [waterLog, setWaterLog] = useState([])
  const [logLoaded, setLogLoaded] = useState(false)
  const goal = Math.round((user.weight || 70) * 35)
  const facts = FUN_FACTS.filter(f => f.category === 'Hidratação')
  const [factIdx, setFactIdx]   = useState(0)
  const fact = facts[factIdx % Math.max(facts.length, 1)]

  const cups         = Math.round(goal / 250)
  const consumedCups = Math.round(consumed / 250)
  const pct          = Math.min((consumed / goal) * 100, 100)

  useEffect(() => {
    if (tab === 'historico' && !logLoaded) {
      getWaterLog(userId, 30).then(d => { setWaterLog(d); setLogLoaded(true) }).catch(() => setLogLoaded(true))
    }
  }, [tab, logLoaded, userId])

  async function saveMl(newMl) {
    setSaving(true)
    try {
      const updated = await upsertProfile(userId, { water_today: newMl / 250 })
      onUpdate(updated)
      await saveWaterLog(userId, today(), newMl)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleCup(idx) {
    const nextCups = consumedCups === idx + 1 ? idx : idx + 1
    const newMl = nextCups * 250
    setConsumed(newMl)
    await saveMl(newMl)
  }

  async function addCustom() {
    const ml = parseInt(customMl)
    if (!ml || ml <= 0) return
    const newMl = consumed + ml
    setConsumed(newMl)
    setCustomMl('')
    await saveMl(newMl)
  }

  async function setMealsVal(v) {
    setMeals(v)
    try {
      const updated = await upsertProfile(userId, { meals_today: v })
      onUpdate(updated)
    } catch(e) { console.error(e) }
  }

  const chartData = waterLog.slice(0, 14).reverse().map(e => ({ date: e.date?.slice(5), ml: e.ml }))
  const avgWater   = waterLog.length ? Math.round(waterLog.reduce((s,e) => s+(e.ml||0), 0) / waterLog.length) : 0
  const daysOnTarget = waterLog.filter(e => e.ml >= goal).length
  const streak = calcWaterStreak(waterLog)

  return (
    <div className="animate-fade">
      <PageHeader title="HIDRATAÇÃO" sub={`META: ${goal}ml · ${cups} COPOS`} />

      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[{id:'hoje',label:'💧 Hoje'},{id:'historico',label:'📊 Histórico'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn"
            style={{ flex:1, padding:'10px 0', fontSize:12, background: tab===t.id ? DIM : 'transparent', borderColor: tab===t.id ? R : 'rgba(255,255,255,0.08)', color: tab===t.id ? R2 : '#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hoje' && (
        <>
          <FactBanner fact={fact} onNext={() => setFactIdx(i => i+1)} />

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            <StatCard label="Consumido" value={`${consumed}ml`} />
            <StatCard label="Meta"      value={`${goal}ml`} />
            <StatCard label="Progresso" value={`${Math.round(pct)}%`} highlight={pct >= 100} />
          </div>

          <NeonCard color={R} style={{ padding:22, marginBottom:16 }}>
            <SectionTitle color={R}>COPOS DE 250ml</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:18 }}>
              {Array.from({ length: Math.min(cups, 15) }).map((_, i) => {
                const filled = i < consumedCups
                return (
                  <div key={i} onClick={() => toggleCup(i)}
                    style={{ aspectRatio:'1', borderRadius:8, border:`1px solid ${filled ? R2+'60' : 'rgba(255,255,255,0.06)'}`, background: filled ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer', transition:'all 0.15s', WebkitTapHighlightColor:'transparent' }}>
                    {filled ? '💧' : <span style={{ color:'#2a2a2a', fontSize:16 }}>○</span>}
                  </div>
                )
              })}
            </div>
            <ProgressBar value={consumed} max={goal} color={R} label="Hidratação" />
          </NeonCard>

          <NeonCard color={S} style={{ padding:20, marginBottom:16 }}>
            <SectionTitle color={S}>ADICIONAR QUANTIDADE LIVRE</SectionTitle>
            <div style={{ color:'#555', fontSize:11, marginBottom:12 }}>Bebeu uma garrafa, um copo diferente? Registre aqui.</div>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              {[100, 200, 300, 500, 750].map(v => (
                <button key={v} onClick={() => { const n = consumed+v; setConsumed(n); saveMl(n) }}
                  style={{ flex:1, padding:'9px 0', borderRadius:6, border:`1px solid rgba(148,163,184,0.25)`, background:'rgba(148,163,184,0.06)', color:S, fontFamily:"'Space Mono',monospace", fontSize:11, cursor:'pointer', minWidth:50 }}>
                  +{v}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" value={customMl} onChange={e => setCustomMl(e.target.value)}
                placeholder="ml personalizado (ex: 450)" className="input"
                style={{ flex:1, borderColor:'rgba(148,163,184,0.25)', color:S }}
                onKeyDown={e => e.key==='Enter' && addCustom()} />
              <button className="btn" onClick={addCustom}
                style={{ background:'rgba(148,163,184,0.1)', borderColor:`${S}50`, color:S, padding:'0 20px', fontSize:16 }}>+</button>
            </div>
            {saving && <div style={{ color:'#444', fontSize:11, marginTop:6, textAlign:'right' }}>salvando...</div>}
          </NeonCard>

          <NeonCard color={S} style={{ padding:22, marginBottom:16 }}>
            <SectionTitle color={S}>REFEIÇÕES DO DIA</SectionTitle>
            <div style={{ color:S, fontSize:48, fontWeight:700, textAlign:'center', lineHeight:1 }}>{meals}</div>
            <div style={{ color:'#444', fontSize:12, textAlign:'center', marginBottom:20 }}>refeições</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setMealsVal(n)}
                  style={{ padding:'12px 0', borderRadius:8, border:`1px solid ${meals >= n ? S+'50' : 'rgba(255,255,255,0.06)'}`, background: meals >= n ? 'rgba(148,163,184,0.15)' : 'transparent', color: meals >= n ? S : '#333', fontFamily:"'Space Mono',monospace", fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                  {n}
                </button>
              ))}
            </div>
          </NeonCard>

          <NeonCard color={R} style={{ padding:20 }}>
            <SectionTitle color={R}>GUIA DE HIDRATAÇÃO</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {[
                { icon:'🌅', label:'Ao acordar',     tip:'500ml antes do café' },
                { icon:'🏋️', label:'Antes do treino', tip:'400–600ml, 1h antes' },
                { icon:'💪', label:'Durante treino',  tip:'150ml a cada 15min' },
                { icon:'🌙', label:'À noite',         tip:'Pare 1h antes de dormir' },
              ].map(g => (
                <div key={g.label} style={{ padding:'12px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{g.icon}</div>
                  <div style={{ color:R2, fontSize:13, fontWeight:700, marginBottom:3 }}>{g.label}</div>
                  <div style={{ color:'#666', fontSize:12 }}>{g.tip}</div>
                </div>
              ))}
            </div>
          </NeonCard>
        </>
      )}

      {tab === 'historico' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            <NeonCard color={R} style={{ padding:'14px 10px', textAlign:'center' }}>
              <div style={{ color:R2, fontSize:20, fontWeight:700 }}>{avgWater}ml</div>
              <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>Média diária</div>
            </NeonCard>
            <NeonCard color={S} style={{ padding:'14px 10px', textAlign:'center' }}>
              <div style={{ color:S, fontSize:20, fontWeight:700 }}>{daysOnTarget}</div>
              <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>Dias na meta</div>
            </NeonCard>
            <NeonCard color={R} style={{ padding:'14px 10px', textAlign:'center' }}>
              <div style={{ color:R2, fontSize:20, fontWeight:700 }}>{streak}d</div>
              <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>Sequência</div>
            </NeonCard>
          </div>

          {chartData.length > 1 ? (
            <NeonCard color={R} style={{ padding:18, marginBottom:14 }}>
              <SectionTitle color={R}>CONSUMO ÚLTIMOS 14 DIAS</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} formatter={v => [`${v}ml`]} />
                  <ReferenceLine y={goal} stroke={`${R}50`} strokeDasharray="4 4" label={{ value:`Meta ${goal}ml`, fill:'#555', fontSize:9, position:'insideTopRight' }} />
                  <Bar dataKey="ml" fill={R} opacity={0.8} radius={[4,4,0,0]} name="ml ingerido" />
                </BarChart>
              </ResponsiveContainer>
            </NeonCard>
          ) : (
            <NeonCard color={R} style={{ padding:32, textAlign:'center', marginBottom:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💧</div>
              <div style={{ color:'#444', fontSize:13 }}>Registre água por alguns dias para ver o histórico aqui.<br/><br/>
                <span style={{ color:'#333', fontSize:11 }}>⚠️ Necessário criar a tabela water_log no Supabase.</span>
              </div>
            </NeonCard>
          )}

          {waterLog.length > 0 && (
            <NeonCard color={S} style={{ padding:18 }}>
              <SectionTitle color={S}>REGISTROS</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {waterLog.map((e, i) => {
                  const p = Math.min((e.ml / goal) * 100, 100)
                  const ok = e.ml >= goal
                  return (
                    <div key={i} style={{ padding:'11px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${ok ? R+'20' : 'rgba(255,255,255,0.05)'}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{e.date}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ color: ok ? R2 : S, fontSize:13, fontWeight:700 }}>{e.ml}ml</span>
                          {ok && <span style={{ color:R, fontSize:10 }}>✓ Meta</span>}
                        </div>
                      </div>
                      <div style={{ width:'100%', height:4, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                        <div style={{ width:`${p}%`, height:'100%', background: ok ? R : S, borderRadius:2 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </NeonCard>
          )}
        </>
      )}
    </div>
  )
}

// ─── BMI ─────────────────────────────────────────────────────────────────────
export function BMI({ user }) {
  const bmi  = user.weight / Math.pow(user.height / 100, 2)
  const bmiR = bmi.toFixed(1)
  const cat  = bmi < 18.5 ? { label:'Abaixo do peso', color:'#64748b', tip:'Considere aumentar a ingestão calórica com nutricionista.' }
             : bmi < 25   ? { label:'Peso ideal',      color:R,        tip:'Parabéns! Mantenha hábitos saudáveis.' }
             : bmi < 30   ? { label:'Sobrepeso',       color:'#b45309', tip:'Déficit calórico leve + exercícios regulares.' }
             :               { label:'Obesidade',      color:'#991b1b', tip:'Consulte um médico para um plano adequado.' }
  const bmr  = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee = Math.round(bmr * (user.activity || 1.55))
  const barPct = Math.min(((bmi-15)/(40-15))*100, 100)

  return (
    <div className="animate-fade">
      <PageHeader title="ÍNDICE DE MASSA CORPORAL" sub={`${user.weight}kg · ${user.height}cm`} />
      <NeonCard color={cat.color} style={{ padding:32, textAlign:'center', marginBottom:16 }}>
        <div style={{ color:'#444', fontSize:12, letterSpacing:3, marginBottom:8 }}>SEU IMC</div>
        <div style={{ color:cat.color, fontSize:72, fontWeight:700, lineHeight:1 }}>{bmiR}</div>
        <div style={{ color:cat.color, fontSize:18, marginTop:8, fontWeight:700 }}>{cat.label}</div>
        <div style={{ color:'#666', fontSize:13, marginTop:12, lineHeight:1.7 }}>{cat.tip}</div>
        <div style={{ position:'relative', height:12, background:'rgba(255,255,255,0.05)', borderRadius:6, marginTop:24, overflow:'visible' }}>
          <div style={{ height:'100%', borderRadius:6, background:`linear-gradient(90deg, #64748b, ${R}, #b45309, #991b1b)` }} />
          <div style={{ position:'absolute', top:'50%', left:`${barPct}%`, transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:cat.color, border:'3px solid #0d0d10', boxShadow:`0 0 10px ${cat.color}`, transition:'left 0.5s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ color:'#333', fontSize:10 }}>15</span><span style={{ color:'#333', fontSize:10 }}>40+</span>
        </div>
      </NeonCard>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        <StatCard label="Peso"  value={`${user.weight}kg`} />
        <StatCard label="TMB"   value={`${Math.round(bmr)} kcal`} />
        <StatCard label="TDEE"  value={`${tdee} kcal`} />
      </div>
      <NeonCard color={R} style={{ padding:20 }}>
        <SectionTitle color={R}>TABELA DE REFERÊNCIA</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { range:'< 18.5',   label:'Abaixo do peso', color:'#64748b' },
            { range:'18.5–24.9',label:'Peso ideal',      color:R },
            { range:'25–29.9',  label:'Sobrepeso',       color:'#b45309' },
            { range:'≥ 30',     label:'Obesidade',       color:'#991b1b' },
          ].map(r => (
            <div key={r.range} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderRadius:8, border:`1px solid ${r.color}20`, background:'rgba(255,255,255,0.02)' }}>
              <span style={{ color:r.color, fontSize:14, fontWeight:700, minWidth:80 }}>{r.range}</span>
              <span style={{ color:'#888', fontSize:13 }}>{r.label}</span>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}

// ─── CARDIO ──────────────────────────────────────────────────────────────────
export function Cardio({ user, userId }) {
  const [tab, setTab]     = useState('zonas')
  const [log, setLog]     = useState([])
  const [modal, setModal] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [form, setForm]   = useState({ date: today(), type:'Corrida', zone:'Z2', minutes:'', avg_hr:'', kcal:'' })
  const maxHR = 220 - (user.age || 25)

  if (!loaded) {
    getCardioLog(userId, 30).then(d => { setLog(d); setLoaded(true) }).catch(() => setLoaded(true))
  }

  async function saveEntry() {
    if (!form.minutes) return
    await saveCardioEntry(userId, { ...form, minutes:+form.minutes, avg_hr:+form.avg_hr||null, kcal:+form.kcal||null })
    await addCalendarEntry(userId, { date:form.date, type:'cardio', note:`${form.type} ${form.minutes}min`, label:'Cardio' }).catch(() => {})
    setLog(await getCardioLog(userId, 30))
    setModal(false)
    setForm({ date:today(), type:'Corrida', zone:'Z2', minutes:'', avg_hr:'', kcal:'' })
  }

  const TYPES = ['Corrida','Caminhada','Bike','Natação','Remo','HIIT','Elíptico','Pular Corda']
  const suggestions = getCardioSuggestions(user)
  const chartData = log.slice(0,14).reverse().map(e => ({ date:e.date?.slice(5), min:e.minutes, kcal:e.kcal||0 }))

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <PageHeader title="CARDIO" sub={`FC MÁX ESTIMADA: ${maxHR} BPM`} noMargin />
        <button className="btn" onClick={() => setModal(true)} style={{ background:DIM, borderColor:R, color:R2, fontSize:12 }}>+ REGISTRAR</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:18 }}>
        {[
          { id:'zonas',     label:'❤️ Zonas FC' },
          { id:'sugestoes', label:'🎯 Sugestões' },
          { id:'historico', label:'📊 Histórico' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn"
            style={{ padding:'10px 0', fontSize:10, background: tab===t.id ? DIM : 'transparent', borderColor: tab===t.id ? R : 'rgba(255,255,255,0.08)', color: tab===t.id ? R2 : '#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'zonas' && (
        <NeonCard color={R} style={{ padding:20 }}>
          <SectionTitle color={R}>ZONAS DE FREQUÊNCIA CARDÍACA</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {CARDIO_ZONES.map(z => {
              const low  = Math.round(maxHR * z.pctLow  / 100)
              const high = Math.round(maxHR * z.pctHigh / 100)
              return (
                <div key={z.zone} style={{ padding:'12px 16px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${z.color}25`, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ background:z.color, color:'#fff', borderRadius:6, padding:'4px 10px', fontWeight:700, fontSize:13, flexShrink:0, minWidth:36, textAlign:'center' }}>{z.zone}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{z.name}</div>
                    <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{z.benefit}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ color:z.color, fontSize:15, fontWeight:700 }}>{low}–{high}</div>
                    <div style={{ color:'#444', fontSize:10 }}>bpm · {z.pct}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </NeonCard>
      )}

      {tab === 'sugestoes' && (
        <>
          <NeonCard color={S} style={{ padding:14, marginBottom:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { l:'IMC',      v:(user.weight/Math.pow(user.height/100,2)).toFixed(1), c: getIMCColor(user) },
                { l:'Objetivo', v: user.goal==='muscleGain'?'Músculo':user.goal==='weightLoss'?'Perda peso':user.goal==='endurance'?'Resistência':'Manutenção', c:R2 },
                { l:'FC Máx',   v:`${maxHR} bpm`, c:S },
              ].map(s => (
                <div key={s.l} style={{ padding:'10px 8px', background:`${s.c}0a`, border:`1px solid ${s.c}20`, borderRadius:6, textAlign:'center' }}>
                  <div style={{ color:'#444', fontSize:9, letterSpacing:1, marginBottom:3 }}>{s.l}</div>
                  <div style={{ color:s.c, fontSize:13, fontWeight:700 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </NeonCard>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {suggestions.map((s, i) => (
              <NeonCard key={i} color={s.color} style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:26, flexShrink:0 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ color:s.color, fontSize:12, fontWeight:700, letterSpacing:1 }}>{s.title}</div>
                      <span style={{ background:`${s.color}15`, color:s.color, fontSize:9, letterSpacing:2, padding:'3px 8px', borderRadius:3 }}>{s.zone}</span>
                    </div>
                    <div style={{ color:'#aaa', fontSize:13, marginBottom:8 }}>{s.desc}</div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      <span style={{ color:'#555', fontSize:11 }}>⏱ {s.duration}</span>
                      <span style={{ color:'#555', fontSize:11 }}>📅 {s.frequency}</span>
                      <span style={{ color:'#555', fontSize:11 }}>🔥 ~{s.kcal} kcal</span>
                    </div>
                    {s.tip && <div style={{ marginTop:8, padding:'8px 10px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#666', fontSize:11, lineHeight:1.5 }}>💡 {s.tip}</div>}
                  </div>
                </div>
              </NeonCard>
            ))}
          </div>
        </>
      )}

      {tab === 'historico' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            <NeonCard color={R} style={{ padding:'14px 10px', textAlign:'center' }}>
              <div style={{ color:R2, fontSize:22, fontWeight:700 }}>{log.length}</div>
              <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>Total sessões</div>
            </NeonCard>
            <NeonCard color={S} style={{ padding:'14px 10px', textAlign:'center' }}>
              <div style={{ color:S, fontSize:22, fontWeight:700 }}>{log.reduce((a,e)=>a+(e.minutes||0),0)}min</div>
              <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>Total minutos</div>
            </NeonCard>
            <NeonCard color={R} style={{ padding:'14px 10px', textAlign:'center' }}>
              <div style={{ color:R2, fontSize:22, fontWeight:700 }}>{log.reduce((a,e)=>a+(e.kcal||0),0)}</div>
              <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>Total kcal</div>
            </NeonCard>
          </div>

          {chartData.length > 1 && (
            <NeonCard color={R} style={{ padding:18, marginBottom:14 }}>
              <SectionTitle color={R}>MINUTOS POR SESSÃO</SectionTitle>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} />
                  <Bar dataKey="min" fill={R} opacity={0.85} radius={[4,4,0,0]} name="Minutos" />
                </BarChart>
              </ResponsiveContainer>
            </NeonCard>
          )}

          {log.length > 0 ? (
            <NeonCard color={R} style={{ padding:18 }}>
              <SectionTitle color={R}>TODAS AS SESSÕES</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {log.map((e, i) => (
                  <div key={i} style={{ padding:'11px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(220,38,38,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:R2, fontSize:13, fontWeight:700 }}>{e.type}</div>
                      <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{e.date} · {e.zone}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:'#d0d0d0', fontSize:14, fontWeight:700 }}>{e.minutes}min</div>
                      {e.kcal && <div style={{ color:'#555', fontSize:11 }}>{e.kcal} kcal</div>}
                    </div>
                  </div>
                ))}
              </div>
            </NeonCard>
          ) : (
            <NeonCard color={R} style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🏃</div>
              <div style={{ color:'#444', fontSize:13 }}>Nenhuma sessão registrada ainda.</div>
            </NeonCard>
          )}
        </>
      )}

      {modal && (
        <Modal title="REGISTRAR SESSÃO DE CARDIO" color={R} onClose={() => setModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="label">DATA</label>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} className="input" style={{ borderColor:'rgba(220,38,38,0.3)', color:R2 }} /></div>
            <div><label className="label">TIPO</label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className="select">
                {TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">ZONA</label>
              <select value={form.zone} onChange={e => setForm(f=>({...f,zone:e.target.value}))} className="select">
                {['Z1','Z2','Z3','Z4','Z5'].map(z => <option key={z}>{z}</option>)}</select></div>
            <div><label className="label">DURAÇÃO (min)</label>
              <input type="number" value={form.minutes} onChange={e => setForm(f=>({...f,minutes:e.target.value}))} placeholder="30" className="input" style={{ borderColor:'rgba(220,38,38,0.3)', color:R2 }} /></div>
            <div><label className="label">FC MÉDIA (bpm)</label>
              <input type="number" value={form.avg_hr} onChange={e => setForm(f=>({...f,avg_hr:e.target.value}))} placeholder="140" className="input" /></div>
            <div><label className="label">CALORIAS (kcal)</label>
              <input type="number" value={form.kcal} onChange={e => setForm(f=>({...f,kcal:e.target.value}))} placeholder="250" className="input" /></div>
          </div>
          <button className="btn" onClick={saveEntry} style={{ width:'100%', marginTop:16, background:DIM, borderColor:R, color:R2, padding:14, fontSize:13 }}>
            SALVAR SESSÃO
          </button>
        </Modal>
      )}
    </div>
  )
}

// ─── STEPS ───────────────────────────────────────────────────────────────────
export function Steps({ user, userId, onUpdate }) {
  const [steps, setStepsLocal] = useState(user.steps_today || 0)
  const [saving, setSaving]    = useState(false)
  const facts = FUN_FACTS.filter(f => f.category === 'Passos')
  const [factIdx, setFactIdx]  = useState(0)
  const fact  = facts[factIdx % Math.max(facts.length, 1)]
  const kcal  = Math.round(steps * 0.04)
  const km    = (steps * 0.00075).toFixed(2)

  async function saveSteps(val) {
    const v = Math.max(0, Math.min(50000, val))
    setStepsLocal(v)
    setSaving(true)
    try { const updated = await upsertProfile(userId, { steps_today: v }); onUpdate(updated) }
    catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="animate-fade">
      <PageHeader title="PASSOS DO DIA" sub="ATIVIDADE DIÁRIA" />
      <FactBanner fact={fact} onNext={() => setFactIdx(i => i+1)} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <StatCard label="Passos"    value={steps.toLocaleString('pt-BR')} big />
        <StatCard label="Calorias"  value={`${kcal} kcal`} />
        <StatCard label="Distância" value={`${km} km`} />
      </div>
      <NeonCard color={R} style={{ padding:22, marginBottom:16 }}>
        <SectionTitle color={R}>REGISTRAR PASSOS</SectionTitle>
        <input type="range" min="0" max="20000" step="100" value={steps}
          onChange={e => setStepsLocal(+e.target.value)}
          onMouseUp={e => saveSteps(+e.target.value)}
          onTouchEnd={e => saveSteps(+e.target.value)}
          style={{ width:'100%', accentColor:R, height:6, cursor:'pointer', marginBottom:14 }} />
        <input type="number" value={steps}
          onChange={e => setStepsLocal(+e.target.value)}
          onBlur={e => saveSteps(+e.target.value)}
          className="input" style={{ borderColor:'rgba(220,38,38,0.3)', color:R2 }} />
        <ProgressBar value={steps} max={10000} color={R} label="Meta: 10.000 passos" />
        {saving && <div style={{ color:'#444', fontSize:11, marginTop:6, textAlign:'right' }}>salvando...</div>}
      </NeonCard>
      <NeonCard color={R} style={{ padding:20 }}>
        <SectionTitle color={R}>METAS E BENEFÍCIOS</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {[
            { steps:5000,  label:'5.000',  benefit:'Reduz sedentarismo' },
            { steps:7500,  label:'7.500',  benefit:'Melhora cardiovascular' },
            { steps:10000, label:'10.000', benefit:'Controle de peso' },
            { steps:12500, label:'12.500+',benefit:'Longevidade máxima' },
          ].map(m => {
            const reached = steps >= m.steps
            return (
              <div key={m.label} style={{ padding:'16px 14px', borderRadius:8, background: reached ? DIM : 'rgba(255,255,255,0.02)', border:`1px solid ${reached ? R+'40' : 'rgba(255,255,255,0.06)'}`, borderLeft:`3px solid ${reached ? R : 'rgba(255,255,255,0.06)'}`, transition:'all 0.3s' }}>
                <div style={{ color: reached ? R2 : '#555', fontSize:18, fontWeight:700, marginBottom:4 }}>{m.label}</div>
                <div style={{ color: reached ? '#aaa' : '#444', fontSize:12 }}>{m.benefit}</div>
                {reached && <div style={{ color:R, fontSize:11, marginTop:6 }}>✓ Atingido</div>}
              </div>
            )
          })}
        </div>
      </NeonCard>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function PageHeader({ title, sub, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 24 }}>
      <div style={{ color:R, fontSize:20, letterSpacing:4, fontWeight:700 }}>{title}</div>
      {sub && <div style={{ color:'#555', fontSize:12, letterSpacing:2, marginTop:4 }}>{sub}</div>}
    </div>
  )
}
function StatCard({ label, value, big, highlight }) {
  return (
    <NeonCard color={R} style={{ padding:'18px 14px', textAlign:'center' }}>
      <div style={{ color: highlight ? R : R2, fontSize: big ? 28 : 22, fontWeight:700, lineHeight:1 }}>{value}</div>
      <div style={{ color:'#555', fontSize:11, letterSpacing:2, marginTop:6, textTransform:'uppercase' }}>{label}</div>
    </NeonCard>
  )
}
function FactBanner({ fact, onNext }) {
  if (!fact) return null
  return (
    <div onClick={onNext} style={{ padding:'12px 16px', borderRadius:8, background:'rgba(220,38,38,0.04)', border:'1px solid rgba(220,38,38,0.12)', display:'flex', gap:12, alignItems:'center', cursor:'pointer', marginBottom:18, WebkitTapHighlightColor:'transparent' }}>
      <span style={{ fontSize:20, flexShrink:0 }}>{fact.icon}</span>
      <div>
        <div style={{ color:R2, fontSize:10, letterSpacing:2, marginBottom:3 }}>💡 SABIA QUE... · toque para próximo</div>
        <div style={{ color:'#777', fontSize:13 }}>{fact.fact}</div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getIMCColor(user) {
  const bmi = user.weight / Math.pow(user.height/100, 2)
  if (bmi < 18.5) return '#64748b'
  if (bmi < 25)   return '#dc2626'
  if (bmi < 30)   return '#b45309'
  return '#991b1b'
}

function calcWaterStreak(log) {
  if (!log.length) return 0
  const sorted = [...log].sort((a,b) => b.date.localeCompare(a.date))
  let streak = 0, prev = null
  for (const e of sorted) {
    if (prev === null) { streak = 1; prev = e.date; continue }
    const diff = Math.round((new Date(prev) - new Date(e.date)) / (1000*60*60*24))
    if (diff === 1) { streak++; prev = e.date } else break
  }
  return streak
}

function getCardioSuggestions(user) {
  const bmi   = user.weight / Math.pow(user.height/100, 2)
  const age   = user.age || 25
  const goal  = user.goal || 'maintenance'
  const maxHR = 220 - age
  const sugs  = []

  if (bmi >= 30) {
    sugs.push({ icon:'🚶', title:'CAMINHADA RÁPIDA', zone:'Z2', color:'#94a3b8',
      desc:'Ideal para começar. Baixo impacto nas articulações, alta queima de gordura a longo prazo.',
      duration:'30–45 min', frequency:'5x por semana', kcal: Math.round(user.weight * 0.05 * 35),
      tip:`Mantenha FC entre ${Math.round(maxHR*0.6)}–${Math.round(maxHR*0.7)} bpm. Você deve conseguir conversar sem perder o fôlego.` })
    sugs.push({ icon:'🚴', title:'BIKE OU ELÍPTICO', zone:'Z2', color:'#64748b',
      desc:'Sem impacto nas articulações. Perfeito para quem tem sobrepeso ou dores nos joelhos.',
      duration:'30–40 min', frequency:'4x por semana', kcal: Math.round(user.weight * 0.045 * 35),
      tip:'Comece com resistência baixa. Aumente progressivamente a cada semana.' })
  } else if (bmi >= 25) {
    sugs.push({ icon:'🏃', title:'CORRIDA INTERVALAR', zone:'Z2–Z3', color:'#dc2626',
      desc:'Intercale 2min de corrida com 1min de caminhada. Queima gordura de forma eficiente.',
      duration:'30–40 min', frequency:'4x por semana', kcal: Math.round(user.weight * 0.065 * 35),
      tip:'A cada semana: +1min de corrida e −30s de caminhada até correr contínuo.' })
  } else {
    sugs.push({ icon:'🏃', title:'CORRIDA CONTÍNUA', zone:'Z3', color:'#dc2626',
      desc:'IMC saudável — pode intensificar. Corrida contínua aumenta VO2 máx e capacidade aeróbica.',
      duration:'30–45 min', frequency:'3–4x por semana', kcal: Math.round(user.weight * 0.08 * 35),
      tip:'Mantenha ritmo onde você consegue falar frases curtas sem perder o fôlego.' })
  }

  if (goal === 'weightLoss') {
    sugs.push({ icon:'⚡', title:'HIIT — QUEIMA MÁXIMA', zone:'Z4–Z5', color:'#ef4444',
      desc:'20 min de HIIT queimam mais do que 40 min de cardio moderado e continuam queimando depois.',
      duration:'20–25 min', frequency:'2–3x por semana', kcal: Math.round(user.weight * 0.1 * 22),
      tip:'40s esforço máximo + 20s descanso. Máximo 3x/semana — a recuperação é parte do treino.' })
  }

  if (goal === 'endurance') {
    sugs.push({ icon:'🏊', title:'NATAÇÃO OU REMO', zone:'Z2–Z3', color:'#94a3b8',
      desc:'Trabalha todo o corpo com baixo impacto. Excelente para construir base aeróbica.',
      duration:'40–60 min', frequency:'2–3x por semana', kcal: Math.round(user.weight * 0.07 * 45),
      tip: null })
  }

  if (age >= 40) {
    sugs.push({ icon:'🧘', title:'CARDIO REGENERATIVO', zone:'Z1', color:'#64748b',
      desc:'Após os 40, recuperação é prioridade. Caminhada, yoga e bike leve protegem articulações.',
      duration:'30–40 min', frequency:'2x por semana', kcal: Math.round(user.weight * 0.035 * 35),
      tip:'Ideal nos dias de descanso entre treinos pesados. Melhora circulação e reduz inflamação.' })
  }

  return sugs.slice(0, 4)
}
