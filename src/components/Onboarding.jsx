import { useState } from 'react'
import { upsertProfile } from '../lib/db'
import { PROGRAMS } from '../data/workouts'

const GOALS = [
  { id: 'muscleGain',  label: 'Ganho Muscular', icon: '⬆', desc: 'Hipertrofia, força e volume' },
  { id: 'weightLoss',  label: 'Perda de Peso',  icon: '⬇', desc: 'Déficit calórico e HIIT' },
  { id: 'endurance',   label: 'Resistência',    icon: '∞', desc: 'Cardio e performance' },
  { id: 'maintenance', label: 'Manutenção',     icon: '◎', desc: 'Saúde e equilíbrio' },
]

export default function Onboarding({ userId, initialName, onComplete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: initialName || '', age: '', weight: '', height: '',
    sex: 'male', goal: '', activity: '1.55', program: 'upperLower5',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

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
    if (step === 2 && !form.goal) { setErrors({ goal: 'Selecione um objetivo' }); return }
    setStep(s => s + 1)
  }

  async function finish() {
    setLoading(true)
    try {
      const profile = await upsertProfile(userId, {
        name: form.name.trim(),
        age: +form.age,
        weight: +form.weight,
        height: +form.height,
        sex: form.sex,
        goal: form.goal,
        program: form.program,
        activity: +form.activity,
      })
      onComplete(profile)
    } catch (err) {
      alert('Erro ao salvar perfil: ' + err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060608', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ color: '#00ff88', fontSize: 18, letterSpacing: 4, fontWeight: 700 }}>CONFIGURAR PERFIL</div>
            <div style={{ color: '#333', fontSize: 10, letterSpacing: 3, marginTop: 2 }}>ETAPA {step} DE 3</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? '#00ff88' : '#1a1a1a', boxShadow: s <= step ? '0 0 8px #00ff8840' : 'none', transition: 'all 0.3s' }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 10, padding: 28 }}>
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 20 }}>DADOS BIOMÉTRICOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">NOME</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu nome" maxLength={60} />
                {errors.name && <span style={{ color: '#ff6b6b', fontSize: 10 }}>{errors.name}</span>}
              </div>
              {[
                { k: 'age', l: 'IDADE', p: '25', min: 10, max: 100 },
                { k: 'weight', l: 'PESO (kg)', p: '70', min: 30, max: 350 },
                { k: 'height', l: 'ALTURA (cm)', p: '170', min: 100, max: 250 },
              ].map(f => (
                <div key={f.k}>
                  <label className="label">{f.l}</label>
                  <input type="number" className="input" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p} min={f.min} max={f.max} />
                  {errors[f.k] && <span style={{ color: '#ff6b6b', fontSize: 10 }}>{errors[f.k]}</span>}
                </div>
              ))}
              <div>
                <label className="label">SEXO</label>
                <select className="select" value={form.sex} onChange={e => set('sex', e.target.value)}>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">NÍVEL DE ATIVIDADE</label>
                <select className="select" value={form.activity} onChange={e => set('activity', e.target.value)}>
                  <option value="1.2">Sedentário</option>
                  <option value="1.375">Levemente ativo (1–3x/sem)</option>
                  <option value="1.55">Moderado (3–5x/sem)</option>
                  <option value="1.725">Muito ativo (6–7x/sem)</option>
                  <option value="1.9">Extremamente ativo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 10, padding: 28 }}>
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 20 }}>OBJETIVO PRINCIPAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GOALS.map(g => (
                <div key={g.id} onClick={() => set('goal', g.id)} style={{ padding: 16, borderRadius: 8, border: `1px solid ${form.goal === g.id ? '#00ff8860' : '#ffffff10'}`, background: form.goal === g.id ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: form.goal === g.id ? '0 0 16px rgba(0,255,136,0.12)' : 'none' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{g.icon}</div>
                  <div style={{ color: form.goal === g.id ? '#00ff88' : '#aaa', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{g.label}</div>
                  <div style={{ color: '#555', fontSize: 10 }}>{g.desc}</div>
                </div>
              ))}
            </div>
            {errors.goal && <div style={{ color: '#ff6b6b', fontSize: 10, marginTop: 8 }}>{errors.goal}</div>}
          </div>
        )}

        {step === 3 && (
          <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 10, padding: 28 }}>
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 20 }}>PROGRAMA DE TREINO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(PROGRAMS).map(([key, prog]) => (
                <div key={key} onClick={() => set('program', key)} style={{ padding: '16px 20px', borderRadius: 8, border: `1px solid ${form.program === key ? '#00ff8860' : '#ffffff10'}`, background: form.program === key ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {step > 1 && <button className="btn" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>← VOLTAR</button>}
          {step < 3
            ? <button className="btn" onClick={next} style={{ flex: 2, background: 'rgba(0,255,136,0.12)' }}>PRÓXIMO →</button>
            : <button className="btn" onClick={finish} disabled={loading} style={{ flex: 2, background: 'rgba(0,255,136,0.18)', borderColor: '#00ff88', boxShadow: '0 0 20px rgba(0,255,136,0.15)' }}>
                {loading ? 'SALVANDO...' : '✓ CRIAR PERFIL'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
