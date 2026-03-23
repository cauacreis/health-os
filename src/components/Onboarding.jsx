import { useState } from 'react'
import { upsertProfile } from '../lib/db'
import { GYM_TYPES, PROGRAMS } from '../data/workouts'

// ── Objetivos expandidos com multi-select ────────────────────────────────────
export const GOALS_LIST = [
  { id: 'muscleGain', label: 'Hipertrofia', icon: '💪', desc: 'Ganho de massa muscular e força' },
  { id: 'weightLoss', label: 'Perda de Peso', icon: '🔥', desc: 'Déficit calórico, HIIT e cardio' },
  { id: 'endurance', label: 'Resistência', icon: '∞', desc: 'Cardio, VO2 máx e performance aeróbica' },
  { id: 'maintenance', label: 'Manutenção', icon: '○', desc: 'Saúde, equilíbrio e qualidade de vida' },
  { id: 'recomposition', label: 'Recomposição Corporal', icon: '⚖️', desc: 'Perder gordura e ganhar músculo ao mesmo tempo' },
  { id: 'calisthenics', label: 'Calistenia', icon: '🤸', desc: 'Força no peso corporal, skills e controle motor' },
  { id: 'crossfit', label: 'CrossFit / Performance', icon: '⚡', desc: 'Força funcional e condicionamento metabólico' },
  { id: 'flexibility', label: 'Mobilidade / Flex', icon: '🧘', desc: 'Amplitude de movimento, postura e prevenção' },
]

// ── Helpers exportados — usados em Profile.jsx e Chat.jsx ────────────────────
export function parseGoals(profile) {
  try {
    if (Array.isArray(profile?.goals)) return profile.goals
    if (typeof profile?.goals === 'string' && profile.goals.startsWith('[')) return JSON.parse(profile.goals)
    return [profile?.goal].filter(Boolean)
  } catch { return [profile?.goal].filter(Boolean) }
}

export function parseGymTypes(profile) {
  try {
    if (Array.isArray(profile?.gym_types)) return profile.gym_types
    if (typeof profile?.gym_types === 'string' && profile.gym_types.startsWith('[')) return JSON.parse(profile.gym_types)
    return [profile?.gym_type].filter(Boolean)
  } catch { return [profile?.gym_type].filter(Boolean) }
}

const R = '#dc2626'
const STEPS = 4

export default function Onboarding({ userId, initialName, onComplete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [form, setForm] = useState({
    name: initialName || '', age: '', weight: '', height: '',
    sex: 'male', activity: '1.55',
    goals: [],
    gymTypes: [],
    program: 'upperLower5',
  })

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

  function toggleGoal(id) {
    setForm(f => {
      const has = f.goals.includes(id)
      return { ...f, goals: has ? f.goals.filter(x => x !== id) : [...f.goals, id] }
    })
    setErrors(e => ({ ...e, goals: undefined }))
  }

  function toggleGymType(id) {
    setForm(f => {
      const has = f.gymTypes.includes(id)
      return { ...f, gymTypes: has ? f.gymTypes.filter(x => x !== id) : [...f.gymTypes, id] }
    })
    setErrors(e => ({ ...e, gymTypes: undefined }))
  }

  const filteredPrograms = Object.entries(PROGRAMS).filter(([k, p]) => {
    if (k === 'custom') return true
    const matchGym = form.gymTypes.length === 0 || form.gymTypes.includes(p.gymType)
    const matchGoal = form.goals.length === 0 || p.goals?.some(g => form.goals.includes(g))
    return matchGym && matchGoal
  })

  function validate1() {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.age || form.age < 10 || form.age > 100) e.age = 'Idade inválida'
    if (!form.weight || form.weight < 30 || form.weight > 350) e.weight = 'Peso inválido'
    if (!form.height || form.height < 100 || form.height > 250) e.height = 'Altura inválida'
    return e
  }

  function next() {
    if (step === 1) { const e = validate1(); if (Object.keys(e).length) { setErrors(e); return } }
    if (step === 2 && form.goals.length === 0) { setErrors({ goals: 'Selecione pelo menos um objetivo' }); return }
    if (step === 3 && form.gymTypes.length === 0) { setErrors({ gymTypes: 'Selecione pelo menos um local de treino' }); return }
    if (step === 3) {
      const avail = Object.entries(PROGRAMS).filter(([k, p]) => {
        if (k === 'custom') return true
        const matchGym = form.gymTypes.length === 0 || form.gymTypes.includes(p.gymType)
        const matchGoal = form.goals.length === 0 || p.goals?.some(g => form.goals.includes(g))
        return matchGym && matchGoal
      })
      if (avail.length && !avail.find(([k]) => k === form.program)) {
        setForm(f => ({ ...f, program: avail[0][0] }))
      }
    }
    setStep(s => s + 1)
  }

  async function finish() {
    if (!termsAccepted) { setErrors({ terms: 'Você precisa aceitar os termos para continuar.' }); return }
    setLoading(true)
    try {
      const profile = await upsertProfile(userId, {
        name: form.name.trim(),
        age: +form.age,
        weight: +form.weight,
        height: +form.height,
        sex: form.sex,
        activity: +form.activity,
        program: form.program,
        goals: form.goals,
        gym_types: form.gymTypes,
        goal: form.goals[0] || 'muscleGain',
        gym_type: form.gymTypes[0] || 'full',
      })
      onComplete(profile)
    } catch (err) { alert('Erro ao salvar: ' + err.message) }
    finally { setLoading(false) }
  }

  const inp = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#d0d0d0', padding: '12px 14px', borderRadius: 6,
    fontFamily: "'Space Mono', monospace", fontSize: 14,
    outline: 'none', width: '100%', WebkitAppearance: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono',monospace", padding: 20, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.02, backgroundImage: 'linear-gradient(#dc2626 1px,transparent 1px),linear-gradient(90deg,#dc2626 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520, animation: 'fadeIn 0.4s ease', position: 'relative' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: R, fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>HEALTH OS</div>
          <div style={{ color: '#333', fontSize: 9, letterSpacing: 4, marginTop: 4 }}>CONFIGURAÇÃO INICIAL · ETAPA {step} DE {STEPS}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: i < step ? R : '#1a1a1a', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ background: 'rgba(14,14,16,0.95)', border: '1px solid rgba(220,38,38,0.12)', borderRadius: 10, padding: 28 }}>

          {/* STEP 1 — Dados biométricos */}
          {step === 1 && (
            <>
              <div style={{ color: '#555', fontSize: 9, letterSpacing: 3, marginBottom: 22 }}>DADOS BIOMÉTRICOS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">NOME</label>
                  <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Seu nome" maxLength={60} style={inp} />
                  {errors.name && <div style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{errors.name}</div>}
                </div>
                {[{ k: 'age', l: 'IDADE', p: '25' }, { k: 'weight', l: 'PESO (kg)', p: '70' }, { k: 'height', l: 'ALTURA (cm)', p: '170' }].map(f => (
                  <div key={f.k}>
                    <label className="label">{f.l}</label>
                    <input type="number" value={form[f.k]} onChange={e => setField(f.k, e.target.value)} placeholder={f.p} style={inp} />
                    {errors[f.k] && <div style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{errors[f.k]}</div>}
                  </div>
                ))}
                <div>
                  <label className="label">SEXO</label>
                  <select value={form.sex} onChange={e => setField('sex', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">FREQUÊNCIA SEMANAL DE TREINO</label>
                  <select value={form.activity} onChange={e => setField('activity', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="1.2">Sedentário — até 2 dias/semana</option>
                    <option value="1.375">Levemente ativo — 3 dias/semana</option>
                    <option value="1.55">Moderado — 4–5 dias/semana</option>
                    <option value="1.725">Muito ativo — 6 dias/semana</option>
                    <option value="1.9">Extremamente ativo — treino diário</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Objetivos (multi-select) */}
          {step === 2 && (
            <>
              <div style={{ color: '#555', fontSize: 9, letterSpacing: 3, marginBottom: 4 }}>QUAIS SÃO SEUS OBJETIVOS?</div>
              <div style={{ color: '#333', fontSize: 10, marginBottom: 16 }}>Selecione <span style={{ color: '#555' }}>um ou mais</span> — a IA vai equilibrar sugestões para todos.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOALS_LIST.map(g => {
                  const sel = form.goals.includes(g.id)
                  return (
                    <div key={g.id} onClick={() => toggleGoal(g.id)}
                      style={{ padding: '14px 12px', borderRadius: 8, border: `1px solid ${sel ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.07)'}`, background: sel ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                      {sel && <div style={{ position: 'absolute', top: 8, right: 10, color: R, fontSize: 12, fontWeight: 700 }}>✓</div>}
                      <div style={{ fontSize: 18, marginBottom: 5 }}>{g.icon}</div>
                      <div style={{ color: sel ? R : '#aaa', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{g.label}</div>
                      <div style={{ color: '#444', fontSize: 9, lineHeight: 1.4 }}>{g.desc}</div>
                    </div>
                  )
                })}
              </div>
              {errors.goals && <div style={{ color: '#ef4444', fontSize: 10, marginTop: 10 }}>⚠ {errors.goals}</div>}
              {form.goals.length > 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
                  <span style={{ color: '#555', fontSize: 10 }}>Selecionado: </span>
                  <span style={{ color: R, fontSize: 10, fontWeight: 700 }}>
                    {form.goals.map(id => GOALS_LIST.find(g => g.id === id)?.label).join(' · ')}
                  </span>
                </div>
              )}
            </>
          )}

          {/* STEP 3 — Locais (multi-select) */}
          {step === 3 && (
            <>
              <div style={{ color: '#555', fontSize: 9, letterSpacing: 3, marginBottom: 4 }}>ONDE VOCÊ PODE TREINAR?</div>
              <div style={{ color: '#333', fontSize: 10, marginBottom: 16 }}>Selecione <span style={{ color: '#555' }}>todos os locais que tem acesso</span> — a IA adapta os exercícios.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GYM_TYPES.map(g => {
                  const sel = form.gymTypes.includes(g.id)
                  return (
                    <div key={g.id} onClick={() => toggleGymType(g.id)}
                      style={{ padding: '14px 18px', borderRadius: 8, border: `1px solid ${sel ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.07)'}`, background: sel ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                      {sel && <div style={{ position: 'absolute', top: 12, right: 16, color: R, fontSize: 13, fontWeight: 700 }}>✓</div>}
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{g.icon}</span>
                      <div>
                        <div style={{ color: sel ? R : '#ccc', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{g.label}</div>
                        <div style={{ color: '#555', fontSize: 10 }}>{g.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {errors.gymTypes && <div style={{ color: '#ef4444', fontSize: 10, marginTop: 10 }}>⚠ {errors.gymTypes}</div>}
              {form.gymTypes.length > 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
                  <span style={{ color: '#555', fontSize: 10 }}>Selecionado: </span>
                  <span style={{ color: R, fontSize: 10, fontWeight: 700 }}>
                    {form.gymTypes.map(id => GYM_TYPES.find(g => g.id === id)?.label).join(' · ')}
                  </span>
                </div>
              )}
            </>
          )}

          {/* STEP 4 — Programa + Termos */}
          {step === 4 && (
            <>
              <div style={{ color: '#555', fontSize: 9, letterSpacing: 3, marginBottom: 4 }}>ESCOLHA SEU PROGRAMA INICIAL</div>
              <div style={{ color: '#333', fontSize: 9, marginBottom: 16 }}>
                Compatível com: <span style={{ color: R }}>{form.gymTypes.map(id => GYM_TYPES.find(g => g.id === id)?.label).join(', ')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
                {filteredPrograms.length === 0 ? (
                  <div style={{ color: '#444', fontSize: 12, padding: 20, textAlign: 'center' }}>Nenhum programa encontrado. Volte e selecione um local.</div>
                ) : filteredPrograms.map(([key, prog]) => (
                  <div key={key} onClick={() => setField('program', key)}
                    style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${form.program === key ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.07)'}`, background: form.program === key ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: form.program === key ? R : '#ccc', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{prog.name}</div>
                      <div style={{ color: '#555', fontSize: 10 }}>{prog.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ color: form.program === key ? R : '#444', fontSize: 10, marginBottom: 2 }}>{prog.frequency}</div>
                      <div style={{ color: '#333', fontSize: 9 }}>{prog.level}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Termos */}
              <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(220,38,38,0.03)', border: `1px solid ${errors.terms ? 'rgba(239,68,68,0.4)' : 'rgba(220,38,38,0.1)'}` }}>
                <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" checked={termsAccepted} onChange={e => { setTermsAccepted(e.target.checked); setErrors(ev => ({ ...ev, terms: undefined })) }}
                    style={{ accentColor: R, width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: 'pointer' }} />
                  <span style={{ color: '#555', fontSize: 11, lineHeight: 1.7, fontFamily: "'Space Mono', monospace" }}>
                    Entendo que o Health OS é uma ferramenta de apoio. As sugestões têm caráter{' '}
                    <strong style={{ color: '#444' }}>informativo</strong> e não substituem orientação de profissional CREF ou nutricionista.
                  </span>
                </label>
                {errors.terms && <div style={{ color: '#ef4444', fontSize: 10, marginTop: 8, paddingLeft: 28 }}>⚠ {errors.terms}</div>}
              </div>
            </>
          )}
        </div>

        {/* Navegação */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="btn" style={{ flex: 1 }}>← VOLTAR</button>
          )}
          {step < STEPS ? (
            <button onClick={next} className="btn" style={{ flex: 2, background: 'rgba(220,38,38,0.12)', borderColor: R, color: R }}>
              PRÓXIMO →
            </button>
          ) : (
            <button onClick={finish} disabled={loading || !termsAccepted} className="btn"
              style={{ flex: 2, background: termsAccepted ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.02)', borderColor: termsAccepted ? R : '#222', color: termsAccepted ? R : '#333', boxShadow: termsAccepted ? '0 0 20px rgba(220,38,38,0.2)' : 'none', transition: 'all 0.3s' }}>
              {loading ? 'SALVANDO...' : '✓ COMEÇAR'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}