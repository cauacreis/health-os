import { useState } from 'react'
import { createUser, setActiveUser } from '../lib/storage'
import { PROGRAMS } from '../data/workouts'

const GOALS = [
  { id: 'muscleGain', label: 'Ganho Muscular', icon: '⬆', desc: 'Hipertrofia, força e volume' },
  { id: 'weightLoss', label: 'Perda de Peso', icon: '⬇', desc: 'Déficit calórico e HIIT' },
  { id: 'endurance', label: 'Resistência', icon: '∞', desc: 'Cardio e performance' },
  { id: 'maintenance', label: 'Manutenção', icon: '◎', desc: 'Saúde e equilíbrio' },
]

export default function AddUser({ onCreated, onBack }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', age: '', weight: '', height: '',
    sex: 'male', goal: '', activity: '1.55', program: 'upperLower5',
  })
  const [errors, setErrors] = useState({})

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

  function validateStep1() {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.age || form.age < 10 || form.age > 100) e.age = 'Idade inválida (10–100)'
    if (!form.weight || form.weight < 30 || form.weight > 300) e.weight = 'Peso inválido (30–300kg)'
    if (!form.height || form.height < 100 || form.height > 230) e.height = 'Altura inválida (100–230cm)'
    return e
  }

  function validateStep2() {
    const e = {}
    if (!form.goal) e.goal = 'Selecione um objetivo'
    return e
  }

  function nextStep() {
    if (step === 1) {
      const e = validateStep1()
      if (Object.keys(e).length) { setErrors(e); return }
    }
    if (step === 2) {
      const e = validateStep2()
      if (Object.keys(e).length) { setErrors(e); return }
    }
    setStep(s => s + 1)
  }

  function handleSubmit() {
    const user = createUser({
      ...form,
      age: +form.age, weight: +form.weight, height: +form.height, activity: +form.activity,
    })
    setActiveUser(user.id)
    onCreated(user)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#060608',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <div className="animate-fade" style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>←</button>
          <div>
            <div style={{ color: '#00ff88', fontSize: 18, letterSpacing: 4, fontWeight: 700 }}>NOVO PERFIL</div>
            <div style={{ color: '#333', fontSize: 10, letterSpacing: 3, marginTop: 2 }}>ETAPA {step} DE 3</div>
          </div>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? '#00ff88' : '#1a1a1a',
              boxShadow: s <= step ? '0 0 8px #00ff8840' : 'none',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* STEP 1 — Dados pessoais */}
        {step === 1 && (
          <div className="animate-fade">
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 24 }}>DADOS BIOMÉTRICOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Nome</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu nome" autoFocus />
                {errors.name && <span style={{ color: '#ff6b6b', fontSize: 10 }}>{errors.name}</span>}
              </div>
              <div>
                <label className="label">Idade</label>
                <input className="input" type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="28" />
                {errors.age && <span style={{ color: '#ff6b6b', fontSize: 10 }}>{errors.age}</span>}
              </div>
              <div>
                <label className="label">Sexo</label>
                <select className="select" value={form.sex} onChange={e => set('sex', e.target.value)}>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>
              <div>
                <label className="label">Peso (kg)</label>
                <input className="input" type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="75" />
                {errors.weight && <span style={{ color: '#ff6b6b', fontSize: 10 }}>{errors.weight}</span>}
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input className="input" type="number" value={form.height} onChange={e => set('height', e.target.value)} placeholder="175" />
                {errors.height && <span style={{ color: '#ff6b6b', fontSize: 10 }}>{errors.height}</span>}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Nível de atividade</label>
                <select className="select" value={form.activity} onChange={e => set('activity', e.target.value)}>
                  <option value="1.2">Sedentário (sem exercício)</option>
                  <option value="1.375">Levemente ativo (1–3x/semana)</option>
                  <option value="1.55">Moderado (3–5x/semana)</option>
                  <option value="1.725">Muito ativo (6–7x/semana)</option>
                  <option value="1.9">Extremamente ativo (treino duplo)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Objetivo */}
        {step === 2 && (
          <div className="animate-fade">
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 24 }}>OBJETIVO PRINCIPAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GOALS.map(g => (
                <div
                  key={g.id}
                  onClick={() => set('goal', g.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 8,
                    border: `1px solid ${form.goal === g.id ? '#00ff8860' : '#ffffff10'}`,
                    background: form.goal === g.id ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: form.goal === g.id ? '0 0 16px rgba(0,255,136,0.15)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{g.icon}</div>
                  <div style={{ color: form.goal === g.id ? '#00ff88' : '#aaa', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{g.label}</div>
                  <div style={{ color: '#555', fontSize: 10 }}>{g.desc}</div>
                </div>
              ))}
            </div>
            {errors.goal && <div style={{ color: '#ff6b6b', fontSize: 10, marginTop: 8 }}>{errors.goal}</div>}
          </div>
        )}

        {/* STEP 3 — Programa */}
        {step === 3 && (
          <div className="animate-fade">
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 24 }}>PROGRAMA DE TREINO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(PROGRAMS).map(([key, prog]) => (
                <div
                  key={key}
                  onClick={() => set('program', key)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 8,
                    border: `1px solid ${form.program === key ? '#00ff8860' : '#ffffff10'}`,
                    background: form.program === key ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: form.program === key ? '#00ff88' : '#aaa', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{prog.name}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{prog.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: form.program === key ? '#00ff88' : '#444', fontSize: 11, marginBottom: 2 }}>{prog.frequency}</div>
                    <div style={{ color: '#333', fontSize: 10 }}>{prog.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 1 && (
            <button className="btn" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
              ← VOLTAR
            </button>
          )}
          {step < 3 ? (
            <button className="btn" onClick={nextStep} style={{ flex: 2, background: 'rgba(0,255,136,0.12)' }}>
              PRÓXIMO →
            </button>
          ) : (
            <button className="btn" onClick={handleSubmit} style={{ flex: 2, background: 'rgba(0,255,136,0.18)', borderColor: '#00ff88', boxShadow: '0 0 20px rgba(0,255,136,0.2)' }}>
              ⊕ CRIAR PERFIL
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
