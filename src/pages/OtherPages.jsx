import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { NeonCard, SectionTitle, ProgressBar, Modal } from '../components/UI'
import { CARDIO_ZONES } from '../data/nutrition'
import { upsertProfile, saveCardioEntry, getCardioLog, addCalendarEntry, today } from '../lib/db'
import { FUN_FACTS } from '../data/funfacts'

const R  = '#dc2626'
const R2 = '#ef4444'
const S  = '#94a3b8'
const DIM = 'rgba(220,38,38,0.08)'

// ─── WATER ───────────────────────────────────────────────────────────────────
export function Water({ user, userId, onUpdate }) {
  const [consumed, setConsumed] = useState(user.water_today || 0)
  const [meals, setMeals]       = useState(user.meals_today || 0)
  const [saving, setSaving]     = useState(false)
  const goal = Math.round((user.weight || 70) * 35)
  const facts = FUN_FACTS.filter(f => f.category === 'Hidratação')
  const [factIdx, setFactIdx]   = useState(0)
  const fact = facts[factIdx % Math.max(facts.length, 1)]

  async function toggleCup(idx) {
    const next = consumed === idx + 1 ? idx : idx + 1
    setConsumed(next)
    setSaving(true)
    try {
      const updated = await upsertProfile(userId, { water_today: next })
      onUpdate(updated)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function setMealsVal(v) {
    setMeals(v)
    try {
      const updated = await upsertProfile(userId, { meals_today: v })
      onUpdate(updated)
    } catch(e) { console.error(e) }
  }

  const ml   = consumed * 250
  const cups = Math.round(goal / 250)
  const pct  = Math.min((ml / goal) * 100, 100)

  return (
    <div className="animate-fade">
      <PageHeader title="HIDRATAÇÃO" sub={`META: ${goal}ml · ${cups} COPOS`} />

      <FactBanner fact={fact} onNext={() => setFactIdx(i => i + 1)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Consumido" value={`${ml}ml`} />
        <StatCard label="Meta"      value={`${goal}ml`} />
        <StatCard label="Progresso" value={`${Math.round(pct)}%`} highlight={pct >= 100} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <NeonCard color={R} style={{ padding: 22 }}>
          <SectionTitle color={R}>COPOS DE 250ml</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 18 }}>
            {Array.from({ length: Math.min(cups, 15) }).map((_, i) => {
              const filled = i < consumed
              return (
                <div key={i} onClick={() => toggleCup(i)}
                  style={{ aspectRatio: '1', borderRadius: 8, border: `1px solid ${filled ? R2 + '60' : 'rgba(255,255,255,0.06)'}`, background: filled ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' }}>
                  {filled ? '💧' : <span style={{ color: '#2a2a2a', fontSize: 16 }}>○</span>}
                </div>
              )
            })}
          </div>
          <ProgressBar value={ml} max={goal} color={R} label="Hidratação" />
        </NeonCard>

        <NeonCard color={S} style={{ padding: 22 }}>
          <SectionTitle color={S}>REFEIÇÕES DO DIA</SectionTitle>
          <div style={{ color: S, fontSize: 48, fontWeight: 700, textAlign: 'center', lineHeight: 1 }}>{meals}</div>
          <div style={{ color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>refeições</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setMealsVal(n)}
                style={{ padding: '12px 0', borderRadius: 8, border: `1px solid ${meals >= n ? S + '50' : 'rgba(255,255,255,0.06)'}`, background: meals >= n ? 'rgba(148,163,184,0.15)' : 'transparent', color: meals >= n ? S : '#333', fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                {n}
              </button>
            ))}
          </div>
        </NeonCard>
      </div>

      <NeonCard color={R} style={{ padding: 20 }}>
        <SectionTitle color={R}>GUIA DE HIDRATAÇÃO</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {[
            { icon: '🌅', label: 'Ao acordar',     tip: '500ml antes do café' },
            { icon: '🏋️', label: 'Antes do treino', tip: '400–600ml, 1h antes' },
            { icon: '💪', label: 'Durante treino',  tip: '150ml a cada 15min' },
            { icon: '🌙', label: 'À noite',         tip: 'Pare 1h antes de dormir' },
          ].map(g => (
            <div key={g.label} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{g.icon}</div>
              <div style={{ color: R2, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{g.label}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{g.tip}</div>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}

// ─── BMI ─────────────────────────────────────────────────────────────────────
export function BMI({ user }) {
  const bmi = user.weight / Math.pow(user.height / 100, 2)
  const bmiR = bmi.toFixed(1)
  const cat  = bmi < 18.5 ? { label: 'Abaixo do peso', color: '#64748b', tip: 'Considere aumentar a ingestão calórica com nutricionista.' } :
               bmi < 25   ? { label: 'Peso ideal',      color: R, tip: 'Parabéns! Mantenha hábitos saudáveis.' } :
               bmi < 30   ? { label: 'Sobrepeso',       color: '#b45309', tip: 'Déficit calórico leve + exercícios regulares.' } :
                            { label: 'Obesidade',       color: '#991b1b', tip: 'Consulte um médico para um plano adequado.' }

  const bmr  = user.sex === 'male' ? 88.36 + 13.4 * user.weight + 4.8 * user.height - 5.7 * user.age
                                   : 447.6  + 9.2  * user.weight + 3.1 * user.height - 4.3 * user.age
  const tdee = Math.round(bmr * (user.activity || 1.55))

  const RANGES = [
    { range: '< 18.5', label: 'Abaixo do peso', color: '#64748b' },
    { range: '18.5–24.9', label: 'Peso ideal',  color: R },
    { range: '25–29.9',   label: 'Sobrepeso',   color: '#b45309' },
    { range: '≥ 30',      label: 'Obesidade',   color: '#991b1b' },
  ]

  const barPct = Math.min(((bmi - 15) / (40 - 15)) * 100, 100)

  return (
    <div className="animate-fade">
      <PageHeader title="ÍNDICE DE MASSA CORPORAL" sub={`${user.weight}kg · ${user.height}cm`} />

      {/* Big IMC display */}
      <NeonCard color={cat.color} style={{ padding: 32, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ color: '#444', fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>SEU IMC</div>
        <div style={{ color: cat.color, fontSize: 72, fontWeight: 700, lineHeight: 1 }}>{bmiR}</div>
        <div style={{ color: cat.color, fontSize: 18, marginTop: 8, fontWeight: 700 }}>{cat.label}</div>
        <div style={{ color: '#666', fontSize: 13, marginTop: 12, lineHeight: 1.7 }}>{cat.tip}</div>

        {/* Visual bar */}
        <div style={{ position: 'relative', height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginTop: 24, overflow: 'visible' }}>
          <div style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg, #64748b, ${R}, #b45309, #991b1b)` }} />
          <div style={{ position: 'absolute', top: '50%', left: `${barPct}%`, transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%', background: cat.color, border: '3px solid #0d0d10', boxShadow: `0 0 10px ${cat.color}`, transition: 'left 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: '#333', fontSize: 10 }}>15</span>
          <span style={{ color: '#333', fontSize: 10 }}>40+</span>
        </div>
      </NeonCard>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="Peso"    value={`${user.weight}kg`} />
        <StatCard label="TMB"     value={`${Math.round(bmr)} kcal`} />
        <StatCard label="TDEE"    value={`${tdee} kcal`} />
      </div>

      {/* Table */}
      <NeonCard color={R} style={{ padding: 20 }}>
        <SectionTitle color={R}>TABELA DE REFERÊNCIA</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RANGES.map(r => (
            <div key={r.range} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 8, border: `1px solid ${r.color}20`, background: bmiR >= parseFloat(r.range) && bmiR < parseFloat(r.range.split('–')[1] || '999') ? `${r.color}12` : 'rgba(255,255,255,0.02)' }}>
              <span style={{ color: r.color, fontSize: 14, fontWeight: 700, minWidth: 80 }}>{r.range}</span>
              <span style={{ color: '#888', fontSize: 13 }}>{r.label}</span>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}

// ─── CARDIO ──────────────────────────────────────────────────────────────────
export function Cardio({ user, userId }) {
  const [log, setLog]     = useState([])
  const [modal, setModal] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [form, setForm]   = useState({ date: today(), type: 'Corrida', zone: 'Z2', minutes: '', avg_hr: '', kcal: '' })
  const maxHR = 220 - (user.age || 25)

  if (!loaded) {
    getCardioLog(userId, 20).then(d => { setLog(d); setLoaded(true) }).catch(() => setLoaded(true))
  }

  async function saveEntry() {
    if (!form.minutes) return
    await saveCardioEntry(userId, { ...form, minutes: +form.minutes, avg_hr: +form.avg_hr || null, kcal: +form.kcal || null })
    const fresh = await getCardioLog(userId, 20)
    setLog(fresh)
    setModal(false)
    setForm({ date: today(), type: 'Corrida', zone: 'Z2', minutes: '', avg_hr: '', kcal: '' })
  }

  const TYPES = ['Corrida', 'Caminhada', 'Bike', 'Natação', 'Remo', 'HIIT', 'Elíptico', 'Pular Corda']

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <PageHeader title="CARDIO" sub={`FC MÁX ESTIMADA: ${maxHR} BPM`} noMargin />
        <button className="btn" onClick={() => setModal(true)} style={{ background: DIM, borderColor: R, color: R2, fontSize: 12 }}>+ REGISTRAR</button>
      </div>

      {/* Zones */}
      <NeonCard color={R} style={{ padding: 20, marginBottom: 16 }}>
        <SectionTitle color={R}>ZONAS DE FREQUÊNCIA CARDÍACA</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CARDIO_ZONES.map(z => {
            const low  = Math.round(maxHR * z.pctLow / 100)
            const high = Math.round(maxHR * z.pctHigh / 100)
            return (
              <div key={z.zone} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(220,38,38,0.12)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: R, color: '#fff', borderRadius: 6, padding: '4px 10px', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{z.zone}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#d0d0d0', fontSize: 13, fontWeight: 700 }}>{z.name}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>{z.benefit}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: R2, fontSize: 14, fontWeight: 700 }}>{low}–{high}</div>
                  <div style={{ color: '#444', fontSize: 11 }}>bpm</div>
                </div>
              </div>
            )
          })}
        </div>
      </NeonCard>

      {/* Log */}
      {log.length > 0 && (
        <NeonCard color={R} style={{ padding: 20 }}>
          <SectionTitle color={R}>ÚLTIMAS SESSÕES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {log.slice(0, 8).map((e, i) => (
              <div key={i} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(220,38,38,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: R2, fontSize: 14, fontWeight: 700 }}>{e.type}</div>
                  <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{e.date} · {e.zone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#d0d0d0', fontSize: 15, fontWeight: 700 }}>{e.minutes}min</div>
                  {e.kcal && <div style={{ color: '#555', fontSize: 12 }}>{e.kcal} kcal</div>}
                </div>
              </div>
            ))}
          </div>
        </NeonCard>
      )}

      {modal && (
        <Modal title="REGISTRAR SESSÃO DE CARDIO" color={R} onClose={() => setModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">DATA</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" style={{ borderColor: 'rgba(220,38,38,0.3)', color: R2 }} />
            </div>
            <div>
              <label className="label">TIPO</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="select">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ZONA</label>
              <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} className="select">
                {['Z1','Z2','Z3','Z4','Z5'].map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="label">DURAÇÃO (min)</label>
              <input type="number" value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} placeholder="30" className="input" style={{ borderColor: 'rgba(220,38,38,0.3)', color: R2 }} />
            </div>
            <div>
              <label className="label">FC MÉDIA (bpm)</label>
              <input type="number" value={form.avg_hr} onChange={e => setForm(f => ({ ...f, avg_hr: e.target.value }))} placeholder="140" className="input" />
            </div>
            <div>
              <label className="label">CALORIAS (kcal)</label>
              <input type="number" value={form.kcal} onChange={e => setForm(f => ({ ...f, kcal: e.target.value }))} placeholder="250" className="input" />
            </div>
          </div>
          <button className="btn" onClick={saveEntry} style={{ width: '100%', marginTop: 16, background: DIM, borderColor: R, color: R2, padding: 14, fontSize: 13 }}>
            SALVAR SESSÃO
          </button>
        </Modal>
      )}
    </div>
  )
}

// ─── STEPS ───────────────────────────────────────────────────────────────────
export function Steps({ user, userId, onUpdate }) {
  // ⚠️ FIX: usar estado local para slider sem chamar onUpdate a cada tick
  const [steps, setStepsLocal] = useState(user.steps_today || 0)
  const [saving, setSaving]    = useState(false)
  const facts = FUN_FACTS.filter(f => f.category === 'Passos')
  const [factIdx, setFactIdx]  = useState(0)
  const fact  = facts[factIdx % Math.max(facts.length, 1)]
  const kcal  = Math.round(steps * 0.04)
  const km    = (steps * 0.00075).toFixed(2)

  // Só salva no banco ao soltar o slider (onMouseUp/onTouchEnd) ou alterar o número
  async function saveSteps(val) {
    const v = Math.max(0, Math.min(50000, val))
    setStepsLocal(v)
    setSaving(true)
    try {
      const updated = await upsertProfile(userId, { steps_today: v })
      onUpdate(updated)          // agora retorna o profile Supabase com age, weight etc
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const MILESTONES = [
    { steps: 5000,  label: '5.000',  benefit: 'Reduz sedentarismo' },
    { steps: 7500,  label: '7.500',  benefit: 'Melhora cardiovascular' },
    { steps: 10000, label: '10.000', benefit: 'Controle de peso' },
    { steps: 12500, label: '12.500+',benefit: 'Longevidade máxima' },
  ]

  return (
    <div className="animate-fade">
      <PageHeader title="PASSOS DO DIA" sub="ATIVIDADE DIÁRIA" />

      <FactBanner fact={fact} onNext={() => setFactIdx(i => i + 1)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Passos"    value={steps.toLocaleString('pt-BR')} big />
        <StatCard label="Calorias"  value={`${kcal} kcal`} />
        <StatCard label="Distância" value={`${km} km`} />
      </div>

      <NeonCard color={R} style={{ padding: 22, marginBottom: 16 }}>
        <SectionTitle color={R}>REGISTRAR PASSOS</SectionTitle>
        <div style={{ marginBottom: 10 }}>
          <input
            type="range" min="0" max="20000" step="100"
            value={steps}
            onChange={e => setStepsLocal(+e.target.value)}  /* só atualiza visual */
            onMouseUp={e  => saveSteps(+e.target.value)}    /* salva ao soltar */
            onTouchEnd={e => saveSteps(+e.target.value)}    /* salva ao soltar (mobile) */
            style={{ width: '100%', accentColor: R, height: 6, cursor: 'pointer', marginBottom: 14 }}
          />
          <input
            type="number" value={steps}
            onChange={e => setStepsLocal(+e.target.value)}
            onBlur={e => saveSteps(+e.target.value)}         /* salva ao sair do campo */
            className="input"
            style={{ borderColor: 'rgba(220,38,38,0.3)', color: R2 }}
          />
        </div>
        <ProgressBar value={steps} max={10000} color={R} label="Meta: 10.000 passos" />
        {saving && <div style={{ color: '#444', fontSize: 11, marginTop: 6, textAlign: 'right' }}>salvando...</div>}
      </NeonCard>

      <NeonCard color={R} style={{ padding: 20 }}>
        <SectionTitle color={R}>METAS E BENEFÍCIOS</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {MILESTONES.map(m => {
            const reached = steps >= m.steps
            return (
              <div key={m.label} style={{ padding: '16px 14px', borderRadius: 8, background: reached ? DIM : 'rgba(255,255,255,0.02)', border: `1px solid ${reached ? R + '40' : 'rgba(255,255,255,0.06)'}`, borderLeft: `3px solid ${reached ? R : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.3s' }}>
                <div style={{ color: reached ? R2 : '#555', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{m.label}</div>
                <div style={{ color: reached ? '#aaa' : '#444', fontSize: 12 }}>{m.benefit}</div>
                {reached && <div style={{ color: R, fontSize: 11, marginTop: 6 }}>✓ Atingido</div>}
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
      <div style={{ color: R, fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>{title}</div>
      {sub && <div style={{ color: '#555', fontSize: 12, letterSpacing: 2, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function StatCard({ label, value, big, highlight }) {
  return (
    <NeonCard color={R} style={{ padding: '18px 14px', textAlign: 'center' }}>
      <div style={{ color: highlight ? R : R2, fontSize: big ? 28 : 22, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>{label}</div>
    </NeonCard>
  )
}

function FactBanner({ fact, onNext }) {
  if (!fact) return null
  return (
    <div onClick={onNext} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', marginBottom: 18, WebkitTapHighlightColor: 'transparent' }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{fact.icon}</span>
      <div>
        <div style={{ color: R2, fontSize: 10, letterSpacing: 2, marginBottom: 3 }}>💡 SABIA QUE... · toque para próximo</div>
        <div style={{ color: '#777', fontSize: 13 }}>{fact.fact}</div>
      </div>
    </div>
  )
}
