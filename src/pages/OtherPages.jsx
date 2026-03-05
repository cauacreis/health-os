import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar, Modal } from '../components/UI'
import { CARDIO_ZONES } from '../data/nutrition'
import { saveCardioEntry, getCardioLog, addCalendarEntry, getWaterLog, saveWaterLog, getTodayWater,
         getTodaySteps, today } from '../lib/db'
import { FUN_FACTS } from '../data/funfacts'
import ProGate from '../components/ProGate'

const R   = '#dc2626'
const R2  = '#ef4444'
const S   = '#94a3b8'
const G   = '#22c55e'
const DIM = 'rgba(220,38,38,0.08)'

// ─── WATER ───────────────────────────────────────────────────────────────────
export function Water({ user, userId }) {
  const [tab, setTab]         = useState('hoje')
  const [consumed, setConsumed] = useState(null)   // null = loading
  const [customMl, setCustomMl] = useState('')
  const [saving, setSaving]   = useState(false)
  const [waterLog, setWaterLog] = useState([])
  const [logLoaded, setLogLoaded] = useState(false)
  const [factIdx, setFactIdx] = useState(0)

  const goal  = Math.round((user.weight || 70) * 35)
  const cups  = Math.round(goal / 250)
  const pct   = consumed ? Math.min((consumed / goal) * 100, 100) : 0
  const facts = FUN_FACTS.filter(f => f.category === 'Hidratação')
  const fact  = facts[factIdx % Math.max(facts.length, 1)]

  // ✅ Carrega água de hoje do water_log (não do profile)
  useEffect(() => {
    getTodayWater(userId).then(ml => setConsumed(ml)).catch(() => setConsumed(0))
  }, [userId])

  useEffect(() => {
    if (tab === 'historico' && !logLoaded) {
      getWaterLog(userId, 30).then(d => { setWaterLog(d); setLogLoaded(true) })
    }
  }, [tab, logLoaded, userId])

  async function saveMl(newMl) {
    setSaving(true)
    try {
      await saveWaterLog(userId, today(), newMl)
      setConsumed(newMl)
    } catch(e) {
      console.error('Erro ao salvar água:', e)
      alert(`Erro ao salvar: ${e.message || JSON.stringify(e)}`)
    } finally { setSaving(false) }
  }

  function toggleCup(idx) {
    if (consumed === null) return
    const cur  = Math.round(consumed / 250)
    const next = cur === idx + 1 ? idx : idx + 1
    saveMl(next * 250)
  }

  function addQuick(ml) { saveMl((consumed || 0) + ml) }

  function addCustom() {
    const ml = parseInt(customMl)
    if (!ml || ml <= 0) return
    setCustomMl('')
    saveMl((consumed || 0) + ml)
  }

  const consumedCups = consumed ? Math.round(consumed / 250) : 0
  const chartData    = waterLog.slice(0, 14).reverse().map(e => ({ date: e.date?.slice(5), ml: e.ml }))
  const avg          = waterLog.length ? Math.round(waterLog.reduce((s,e)=>s+(e.ml||0),0)/waterLog.length) : 0
  const onTarget     = waterLog.filter(e => e.ml >= goal).length
  const streak       = calcWaterStreak(waterLog)

  if (consumed === null) return (
    <div style={{ padding:60, textAlign:'center', color:'#444' }}>Carregando...</div>
  )

  return (
    <div className="animate-fade">
      <PageHeader title="HIDRATAÇÃO" sub={`META: ${goal}ml · ${cups} COPOS`} />

      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[{id:'hoje',label:'💧 Hoje'},{id:'historico',label:'📊 Histórico'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn"
            style={{ flex:1, padding:'10px 0', fontSize:12, background:tab===t.id?DIM:'transparent', borderColor:tab===t.id?R:'rgba(255,255,255,0.08)', color:tab===t.id?R2:'#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hoje' && (
        <>
          <FactBanner fact={fact} onNext={() => setFactIdx(i=>i+1)} />

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {[
              { l:'Consumido', v:`${consumed}ml` },
              { l:'Meta',      v:`${goal}ml` },
              { l:'Progresso', v:`${Math.round(pct)}%`, hi: pct>=100 },
            ].map(s => (
              <NeonCard key={s.l} color={R} style={{ padding:'16px 10px', textAlign:'center' }}>
                <div style={{ color:s.hi?G:R2, fontSize:20, fontWeight:700 }}>{s.v}</div>
                <div style={{ color:'#444', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>

          {/* Copos */}
          <NeonCard color={R} style={{ padding:20, marginBottom:14 }}>
            <SectionTitle color={R}>COPOS DE 250ml</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
              {Array.from({ length: Math.min(cups, 15) }).map((_, i) => {
                const filled = i < consumedCups
                return (
                  <div key={i} onClick={() => toggleCup(i)}
                    style={{ aspectRatio:'1', borderRadius:8, border:`1px solid ${filled?R2+'60':'rgba(255,255,255,0.06)'}`, background:filled?'rgba(220,38,38,0.18)':'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', transition:'all 0.15s', WebkitTapHighlightColor:'transparent' }}>
                    {filled ? '💧' : <span style={{ color:'#2a2a2a' }}>○</span>}
                  </div>
                )
              })}
            </div>
            <ProgressBar value={consumed} max={goal} color={R} label="Hidratação" />
            {saving && <div style={{ color:'#444', fontSize:10, marginTop:6, textAlign:'right' }}>💾 salvando...</div>}
          </NeonCard>

          {/* Quantidade livre */}
          <NeonCard color={S} style={{ padding:18, marginBottom:14 }}>
            <SectionTitle color={S}>ADICIONAR ML LIVRE</SectionTitle>
            <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
              {[100,200,300,500,750,1000].map(v => (
                <button key={v} onClick={() => addQuick(v)}
                  style={{ flex:1, padding:'9px 0', borderRadius:6, border:`1px solid ${S}25`, background:`${S}08`, color:S, fontFamily:"'Space Mono',monospace", fontSize:11, cursor:'pointer', minWidth:48 }}>
                  +{v >= 1000 ? '1L' : `${v}`}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" value={customMl} onChange={e=>setCustomMl(e.target.value)}
                placeholder="quantidade personalizada (ml)" className="input"
                style={{ flex:1, borderColor:`${S}30`, color:S }}
                onKeyDown={e=>e.key==='Enter'&&addCustom()} />
              <button className="btn" onClick={addCustom}
                style={{ background:`${S}10`, borderColor:`${S}50`, color:S, padding:'0 18px', fontSize:18 }}>+</button>
            </div>
          </NeonCard>

          {/* Guia */}
          <NeonCard color={R} style={{ padding:18 }}>
            <SectionTitle color={R}>GUIA DE HIDRATAÇÃO</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { icon:'🌅', l:'Ao acordar',     t:'500ml antes do café' },
                { icon:'🏋️', l:'Antes do treino', t:'400–600ml, 1h antes' },
                { icon:'💪', l:'Durante treino',  t:'150ml a cada 15min' },
                { icon:'🌙', l:'À noite',         t:'Pare 1h antes de dormir' },
              ].map(g => (
                <div key={g.l} style={{ padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{g.icon}</div>
                  <div style={{ color:R2, fontSize:12, fontWeight:700, marginBottom:2 }}>{g.l}</div>
                  <div style={{ color:'#555', fontSize:11 }}>{g.t}</div>
                </div>
              ))}
            </div>
          </NeonCard>
        </>
      )}

      {tab === 'historico' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[
              { l:'Média diária',  v:`${avg}ml`,    c:R2 },
              { l:'Dias na meta',  v:`${onTarget}`, c:S  },
              { l:'Sequência',     v:`${streak}d`,  c:R2 },
            ].map(s => (
              <NeonCard key={s.l} color={R} style={{ padding:'14px 8px', textAlign:'center' }}>
                <div style={{ color:s.c, fontSize:20, fontWeight:700 }}>{s.v}</div>
                <div style={{ color:'#444', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>

          {chartData.length > 1 ? (
            <NeonCard color={R} style={{ padding:18, marginBottom:14 }}>
              <SectionTitle color={R}>CONSUMO ÚLTIMOS 14 DIAS</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} formatter={v=>[`${v}ml`]} />
                  <ReferenceLine y={goal} stroke={`${R}50`} strokeDasharray="4 4" label={{ value:`Meta ${goal}ml`, fill:'#555', fontSize:9, position:'insideTopRight' }} />
                  <Bar dataKey="ml" fill={R} opacity={0.85} radius={[4,4,0,0]} name="ml" />
                </BarChart>
              </ResponsiveContainer>
            </NeonCard>
          ) : (
            <NeonCard color={R} style={{ padding:32, textAlign:'center', marginBottom:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💧</div>
              <div style={{ color:'#444', fontSize:13 }}>Registre água por alguns dias para ver o histórico.</div>
            </NeonCard>
          )}

          {waterLog.length > 0 && (
            <NeonCard color={S} style={{ padding:18 }}>
              <SectionTitle color={S}>TODOS OS REGISTROS</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {waterLog.map((e,i) => {
                  const p  = Math.min((e.ml/goal)*100, 100)
                  const ok = e.ml >= goal
                  return (
                    <div key={i} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${ok?R+'20':'rgba(255,255,255,0.05)'}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{e.date}</span>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ color:ok?G:S, fontSize:13, fontWeight:700 }}>{e.ml}ml</span>
                          {ok && <span style={{ color:G, fontSize:10 }}>✓ Meta</span>}
                        </div>
                      </div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                        <div style={{ width:`${p}%`, height:'100%', background:ok?G:S, borderRadius:2 }} />
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
  const tdee = Math.round(bmr * (user.activity||1.55))
  const barPct = Math.min(((bmi-15)/(40-15))*100,100)
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
          <div style={{ position:'absolute', top:'50%', left:`${barPct}%`, transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:cat.color, border:'3px solid #0d0d10', boxShadow:`0 0 10px ${cat.color}` }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ color:'#333', fontSize:10 }}>15</span><span style={{ color:'#333', fontSize:10 }}>40+</span>
        </div>
      </NeonCard>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[{l:'Peso',v:`${user.weight}kg`},{l:'TMB',v:`${Math.round(bmr)} kcal`},{l:'TDEE',v:`${tdee} kcal`}].map(s=>(
          <NeonCard key={s.l} color={R} style={{ padding:'16px 10px', textAlign:'center' }}>
            <div style={{ color:R2, fontSize:20, fontWeight:700 }}>{s.v}</div>
            <div style={{ color:'#444', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
          </NeonCard>
        ))}
      </div>
      <NeonCard color={R} style={{ padding:20 }}>
        <SectionTitle color={R}>TABELA DE REFERÊNCIA</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[{range:'< 18.5',label:'Abaixo do peso',color:'#64748b'},{range:'18.5–24.9',label:'Peso ideal',color:R},{range:'25–29.9',label:'Sobrepeso',color:'#b45309'},{range:'≥ 30',label:'Obesidade',color:'#991b1b'}].map(r=>(
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

// ─── CARDIO & PASSOS (página unificada) ────────────────────────────────────────
export function CardioSteps({ user, userId, onUpdate }) {
  const [mainTab, setMainTab] = useState('passos')

  return (
    <div className="animate-fade">
      <PageHeader title="ATIVIDADE" sub="Cardio & Passos do dia" noMargin />
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
        {[
          { id:'passos', label:'Passos', icon:'▷' },
          { id:'cardio',  label:'Cardio', icon:'♡' },
        ].map(t => (
          <button key={t.id} onClick={()=>setMainTab(t.id)} className="btn"
            style={{ flex:1, minWidth:120, padding:'12px 16px', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:mainTab===t.id?DIM:'transparent', borderColor:mainTab===t.id?R:'rgba(255,255,255,0.08)', color:mainTab===t.id?R2:'#555' }}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      {mainTab === 'passos' && <StepsContent user={user} userId={userId} onUpdate={onUpdate} />}
      {mainTab === 'cardio'  && <CardioContent user={user} userId={userId} />}
    </div>
  )
}

// ─── CARDIO (conteúdo interno) ─────────────────────────────────────────────────
function CardioContent({ user, userId }) {
  const [tab, setTab]     = useState('registrar')
  const [log, setLog]     = useState([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm]   = useState({ date:today(), type:'Corrida', zone:'Z2', minutes:'', avg_hr:'', kcal:'' })
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const maxHR = 220 - (user.age||25)

  if (!loaded) {
    getCardioLog(userId, 30).then(d => { setLog(d); setLoaded(true) }).catch(() => setLoaded(true))
  }

  async function saveEntry() {
    if (!form.minutes) return
    setSaving(true); setError(null)
    try {
      await saveCardioEntry(userId, { ...form, minutes:+form.minutes, avg_hr:+form.avg_hr||null, kcal:+form.kcal||null })
      await addCalendarEntry(userId, { date:form.date, type:'cardio', note:`${form.type} ${form.minutes}min`, label:'Cardio' }).catch(()=>{})
      setLog(await getCardioLog(userId, 30))
      setForm({ date:today(), type:'Corrida', zone:'Z2', minutes:'', avg_hr:'', kcal:'' })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      setTab('historico')
    } catch (e) {
      console.error('Erro ao salvar cardio:', e)
      setError(e?.message || 'Não foi possível salvar. Verifique a conexão e tente novamente.')
    } finally { setSaving(false) }
  }

  const TYPES    = ['Corrida','Caminhada','Bike','Natação','Remo','HIIT','Elíptico','Pular Corda']
  const sugs     = getCardioSuggestions(user)
  const chartData = log.slice(0,14).reverse().map(e=>({ date:e.date?.slice(5), min:e.minutes }))

  return (
    <div className="animate-fade">
      <PageHeader title="CARDIO" sub={`FC MÁX ESTIMADA: ${maxHR} BPM`} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:18 }}>
        {[{id:'registrar',label:'➕ Registrar'},{id:'zonas',label:'❤️ Zonas FC'},{id:'sugestoes',label:'🎯 Sugestões'},{id:'historico',label:'📊 Histórico'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="btn"
            style={{ padding:'10px 0', fontSize:10, background:tab===t.id?DIM:'transparent', borderColor:tab===t.id?R:'rgba(255,255,255,0.08)', color:tab===t.id?R2:'#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==='zonas' && (
          <ProGate isPro={user?.isPro} feature="As zonas de frequência cardíaca personalizadas">
        <NeonCard color={R} style={{ padding:20 }}>
          <SectionTitle color={R}>ZONAS DE FREQUÊNCIA CARDÍACA</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {CARDIO_ZONES.map(z=>{
              const low=Math.round(maxHR*z.pctLow/100), high=Math.round(maxHR*z.pctHigh/100)
              return (
                <div key={z.zone} style={{ padding:'12px 16px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${z.color}25`, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ background:z.color, color:'#fff', borderRadius:6, padding:'4px 10px', fontWeight:700, fontSize:13, flexShrink:0, minWidth:36, textAlign:'center' }}>{z.zone}</div>
                  <div style={{ flex:1 }}>
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
          </ProGate>
      )}

      {tab==='sugestoes' && (
        <>
          <NeonCard color={S} style={{ padding:12, marginBottom:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[{l:'IMC',v:(user.weight/Math.pow(user.height/100,2)).toFixed(1),c:getIMCColor(user)},{l:'Objetivo',v:user.goal==='muscleGain'?'Músculo':user.goal==='weightLoss'?'Perda peso':'Manutenção',c:R2},{l:'FC Máx',v:`${maxHR}bpm`,c:S}].map(s=>(
                <div key={s.l} style={{ padding:'8px',background:`${s.c}0a`,border:`1px solid ${s.c}20`,borderRadius:6,textAlign:'center' }}>
                  <div style={{ color:'#444',fontSize:9,letterSpacing:1,marginBottom:2 }}>{s.l}</div>
                  <div style={{ color:s.c,fontSize:13,fontWeight:700 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </NeonCard>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {sugs.map((s,i)=>(
              <NeonCard key={i} color={s.color} style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:26, flexShrink:0 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ color:s.color, fontSize:12, fontWeight:700, letterSpacing:1 }}>{s.title}</div>
                      <span style={{ background:`${s.color}15`, color:s.color, fontSize:9, padding:'3px 8px', borderRadius:3 }}>{s.zone}</span>
                    </div>
                    <div style={{ color:'#aaa', fontSize:13, marginBottom:8 }}>{s.desc}</div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      <span style={{ color:'#555', fontSize:11 }}>⏱ {s.duration}</span>
                      <span style={{ color:'#555', fontSize:11 }}>📅 {s.frequency}</span>
                      <span style={{ color:'#555', fontSize:11 }}>🔥 ~{s.kcal} kcal</span>
                    </div>
                    {s.tip&&<div style={{ marginTop:8,padding:'8px 10px',borderRadius:6,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#666',fontSize:11,lineHeight:1.5 }}>💡 {s.tip}</div>}
                  </div>
                </div>
              </NeonCard>
            ))}
          </div>
        </>
      )}

      {tab==='historico' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[{l:'Sessões',v:log.length,c:R2},{l:'Minutos',v:log.reduce((a,e)=>a+(e.minutes||0),0),c:S},{l:'Kcal',v:log.reduce((a,e)=>a+(e.kcal||0),0),c:R2}].map(s=>(
              <NeonCard key={s.l} color={R} style={{ padding:'14px 10px', textAlign:'center' }}>
                <div style={{ color:s.c, fontSize:22, fontWeight:700 }}>{s.v}</div>
                <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>
          {chartData.length>1&&(
            <NeonCard color={R} style={{ padding:18, marginBottom:14 }}>
              <SectionTitle color={R}>MINUTOS POR SESSÃO</SectionTitle>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} />
                  <Bar dataKey="min" fill={R} opacity={0.85} radius={[4,4,0,0]} name="Min" />
                </BarChart>
              </ResponsiveContainer>
            </NeonCard>
          )}
          {log.length>0 ? (
            <NeonCard color={R} style={{ padding:18 }}>
              <SectionTitle color={R}>TODAS AS SESSÕES</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {log.map((e,i)=>(
                  <div key={i} style={{ padding:'11px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(220,38,38,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div><div style={{ color:R2, fontSize:13, fontWeight:700 }}>{e.type}</div><div style={{ color:'#555', fontSize:11, marginTop:2 }}>{e.date} · {e.zone}</div></div>
                    <div style={{ textAlign:'right' }}><div style={{ color:'#d0d0d0', fontSize:14, fontWeight:700 }}>{e.minutes}min</div>{e.kcal&&<div style={{ color:'#555', fontSize:11 }}>{e.kcal} kcal</div>}</div>
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

      {tab==='registrar' && (
        <NeonCard color={R} style={{ padding:22 }}>
          <SectionTitle color={R}>REGISTRAR SESSÃO DE CARDIO</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label className="label">DATA</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="input" style={{ borderColor:`${R}35`, color:R2 }} />
            </div>
            <div>
              <label className="label">TIPO</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="select">
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ZONA</label>
              <select value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} className="select">
                {['Z1','Z2','Z3','Z4','Z5'].map(z=><option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="label">DURAÇÃO (min)</label>
              <input type="number" value={form.minutes} onChange={e=>setForm(f=>({...f,minutes:e.target.value}))} placeholder="30" className="input" style={{ borderColor:`${R}35`, color:R2 }} />
            </div>
            <div>
              <label className="label">FC MÉDIA (bpm)</label>
              <input type="number" value={form.avg_hr} onChange={e=>setForm(f=>({...f,avg_hr:e.target.value}))} placeholder="140" className="input" />
            </div>
            <div>
              <label className="label">CALORIAS (kcal)</label>
              <input type="number" value={form.kcal} onChange={e=>setForm(f=>({...f,kcal:e.target.value}))} placeholder="250" className="input" />
            </div>
          </div>
          {error && (
            <div style={{ padding:'10px 14px', marginBottom:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:12 }}>
              {error}
            </div>
          )}
          <button className="btn" onClick={saveEntry} disabled={saving}
            style={{ width:'100%', background:saved?'rgba(34,197,94,0.15)':DIM, borderColor:saved?G:R, color:saved?G:R2, padding:14, fontSize:13, transition:'all 0.3s', opacity:saving?0.7:1 }}>
            {saved ? '✓ SESSÃO SALVA!' : saving ? 'Salvando...' : '💾 SALVAR SESSÃO'}
          </button>
        </NeonCard>
      )}
    </div>
  )
}

// ─── STEPS (conteúdo interno da página Atividade) ─────────────────────────────
function StepsContent({ user, userId, onUpdate }) {
  const [steps, setStepsLocal] = useState(null)  // null = loading
  const [saving, setSaving]    = useState(false)
  const [customAdd, setCustomAdd] = useState('')
  const facts = FUN_FACTS.filter(f=>f.category==='Passos')
  const [factIdx,setFactIdx]   = useState(0)
  const fact  = facts[factIdx % Math.max(facts.length,1)]

  useEffect(() => {
    getTodaySteps(userId).then(v => setStepsLocal(v ?? 0)).catch(() => setStepsLocal(0))
  }, [userId])

  const stepsVal = steps ?? 0
  const kcal  = Math.round(stepsVal*0.04)
  const km    = (stepsVal*0.00075).toFixed(2)

  async function saveSteps(val) {
    const v=Math.max(0,Math.min(50000,val)); setStepsLocal(v); setSaving(true)
    try {
      const db = await import('../lib/db')
      await db.saveStepsEntry(userId, db.today(), v)
      const u = await db.upsertProfile(userId, { steps_today: v })
      onUpdate(u)
    } catch(e){console.error(e)} finally{setSaving(false)}
  }
  function addSteps(n) {
    const newVal = Math.min(50000, stepsVal + n)
    saveSteps(newVal)
  }
  function addCustom() {
    const n = parseInt(customAdd)
    if (!n || n <= 0) return
    setCustomAdd('')
    addSteps(n)
  }

  if (steps === null) return <div style={{ padding:60, textAlign:'center', color:'#555' }}>Carregando...</div>

  return (
    <div className="animate-fade">
      <PageHeader title="PASSOS DO DIA" sub="ATIVIDADE DIÁRIA" />
      <FactBanner fact={fact} onNext={()=>setFactIdx(i=>i+1)} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[{l:'Passos',v:stepsVal.toLocaleString('pt-BR'),big:true},{l:'Calorias',v:`${kcal} kcal`},{l:'Distância',v:`${km} km`}].map(s=>(
          <NeonCard key={s.l} color={R} style={{ padding:'16px 10px', textAlign:'center' }}>
            <div style={{ color:R2, fontSize:s.big?26:20, fontWeight:700 }}>{s.v}</div>
            <div style={{ color:'#444', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
          </NeonCard>
        ))}
      </div>
      <NeonCard color={R} style={{ padding:22, marginBottom:16 }}>
        <SectionTitle color={R}>REGISTRAR PASSOS</SectionTitle>
        <input type="range" min="0" max="20000" step="100" value={stepsVal} onChange={e=>setStepsLocal(+e.target.value)} onMouseUp={e=>saveSteps(+e.target.value)} onTouchEnd={e=>saveSteps(+e.target.value)} style={{ width:'100%', accentColor:R, height:6, cursor:'pointer', marginBottom:14 }} />
        <input type="number" value={stepsVal} onChange={e=>setStepsLocal(+e.target.value||0)} onBlur={e=>{ const v=+e.target.value; if (!isNaN(v)) saveSteps(v) }} className="input" style={{ borderColor:'rgba(220,38,38,0.3)', color:R2 }} />
        <SectionTitle color={S} style={{ marginTop:16, marginBottom:10 }}>ADICIONAR PASSOS PERSONALIZADOS</SectionTitle>
        <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
          {[1000, 2000, 3000, 5000, 10000].map(v => (
            <button key={v} onClick={()=>addSteps(v)}
              style={{ flex:1, minWidth:60, padding:'10px 0', borderRadius:6, border:`1px solid ${S}25`, background:`${S}08`, color:S, fontFamily:"'Space Mono',monospace", fontSize:11, cursor:'pointer' }}>
              +{v.toLocaleString('pt-BR')}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input type="number" value={customAdd} onChange={e=>setCustomAdd(e.target.value)} placeholder="Quantidade personalizada" className="input" style={{ flex:1, borderColor:`${S}30`, color:S }} onKeyDown={e=>e.key==='Enter'&&addCustom()} />
          <button className="btn" onClick={addCustom} style={{ background:`${S}10`, borderColor:`${S}50`, color:S, padding:'0 18px', fontSize:18 }}>+</button>
        </div>
        <ProgressBar value={stepsVal} max={10000} color={R} label="Meta: 10.000 passos" />
        {saving&&<div style={{ color:'#444', fontSize:11, marginTop:6, textAlign:'right' }}>salvando...</div>}
      </NeonCard>
      <NeonCard color={R} style={{ padding:20 }}>
        <SectionTitle color={R}>METAS E BENEFÍCIOS</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {[{steps:5000,label:'5.000',benefit:'Reduz sedentarismo'},{steps:7500,label:'7.500',benefit:'Melhora cardiovascular'},{steps:10000,label:'10.000',benefit:'Controle de peso'},{steps:12500,label:'12.500+',benefit:'Longevidade máxima'}].map(m=>{
            const reached=stepsVal>=m.steps
            return (
              <div key={m.label} style={{ padding:'16px 14px', borderRadius:8, background:reached?DIM:'rgba(255,255,255,0.02)', border:`1px solid ${reached?R+'40':'rgba(255,255,255,0.06)'}`, borderLeft:`3px solid ${reached?R:'rgba(255,255,255,0.06)'}` }}>
                <div style={{ color:reached?R2:'#555', fontSize:18, fontWeight:700, marginBottom:4 }}>{m.label}</div>
                <div style={{ color:reached?'#aaa':'#444', fontSize:12 }}>{m.benefit}</div>
                {reached&&<div style={{ color:R, fontSize:11, marginTop:6 }}>✓ Atingido</div>}
              </div>
            )
          })}
        </div>
      </NeonCard>
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function PageHeader({ title, sub, noMargin }) {
  return (
    <div style={{ marginBottom:noMargin?0:24 }}>
      <div style={{ color:R, fontSize:20, letterSpacing:4, fontWeight:700 }}>{title}</div>
      {sub&&<div style={{ color:'#555', fontSize:12, letterSpacing:2, marginTop:4 }}>{sub}</div>}
    </div>
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
  const bmi=user.weight/Math.pow(user.height/100,2)
  if (bmi<18.5) return '#64748b'; if (bmi<25) return R; if (bmi<30) return '#b45309'; return '#991b1b'
}
function calcWaterStreak(log) {
  if (!log.length) return 0
  const sorted=[...log].sort((a,b)=>b.date.localeCompare(a.date))
  let streak=0,prev=null
  for (const e of sorted) {
    if (prev===null){streak=1;prev=e.date;continue}
    const diff=Math.round((new Date(prev)-new Date(e.date))/(1000*60*60*24))
    if (diff===1){streak++;prev=e.date} else break
  }
  return streak
}
function getCardioSuggestions(user) {
  const bmi=user.weight/Math.pow(user.height/100,2),age=user.age||25,goal=user.goal||'maintenance',maxHR=220-age,sugs=[]
  if (bmi>=30) {
    sugs.push({icon:'🚶',title:'CAMINHADA RÁPIDA',zone:'Z2',color:S,desc:'Ideal para começar. Baixo impacto, alta queima de gordura.',duration:'30–45 min',frequency:'5x/semana',kcal:Math.round(user.weight*0.05*35),tip:`FC entre ${Math.round(maxHR*0.6)}–${Math.round(maxHR*0.7)} bpm.`})
    sugs.push({icon:'🚴',title:'BIKE OU ELÍPTICO',zone:'Z2',color:'#64748b',desc:'Sem impacto nas articulações. Protege joelhos.',duration:'30–40 min',frequency:'4x/semana',kcal:Math.round(user.weight*0.045*35),tip:'Comece com resistência baixa.'})
  } else if (bmi>=25) {
    sugs.push({icon:'🏃',title:'CORRIDA INTERVALAR',zone:'Z2–Z3',color:R,desc:'2min corrida + 1min caminhada. Queima gordura eficientemente.',duration:'30–40 min',frequency:'4x/semana',kcal:Math.round(user.weight*0.065*35),tip:'Cada semana: +1min corrida, −30s caminhada.'})
  } else {
    sugs.push({icon:'🏃',title:'CORRIDA CONTÍNUA',zone:'Z3',color:R,desc:'IMC saudável — intensifique. Aumenta VO2 máx.',duration:'30–45 min',frequency:'3–4x/semana',kcal:Math.round(user.weight*0.08*35),tip:'Ritmo onde consegue falar frases curtas.'})
  }
  if (goal==='weightLoss') sugs.push({icon:'⚡',title:'HIIT',zone:'Z4–Z5',color:R2,desc:'20 min de HIIT > 40 min cardio moderado. Queima pós-exercício.',duration:'20–25 min',frequency:'2–3x/semana',kcal:Math.round(user.weight*0.1*22),tip:'40s esforço + 20s descanso. Máx 3x/semana.'})
  if (goal==='endurance') sugs.push({icon:'🏊',title:'NATAÇÃO OU REMO',zone:'Z2–Z3',color:S,desc:'Todo o corpo, baixo impacto. Base aeróbica sólida.',duration:'40–60 min',frequency:'2–3x/semana',kcal:Math.round(user.weight*0.07*45),tip:null})
  if (age>=40) sugs.push({icon:'🧘',title:'CARDIO REGENERATIVO',zone:'Z1',color:'#64748b',desc:'Recuperação ativa. Protege articulações.',duration:'30–40 min',frequency:'2x/semana',kcal:Math.round(user.weight*0.035*35),tip:'Nos dias de descanso entre treinos pesados.'})
  return sugs.slice(0,4)
}
