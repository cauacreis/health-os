import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar, Modal } from '../components/UI'
import { CARDIO_ZONES, WEEKLY_STEPS } from '../data/nutrition'
import { updateUser, saveCardioEntry, getCardioLog, addCalendarEntry, today } from '../lib/storage'
import { FUN_FACTS } from '../data/funfacts'

// ─── WATER ───────────────────────────────────────────────────────────────────
export function Water({ user, onUpdate }) {
  const [consumed, setConsumed] = useState(user.waterToday || 0)
  const [meals, setMeals] = useState(user.mealsToday || 0)
  const goal = Math.round(user.weight * 35)
  const facts = FUN_FACTS.filter(f=>f.category==='Hidratação')
  const [factIdx, setFactIdx] = useState(0)

  function toggleCup(idx) {
    const next = consumed === idx+1 ? idx : idx+1
    setConsumed(next)
    const updated = updateUser(user.id, { waterToday: next })
    onUpdate(updated)
  }
  function setMealsVal(v) {
    setMeals(v)
    const updated = updateUser(user.id, { mealsToday: v })
    onUpdate(updated)
  }

  const ml = consumed * 250
  const cups = Math.round(goal/250)
  const fact = facts[factIdx % facts.length]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#00d4ff', fontSize:22, letterSpacing:4, fontWeight:700 }}>HIDRATAÇÃO & REFEIÇÕES</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>META: {goal}ml · {cups} COPOS</div>
      </div>

      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#00d4ff', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 HIDRATAÇÃO · clique para próximo</div>
          <div style={{ color:'#888', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <NeonCard color="#00d4ff" style={{ padding:22 }}>
          <SectionTitle color="#00d4ff">COPOS DE 250ml</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:7, marginBottom:18 }}>
            {Array.from({ length:Math.min(cups,15) }).map((_,i) => {
              const filled = i < consumed
              return (
                <div key={i} onClick={() => toggleCup(i)} style={{ aspectRatio:'1', borderRadius:7, border:`1px solid ${filled?'#00d4ff50':'#ffffff08'}`, background:filled?'rgba(0,212,255,0.14)':'rgba(255,255,255,0.02)', boxShadow:filled?'0 0 8px rgba(0,212,255,0.2)':'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer', transition:'all 0.15s' }}>
                  {filled ? '💧' : <span style={{ color:'#1a1a1a', fontSize:14 }}>◌</span>}
                </div>
              )
            })}
          </div>
          <ProgressBar value={ml} max={goal} color="#00d4ff" label="Hidratação" />
          <div style={{ textAlign:'center', marginTop:10, color:'#00d4ff', fontSize:30, fontWeight:700 }}>
            {ml}<span style={{ fontSize:13, color:'#555' }}>ml</span>
          </div>
          <div style={{ color:'#444', fontSize:10, textAlign:'center', marginTop:4 }}>{consumed} de {cups} copos</div>
        </NeonCard>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Meals counter */}
          <NeonCard color="#ff9f43" style={{ padding:18 }}>
            <SectionTitle color="#ff9f43">REFEIÇÕES HOJE</SectionTitle>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:12 }}>
              <button onClick={() => setMealsVal(Math.max(0,meals-1))} style={{ width:36, height:36, borderRadius:6, background:'rgba(255,159,67,0.1)', border:'1px solid rgba(255,159,67,0.3)', color:'#ff9f43', fontSize:18, cursor:'pointer', fontFamily:'monospace' }}>−</button>
              <div style={{ textAlign:'center' }}>
                <div style={{ color:'#ff9f43', fontSize:40, fontWeight:700, lineHeight:1 }}>{meals}</div>
                <div style={{ color:'#555', fontSize:10, letterSpacing:2, marginTop:4 }}>REFEIÇÕES</div>
              </div>
              <button onClick={() => setMealsVal(Math.min(10,meals+1))} style={{ width:36, height:36, borderRadius:6, background:'rgba(255,159,67,0.1)', border:'1px solid rgba(255,159,67,0.3)', color:'#ff9f43', fontSize:18, cursor:'pointer', fontFamily:'monospace' }}>+</button>
            </div>
            <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} onClick={()=>setMealsVal(n)} style={{ width:28, height:28, borderRadius:4, border:`1px solid ${n<=meals?'rgba(255,159,67,0.4)':'#ffffff08'}`, background:n<=meals?'rgba(255,159,67,0.15)':'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, cursor:'pointer', transition:'all 0.15s' }}>
                  {n<=meals?'🍽':''}
                </div>
              ))}
            </div>
            <ProgressBar value={meals} max={6} color="#ff9f43" label="Meta: 6 refeições/dia" />
          </NeonCard>

          {[
            { time:'Ao acordar', amount:'300ml', tip:'Reidrata após o sono e ativa o metabolismo' },
            { time:'Pré-treino', amount:'500ml', tip:'1–2h antes do exercício' },
            { time:'Durante treino', amount:'600ml', tip:'150–250ml a cada 15–20min' },
            { time:'Pós-treino', amount:'500ml', tip:'Repõe fluidos pelo suor' },
          ].map(h => (
            <NeonCard key={h.time} color="#00d4ff" style={{ padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#00d4ff', fontSize:10, textTransform:'uppercase', letterSpacing:2 }}>{h.time}</div>
                <div style={{ color:'#555', fontSize:10, marginTop:2 }}>{h.tip}</div>
              </div>
              <div style={{ color:'#00d4ff', fontSize:16, fontWeight:700 }}>{h.amount}</div>
            </NeonCard>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── BMI ─────────────────────────────────────────────────────────────────────
export function BMI({ user }) {
  const bmi = (user.weight / Math.pow(user.height/100,2)).toFixed(1)
  const bmiLabel = bmi<18.5?'Abaixo do Peso':bmi<25?'Normal':bmi<30?'Sobrepeso':'Obesidade'
  const bmiColor = bmi<18.5?'#00d4ff':bmi<25?'#00ff88':bmi<30?'#ff9f43':'#ff6b6b'
  const latestBio = null // could integrate with user.bioimpedance

  const recs = bmi<18.5
    ? ['Aumentar ingestão calórica (superávit +500 kcal)','Priorizar treinos de hipertrofia','Proteína: 2.2g/kg/dia','Consulte um nutricionista']
    : bmi<25
    ? ['Manter hábitos atuais','Variação de treinos para manutenção','TDEE equilibrado','Check-up anual']
    : bmi<30
    ? ['Déficit calórico moderado (−300 a −500 kcal/dia)','Cardio 3–4x por semana','Aumentar fibras e proteína','Reduzir açúcares refinados']
    : ['Acompanhamento médico recomendado','Exercícios de baixo impacto','Déficit gradual max −500 kcal/dia','Suporte psicológico e nutricional']

  const pct = Math.min(Math.max((bmi-15)/25,0),1)*100

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:28 }}>
        <div style={{ color:'#00ff88', fontSize:22, letterSpacing:4, fontWeight:700 }}>ÍNDICE DE MASSA CORPORAL</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>ANÁLISE DE COMPOSIÇÃO CORPORAL</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <NeonCard color="#00ff88" style={{ padding:22 }}>
          <SectionTitle color="#00ff88">DADOS DO PERFIL</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{l:'PESO',v:`${user.weight} kg`},{l:'ALTURA',v:`${user.height} cm`}].map(f=>(
              <div key={f.l} style={{ padding:14, background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.08)', borderRadius:6, textAlign:'center' }}>
                <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginBottom:6 }}>{f.l}</div>
                <div style={{ color:'#00ff88', fontSize:22, fontWeight:700 }}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, color:'#555', fontSize:11, lineHeight:1.8 }}>
            ▸ Fórmula: <span style={{ color:'#888' }}>peso ÷ (altura)²</span><br />
            ▸ Resultado: <span style={{ color:'#888' }}>{user.weight} ÷ {(user.height/100).toFixed(2)}² = {bmi}</span>
          </div>
        </NeonCard>
        <NeonCard color={bmiColor} style={{ padding:22, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:130, height:130, borderRadius:'50%', border:`3px solid ${bmiColor}50`, background:`radial-gradient(circle,${bmiColor}10 0%,transparent 70%)`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', animation:'float 3s ease-in-out infinite', marginBottom:14 }}>
            <div style={{ color:bmiColor, fontSize:40, fontWeight:700 }}>{bmi}</div>
            <div style={{ color:'#555', fontSize:10 }}>kg/m²</div>
          </div>
          <div style={{ color:bmiColor, fontSize:15, letterSpacing:3, fontWeight:700 }}>{bmiLabel.toUpperCase()}</div>
        </NeonCard>
      </div>
      <NeonCard color="#00ff88" style={{ padding:20, marginBottom:16 }}>
        <SectionTitle color="#00ff88">ESCALA DE IMC</SectionTitle>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[{l:'Abaixo',r:'<18.5',c:'#00d4ff'},{l:'Normal',r:'18.5–24.9',c:'#00ff88'},{l:'Sobrepeso',r:'25–29.9',c:'#ff9f43'},{l:'Obesidade',r:'≥30',c:'#ff6b6b'}].map(s=>(
            <div key={s.l} style={{ flex:1, padding:'10px 8px', borderRadius:6, background:`${s.c}08`, border:`1px solid ${s.c}20`, textAlign:'center' }}>
              <div style={{ color:s.c, fontSize:12, fontWeight:700 }}>{s.r}</div>
              <div style={{ color:'#555', fontSize:9, letterSpacing:1.5, marginTop:4 }}>{s.l.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={{ position:'relative', height:8 }}>
          <div style={{ width:'100%', height:8, borderRadius:4, overflow:'hidden', display:'flex' }}>
            <div style={{ flex:1, background:'linear-gradient(90deg,#00d4ff,#00ff88)' }} />
            <div style={{ flex:1, background:'linear-gradient(90deg,#00ff88,#ff9f43)' }} />
            <div style={{ flex:1, background:'linear-gradient(90deg,#ff9f43,#ff6b6b)' }} />
          </div>
          <div style={{ position:'absolute', top:-2, width:12, height:12, borderRadius:'50%', left:`calc(${pct}% - 6px)`, background:bmiColor, boxShadow:`0 0 8px ${bmiColor}` }} />
        </div>
      </NeonCard>
      <NeonCard color={bmiColor} style={{ padding:20 }}>
        <SectionTitle color={bmiColor}>RECOMENDAÇÕES PERSONALIZADAS</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {recs.map((r,i)=>(
            <div key={i} style={{ padding:'10px 14px', borderRadius:6, background:`${bmiColor}07`, border:`1px solid ${bmiColor}15`, display:'flex', gap:8 }}>
              <span style={{ color:bmiColor, flexShrink:0 }}>▸</span>
              <span style={{ color:'#aaa', fontSize:12 }}>{r}</span>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}

// ─── CARDIO ──────────────────────────────────────────────────────────────────
export function Cardio({ user }) {
  const maxHR = 220 - user.age
  const [logModal, setLogModal] = useState(false)
  const [cardioLog, setCardioLog] = useState(() => getCardioLog(user.id))
  const [form, setForm] = useState({ date:today(), type:'Corrida', zone:'Z2', minutes:'', avgHr:'', kcal:'', note:'' })
  const [factIdx, setFactIdx] = useState(0)

  const facts = FUN_FACTS.filter(f=>f.category==='Cardio')
  const fact = facts[factIdx % facts.length]

  const CARDIO_TYPES = ['Corrida','Caminhada','Ciclismo','Natação','Jump Rope','Elíptico','HIIT','Remo','Kickboxing','Dança']

  function suggestCardio() {
    const bmi = user.weight / Math.pow(user.height/100,2)
    const level = user.activity >= 1.725 ? 'avançado' : user.activity >= 1.55 ? 'intermediário' : 'iniciante'
    if (level === 'iniciante') return [
      { type:'Caminhada rápida', zone:'Z2', dur:'30–40min', tip:'Ritmo de conversa possível. Ideal para construir base aeróbica.' },
      { type:'Ciclismo leve', zone:'Z1–Z2', dur:'30min', tip:'Baixo impacto articular. Excelente para iniciantes.' },
    ]
    if (level === 'intermediário') return [
      { type:'Corrida contínua', zone:'Z2–Z3', dur:'40–50min', tip:'Mantenha ritmo onde você consegue falar mas com esforço.' },
      { type:'Ciclismo intervalado', zone:'Z3–Z4', dur:'35min', tip:'2min forte + 3min leve. 6 repetições.' },
      { type:'Jump Rope HIIT', zone:'Z4', dur:'20–25min', tip:'30s intenso + 30s recuperação. 10 rounds.' },
    ]
    return [
      { type:'HIIT Corrida', zone:'Z4–Z5', dur:'25–30min', tip:'8x (30s sprint + 90s recovery). Potência máxima.' },
      { type:'Tempo Run', zone:'Z3–Z4', dur:'40–50min', tip:'Ritmo constante no limiar anaeróbico.' },
      { type:'Long Slow Run', zone:'Z2', dur:'60–90min', tip:'Ritmo lento. Constrói base aeróbica e queima gordura.' },
    ]
  }

  function saveCardio() {
    if (!form.minutes) return
    saveCardioEntry(user.id, form)
    addCalendarEntry(user.id, { date:form.date, type:'cardio', label:`${form.type} ${form.zone}`, note:`${form.minutes}min` })
    setCardioLog(getCardioLog(user.id))
    setLogModal(false)
    setForm({ date:today(), type:'Corrida', zone:'Z2', minutes:'', avgHr:'', kcal:'', note:'' })
  }

  const suggestions = suggestCardio()

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#ff6b6b', fontSize:22, letterSpacing:4, fontWeight:700 }}>CARDIO</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>ZONAS DE FREQUÊNCIA CARDÍACA E ROTINA</div>
      </div>

      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,107,107,0.04)', border:'1px solid rgba(255,107,107,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#ff6b6b', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 CARDIO · clique para próximo</div>
          <div style={{ color:'#888', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Zones */}
        <NeonCard color="#ff6b6b" style={{ padding:20 }}>
          <SectionTitle color="#ff6b6b">SUAS ZONAS (FC Máx: {maxHR} BPM)</SectionTitle>
          {CARDIO_ZONES.map(z => {
            const [lo,hi] = z.pct.split('–').map(Number)
            return (
              <div key={z.zone} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', borderRadius:6, background:`${z.color}08`, border:`1px solid ${z.color}15`, marginBottom:6 }}>
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                    <span style={{ color:z.color, fontSize:11, fontWeight:700 }}>{z.zone}</span>
                    <span style={{ color:'#888', fontSize:11 }}>{z.name}</span>
                  </div>
                  <div style={{ color:'#555', fontSize:10 }}>{z.benefit}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:z.color, fontSize:14, fontWeight:700 }}>{Math.round(maxHR*lo/100)}–{Math.round(maxHR*hi/100)}</div>
                  <div style={{ color:'#444', fontSize:9 }}>BPM · {z.pct}%</div>
                </div>
              </div>
            )
          })}
        </NeonCard>

        {/* Suggestions + log */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <NeonCard color="#4ecdc4" style={{ padding:18 }}>
            <SectionTitle color="#4ecdc4">SUGESTÃO PARA SEU NÍVEL</SectionTitle>
            <div style={{ color:'#555', fontSize:10, marginBottom:10 }}>
              Nível: <span style={{ color:'#4ecdc4' }}>{user.activity>=1.725?'Avançado':user.activity>=1.55?'Intermediário':'Iniciante'}</span>
            </div>
            {suggestions.map((s,i) => (
              <div key={i} style={{ padding:'10px 12px', borderRadius:6, background:'rgba(78,205,196,0.05)', border:'1px solid rgba(78,205,196,0.12)', marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:'#4ecdc4', fontSize:12, fontWeight:700 }}>{s.type}</span>
                  <span style={{ color:'#555', fontSize:10 }}>{s.dur}</span>
                </div>
                <div style={{ color:'#888', fontSize:10, lineHeight:1.5 }}>{s.tip}</div>
                <div style={{ color:'#4ecdc4', fontSize:9, marginTop:4, letterSpacing:1 }}>Zona: {s.zone}</div>
              </div>
            ))}
          </NeonCard>

          <NeonCard color="#ff6b6b" style={{ padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <SectionTitle color="#ff6b6b">HISTÓRICO DE CARDIO</SectionTitle>
              <button className="btn" onClick={() => setLogModal(true)} style={{ fontSize:10, padding:'6px 12px', color:'#ff6b6b', borderColor:'rgba(255,107,107,0.3)' }}>+ REGISTRAR</button>
            </div>
            {cardioLog.slice(0,4).length === 0
              ? <div style={{ color:'#333', fontSize:11 }}>Nenhum cardio registrado ainda.</div>
              : cardioLog.slice(0,4).map(e => (
                <div key={e.id} style={{ padding:'8px 10px', borderRadius:5, background:'rgba(255,107,107,0.05)', border:'1px solid rgba(255,107,107,0.1)', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ color:'#ff6b6b', fontSize:12, fontWeight:700 }}>{e.type} · {e.zone}</div>
                    <div style={{ color:'#555', fontSize:10 }}>{e.date} · {e.minutes}min{e.avgHr?` · ${e.avgHr}bpm`:''}</div>
                  </div>
                  {e.kcal && <div style={{ color:'#ff6b6b', fontSize:13, fontWeight:700 }}>{e.kcal} kcal</div>}
                </div>
              ))
            }
          </NeonCard>
        </div>
      </div>

      {logModal && (
        <Modal title="REGISTRAR CARDIO" color="#ff6b6b" onClose={() => setLogModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">DATA</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="input" style={{ borderColor:'rgba(255,107,107,0.25)', color:'#ff6b6b' }} />
            </div>
            <div>
              <label className="label">TIPO DE CARDIO</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="select" style={{ borderColor:'rgba(255,107,107,0.2)', color:'#ff6b6b' }}>
                {CARDIO_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ZONA</label>
              <select value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} className="select" style={{ borderColor:'rgba(255,107,107,0.2)', color:'#ff6b6b' }}>
                {CARDIO_ZONES.map(z=><option key={z.zone} value={z.zone}>{z.zone} — {z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">DURAÇÃO (min)</label>
              <input type="number" value={form.minutes} onChange={e=>setForm(f=>({...f,minutes:e.target.value}))} placeholder="ex: 45" className="input" style={{ borderColor:'rgba(255,107,107,0.25)', color:'#ff6b6b' }} />
            </div>
            <div>
              <label className="label">FC MÉDIA (bpm)</label>
              <input type="number" value={form.avgHr} onChange={e=>setForm(f=>({...f,avgHr:e.target.value}))} placeholder="ex: 145" className="input" style={{ borderColor:'rgba(255,107,107,0.25)', color:'#ff6b6b' }} />
            </div>
            <div>
              <label className="label">CALORIAS QUEIMADAS</label>
              <input type="number" value={form.kcal} onChange={e=>setForm(f=>({...f,kcal:e.target.value}))} placeholder="ex: 320" className="input" style={{ borderColor:'rgba(255,107,107,0.25)', color:'#ff6b6b' }} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">OBSERVAÇÕES</label>
              <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Como foi? Fartlek, hills, etc..." className="input" style={{ borderColor:'rgba(255,107,107,0.2)' }} />
            </div>
          </div>
          <button className="btn" onClick={saveCardio} style={{ width:'100%', marginTop:16, background:'rgba(255,107,107,0.12)', borderColor:'#ff6b6b', color:'#ff6b6b' }}>
            SALVAR CARDIO
          </button>
        </Modal>
      )}
    </div>
  )
}

// ─── STEPS ───────────────────────────────────────────────────────────────────
export function Steps({ user, onUpdate }) {
  const [steps, setStepsLocal] = useState(user.stepsToday || 0)
  const facts = FUN_FACTS.filter(f=>f.category==='Passos')
  const [factIdx, setFactIdx] = useState(0)
  const fact = facts[factIdx % facts.length]

  function updateSteps(v) {
    const val = Math.max(0, Math.min(50000, v))
    setStepsLocal(val)
    const updated = updateUser(user.id, { stepsToday: val })
    onUpdate(updated)
  }

  const kcal = Math.round(steps * 0.04)
  const km = (steps * 0.00075).toFixed(2)

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#f7c59f', fontSize:22, letterSpacing:4, fontWeight:700 }}>CONTAGEM DE PASSOS</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>ATIVIDADE DIÁRIA E SEMANAL</div>
      </div>

      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(247,197,159,0.04)', border:'1px solid rgba(247,197,159,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#f7c59f', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 PASSOS · clique para próximo</div>
          <div style={{ color:'#888', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { l:'Passos Hoje', v:steps.toLocaleString('pt-BR'), c:'#f7c59f' },
          { l:'Calorias Estimadas', v:`${kcal} kcal`, c:'#ff6b6b' },
          { l:'Distância', v:`${km} km`, c:'#00d4ff' },
        ].map(s=>(
          <NeonCard key={s.l} color={s.c} style={{ padding:'16px', textAlign:'center' }}>
            <div style={{ color:s.c, fontSize:26, fontWeight:700 }}>{s.v}</div>
            <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginTop:6 }}>{s.l.toUpperCase()}</div>
          </NeonCard>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <NeonCard color="#f7c59f" style={{ padding:20 }}>
          <SectionTitle color="#f7c59f">REGISTRAR PASSOS</SectionTitle>
          <input type="range" min="0" max="20000" value={steps} onChange={e=>updateSteps(+e.target.value)} style={{ width:'100%', accentColor:'#f7c59f', marginBottom:12 }} />
          <input type="number" value={steps} onChange={e=>updateSteps(+e.target.value)} className="input" style={{ borderColor:'rgba(247,197,159,0.25)', color:'#f7c59f', marginBottom:14 }} />
          <ProgressBar value={steps} max={10000} color="#f7c59f" label="Meta diária: 10.000" />
        </NeonCard>
        <NeonCard color="#f7c59f" style={{ padding:20 }}>
          <SectionTitle color="#f7c59f">HISTÓRICO SEMANAL</SectionTitle>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={WEEKLY_STEPS}>
              <defs>
                <linearGradient id="sg3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7c59f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f7c59f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:'#555', fontSize:10, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background:'#0a0a0c', border:'1px solid #f7c59f25', borderRadius:4, fontFamily:'monospace', fontSize:11 }} />
              <Area type="monotone" dataKey="steps" stroke="#f7c59f" strokeWidth={2} fill="url(#sg3)" />
            </AreaChart>
          </ResponsiveContainer>
        </NeonCard>
      </div>

      <NeonCard color="#f7c59f" style={{ padding:20 }}>
        <SectionTitle color="#f7c59f">BENEFÍCIOS POR META</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { steps:'5.000', benefit:'Reduz sedentarismo', c:'#ff9f43' },
            { steps:'7.500', benefit:'Melhora cardiovascular', c:'#f7c59f' },
            { steps:'10.000', benefit:'Controle de peso', c:'#00ff88' },
            { steps:'12.500+', benefit:'Longevidade máxima', c:'#00d4ff' },
          ].map(b=>(
            <div key={b.steps} style={{ padding:'14px 10px', borderRadius:8, background:`${b.c}08`, border:`1px solid ${b.c}20`, textAlign:'center', borderLeft:`3px solid ${steps >= parseInt(b.steps.replace('.','').replace('+','')) ? b.c : 'transparent'}` }}>
              <div style={{ color:b.c, fontSize:15, fontWeight:700, marginBottom:6 }}>{b.steps}</div>
              <div style={{ color:'#666', fontSize:10 }}>{b.benefit}</div>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}
