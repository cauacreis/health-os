import { useState } from 'react'
import { upsertProfile, today } from '../lib/db'
import { NeonCard, SectionTitle } from '../components/UI'
import { FUN_FACTS } from '../data/funfacts'
import { GOALS_LIST, parseGoals, parseGymTypes } from '../components/Onboarding'
import { GYM_TYPES, PROGRAMS } from '../data/workouts'
import ProGate from '../components/ProGate'

const ACTIVITY_OPTS = [
  { v: '1.2', l: 'Sedentário' },
  { v: '1.375', l: 'Levemente ativo (1–3x/sem)' },
  { v: '1.55', l: 'Moderado (3–5x/sem)' },
  { v: '1.725', l: 'Muito ativo (6–7x/sem)' },
  { v: '1.9', l: 'Extremamente ativo' },
]

// (PROGRAMS removed here because it's imported from workouts.js)

const R = '#dc2626'
const R2 = '#ef4444'
const S = '#94a3b8'

export default function Profile({ user, userId, onUpdate }) {
  const [activeTab, setActiveTab] = useState('perfil')
  const [factIdx, setFactIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const isPro = user?.is_pro || user?.isPro || false

  const defaultFitness = { strength: 50, cardio: 50, flex: 50, resistance: 50, balance: 50, speed: 50 }
  const fitnessProfile = user.fitness_profile || defaultFitness

  const [edit, setEdit] = useState({
    name: user.name || '',
    age: user.age || '',
    weight: user.weight || '',
    height: user.height || '',
    sex: user.sex || 'male',
    goals: parseGoals(user),
    gymTypes: parseGymTypes(user),
    activity: String(user.activity || '1.55'),
    program: user.program || 'upperLower5',
  })

  function toggleGoal(id) {
    setEdit(v => {
      const has = v.goals.includes(id)
      return { ...v, goals: has ? v.goals.filter(x => x !== id) : [...v.goals, id] }
    })
  }

  function toggleGymType(id) {
    setEdit(v => {
      const has = v.gymTypes.includes(id)
      return { ...v, gymTypes: has ? v.gymTypes.filter(x => x !== id) : [...v.gymTypes, id] }
    })
  }

  async function saveProfile() {
    if (!edit.name || !edit.age || !edit.weight || !edit.height) return
    setSaving(true)
    try {
      const updated = await upsertProfile(userId, {
        name: edit.name.trim(),
        age: +edit.age,
        weight: +edit.weight,
        height: +edit.height,
        sex: edit.sex,
        goals: edit.goals,
        gym_types: edit.gymTypes,
        goal: edit.goals[0] || 'muscleGain', // keep single field for legacy compatibility
        gym_type: edit.gymTypes[0] || 'full', // keep single field for legacy compatibility
        activity: +edit.activity,
        program: edit.program,
      })
      onUpdate(updated)
      setActiveTab('perfil')
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const bmi = (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
  const bmiNum = +bmi
  const bmiC = bmiNum < 18.5 ? '#94a3b8' : bmiNum < 25 ? R : bmiNum < 30 ? R2 : '#ff6b6b'
  const bmiLabel = bmiNum < 18.5 ? 'Abaixo do peso' : bmiNum < 25 ? 'Peso ideal' : bmiNum < 30 ? 'Sobrepeso' : 'Obesidade'
  const bmr = user.sex === 'male' ? 88.36 + 13.4 * user.weight + 4.8 * user.height - 5.7 * user.age : 447.6 + 9.2 * user.weight + 3.1 * user.height - 4.3 * user.age
  const tdee = Math.round(bmr * (user.activity || 1.55))
  const fact = FUN_FACTS[factIdx % FUN_FACTS.length]

  const tabs = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'editar', label: 'Editar Perfil' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: R, fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>PERFIL</div>
          {isPro && (
            <span style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: '3px 8px', borderRadius: 4, boxShadow: '0 0 10px rgba(220,38,38,0.4)' }}>
              ⚡ PRO
            </span>
          )}
        </div>
        <div style={{ color: '#666', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>DADOS PESSOAIS</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="btn"
            style={{ flex: 1, padding: '10px 0', background: activeTab === t.id ? 'rgba(220,38,38,0.15)' : 'transparent', borderColor: activeTab === t.id ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)', color: activeTab === t.id ? R : '#666' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PERFIL ── */}
      {activeTab === 'perfil' && (
        <>
          {/* Fun fact */}
          <div onClick={() => setFactIdx(i => i + 1)} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)', display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginBottom: 16, WebkitTapHighlightColor: 'transparent' }}>
            <span style={{ fontSize: 18 }}>{fact.icon}</span>
            <div>
              <div style={{ color: S, fontSize: 9, letterSpacing: 2, marginBottom: 2 }}>💡 {fact.category.toUpperCase()} — toque para próximo</div>
              <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>{fact.fact}</div>
            </div>
          </div>

          {/* Avatar + stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 16 }}>
            <NeonCard color={R} style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 140 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.photo_url
                  ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  : <span style={{ color: R, fontSize: 36 }}>{(user.name || '?')[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#d0d0d0', fontSize: 15, fontWeight: 700 }}>{user.name}</div>
                <div style={{ color: '#666', fontSize: 10, marginTop: 3 }}>{user.age}a · {user.sex === 'male' ? 'M' : 'F'}</div>
              </div>
            </NeonCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {[
                { l: 'PESO', v: `${user.weight} kg`, c: R },
                { l: 'ALTURA', v: `${user.height} cm`, c: R },
                { l: 'IMC', v: bmi, c: bmiC },
                { l: 'TMB', v: `${Math.round(bmr)} kcal`, c: S },
                { l: 'TDEE', v: `${tdee} kcal`, c: S },
                { l: 'OBJETIVO', v: user.goal === 'muscleGain' ? 'Músculo' : user.goal === 'weightLoss' ? 'Perda peso' : user.goal === 'endurance' ? 'Resistência' : 'Manutenção', c: R2 },
              ].map(s => (
                <div key={s.l} style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.08)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: 8, letterSpacing: 2, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ color: s.c, fontSize: 14, fontWeight: 700 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IMC banner */}
          <NeonCard color={bmiC} style={{ padding: '12px 18px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#555', fontSize: 9, letterSpacing: 2 }}>CLASSIFICAÇÃO IMC</div>
                <div style={{ color: bmiC, fontSize: 14, fontWeight: 700, marginTop: 2 }}>{bmiLabel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: bmiC, fontSize: 32, fontWeight: 700 }}>{bmi}</div>
              </div>
            </div>
          </NeonCard>

          {/* Perfil de Fitness — PRO */}
          <ProGate isPro={isPro} feature="O perfil de fitness detalhado com métricas de performance">
            <NeonCard color={R} style={{ padding: 20, marginBottom: 12 }}>
              <SectionTitle color={R}>PERFIL DE FITNESS</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {[
                  { k: 'strength', l: 'Força', icon: '💪' },
                  { k: 'cardio', l: 'Cardio', icon: '🏃' },
                  { k: 'flex', l: 'Flexibilidade', icon: '🤸' },
                  { k: 'resistance', l: 'Resistência', icon: '♾️' },
                  { k: 'balance', l: 'Equilíbrio', icon: '⚖️' },
                  { k: 'speed', l: 'Velocidade', icon: '⚡' },
                ].map(f => {
                  const val = fitnessProfile[f.k] || 50
                  const barColor = val >= 75 ? '#22c55e' : val >= 50 ? R : R2
                  return (
                    <div key={f.k} style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.03)', border: '1px solid rgba(220,38,38,0.08)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: '#888', fontSize: 12 }}>{f.icon} {f.l}</span>
                        <span style={{ color: barColor, fontSize: 14, fontWeight: 700 }}>{val}</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, height: '100%', background: `linear-gradient(90deg,${barColor}80,${barColor})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>PONTO FORTE</div>
                <div style={{ color: R2, fontSize: 13, fontWeight: 700 }}>
                  {(() => {
                    const best = Object.entries(fitnessProfile).sort((a, b) => b[1] - a[1])[0]
                    const labels = { strength: 'Força', cardio: 'Cardio', flex: 'Flexibilidade', resistance: 'Resistência', balance: 'Equilíbrio', speed: 'Velocidade' }
                    return `${labels[best[0]]} (${best[1]}/100)`
                  })()}
                </div>
              </div>
            </NeonCard>
          </ProGate>

          {/* Dica calendário */}
          <NeonCard color="#6366f1" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>📅</span>
              <div>
                <div style={{ color: '#818cf8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>SONO & COMPOSIÇÃO CORPORAL</div>
                <div style={{ color: '#555', fontSize: 11, lineHeight: 1.6 }}>
                  Registre suas noites de sono e medições de bioimpedância na aba <strong style={{ color: '#818cf8' }}>Calendário → Sono</strong> e <strong style={{ color: '#818cf8' }}>Composição</strong>.
                </div>
              </div>
            </div>
          </NeonCard>
        </>
      )}

      {/* ── TAB: EDITAR ── */}
      {activeTab === 'editar' && (
        <NeonCard color={R} style={{ padding: 22 }}>
          <SectionTitle color={R}>EDITAR DADOS DO PERFIL</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">NOME</label>
              <input className="input" value={edit.name} onChange={e => setEdit(v => ({ ...v, name: e.target.value }))} maxLength={60} />
            </div>
            {[
              { k: 'age', l: 'IDADE', p: '25', min: 10, max: 100 },
              { k: 'weight', l: 'PESO (kg)', p: '70', min: 30, max: 350 },
              { k: 'height', l: 'ALTURA (cm)', p: '170', min: 100, max: 250 },
            ].map(f => (
              <div key={f.k}>
                <label className="label">{f.l}</label>
                <input type="number" className="input" value={edit[f.k]} onChange={e => setEdit(v => ({ ...v, [f.k]: e.target.value }))} placeholder={f.p} min={f.min} max={f.max} />
              </div>
            ))}
            <div>
              <label className="label">SEXO</label>
              <select className="select" value={edit.sex} onChange={e => setEdit(v => ({ ...v, sex: e.target.value }))}>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">NÍVEL DE ATIVIDADE</label>
              <select className="select" value={edit.activity} onChange={e => setEdit(v => ({ ...v, activity: e.target.value }))}>
                {ACTIVITY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">OBJETIVOS</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {GOALS_LIST.map(g => {
                  const sel = edit.goals.includes(g.id)
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGoal(g.id)}
                      style={{ padding: '10px 8px', borderRadius: 6, border: `1px solid ${sel ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(220,38,38,0.12)' : 'transparent', color: sel ? R : '#666', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{g.icon}</span> <span>{g.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
              <label className="label">LOCAIS DE TREINO</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {GYM_TYPES.map(g => {
                  const sel = edit.gymTypes.includes(g.id)
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGymType(g.id)}
                      style={{ padding: '10px 8px', borderRadius: 6, border: `1px solid ${sel ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(220,38,38,0.12)' : 'transparent', color: sel ? R : '#666', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{g.icon}</span> <span>{g.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">PROGRAMA DE TREINO</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(PROGRAMS)
                  .filter(([k, p]) => {
                    if (k === 'custom') return true
                    const matchGym = edit.gymTypes.length === 0 || edit.gymTypes.includes(p.gymType)
                    const matchGoal = edit.goals.length === 0 || p.goals?.some(g => edit.goals.includes(g))
                    return matchGym && matchGoal
                  })
                  .map(([key, p]) => (
                  <button key={key} type="button" onClick={() => setEdit(v => ({ ...v, program: key }))}
                    style={{ padding: '12px 16px', textAlign: 'left', borderRadius: 6, border: `1px solid ${edit.program === key ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`, background: edit.program === key ? 'rgba(220,38,38,0.1)' : 'transparent', color: edit.program === key ? R : '#666', flex: 1, fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: edit.program === key ? '#ef4444' : '#555' }}>
                      {p.level} · {p.frequency}
                    </div>
                  </button>
                ))}
              </div>
            </div>


          </div>

          <button className="btn" onClick={saveProfile} disabled={saving}
            style={{ width: '100%', marginTop: 20, background: 'rgba(220,38,38,0.15)', borderColor: R, color: R2, padding: 14, fontSize: 14 }}>
            {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
          </button>
        </NeonCard>
      )}
    </div>
  )
}