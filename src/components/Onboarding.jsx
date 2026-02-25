import { useState } from 'react'
import { upsertProfile } from '../lib/db'
import { GYM_TYPES, PROGRAMS } from '../data/workouts'

const GOALS = [
  { id:'muscleGain',  label:'Ganho Muscular', icon:'↑', desc:'Hipertrofia, força e volume' },
  { id:'weightLoss',  label:'Perda de Peso',  icon:'↓', desc:'Déficit calórico e HIIT' },
  { id:'endurance',   label:'Resistência',    icon:'∞', desc:'Cardio e performance' },
  { id:'maintenance', label:'Manutenção',     icon:'○', desc:'Saúde e equilíbrio' },
]

const R = '#dc2626'
const STEPS = 4

export default function Onboarding({ userId, initialName, onComplete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: initialName || '', age:'', weight:'', height:'',
    sex:'male', goal:'', activity:'1.55', gymType:'full', program:'upperLower5',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

  // Filtered programs by gym type
  const filteredPrograms = Object.entries(PROGRAMS).filter(([,p]) => p.gymType === form.gymType)

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
    if (step === 3 && !form.gymType) { setErrors({ gymType: 'Selecione o tipo de local' }); return }
    // auto-select first available program when gym type changes
    if (step === 3) {
      const avail = Object.entries(PROGRAMS).filter(([,p]) => p.gymType === form.gymType)
      if (avail.length && !avail.find(([k]) => k === form.program)) {
        setForm(f => ({ ...f, program: avail[0][0] }))
      }
    }
    setStep(s => s + 1)
  }

  async function finish() {
    setLoading(true)
    try {
      const profile = await upsertProfile(userId, {
        name: form.name.trim(), age: +form.age, weight: +form.weight,
        height: +form.height, sex: form.sex, goal: form.goal,
        program: form.program, activity: +form.activity, gym_type: form.gymType,
      })
      onComplete(profile)
    } catch (err) { alert('Erro ao salvar: ' + err.message) }
    finally { setLoading(false) }
  }

  const s = { // shared input style
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#d0d0d0', padding: '12px 14px', borderRadius: 6,
    fontFamily: "'Space Mono', monospace", fontSize: 14,
    outline: 'none', width: '100%', WebkitAppearance: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight:'100vh', minHeight:'100dvh', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace", padding:20, position:'relative' }}>
      <div style={{ position:'absolute', inset:0, opacity:0.02, backgroundImage:'linear-gradient(#dc2626 1px,transparent 1px),linear-gradient(90deg,#dc2626 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:500, animation:'fadeIn 0.4s ease', position:'relative' }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ color:R, fontSize:20, fontWeight:700, letterSpacing:4 }}>HEALTH OS</div>
          <div style={{ color:'#333', fontSize:9, letterSpacing:4, marginTop:4 }}>CONFIGURAÇÃO INICIAL · ETAPA {step} DE {STEPS}</div>
        </div>

        {/* Progress bar */}
        <div style={{ display:'flex', gap:6, marginBottom:28 }}>
          {Array.from({length:STEPS}).map((_,i) => (
            <div key={i} style={{ flex:1, height:2, borderRadius:1, background: i < step ? R : '#1a1a1a', transition:'background 0.3s' }} />
          ))}
        </div>

        <div style={{ background:'rgba(14,14,16,0.95)', border:'1px solid rgba(220,38,38,0.12)', borderRadius:10, padding:28 }}>

          {/* STEP 1 — dados pessoais */}
          {step === 1 && (
            <>
              <div style={{ color:'#555', fontSize:9, letterSpacing:3, marginBottom:22 }}>DADOS BIOMÉTRICOS</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">NOME</label>
                  <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Seu nome" maxLength={60} style={s} />
                  {errors.name && <div style={{ color:'#ef4444', fontSize:10, marginTop:3 }}>{errors.name}</div>}
                </div>
                {[
                  {k:'age',   l:'IDADE',       p:'25'},
                  {k:'weight',l:'PESO (kg)',    p:'70'},
                  {k:'height',l:'ALTURA (cm)',  p:'170'},
                ].map(f => (
                  <div key={f.k}>
                    <label className="label">{f.l}</label>
                    <input type="number" value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.p} style={s} />
                    {errors[f.k] && <div style={{ color:'#ef4444', fontSize:10, marginTop:3 }}>{errors[f.k]}</div>}
                  </div>
                ))}
                <div>
                  <label className="label">SEXO</label>
                  <select value={form.sex} onChange={e=>set('sex',e.target.value)} style={{ ...s, cursor:'pointer' }}>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">NÍVEL DE ATIVIDADE</label>
                  <select value={form.activity} onChange={e=>set('activity',e.target.value)} style={{ ...s, cursor:'pointer' }}>
                    <option value="1.2">Sedentário</option>
                    <option value="1.375">Levemente ativo (1–3x/sem)</option>
                    <option value="1.55">Moderado (3–5x/sem)</option>
                    <option value="1.725">Muito ativo (6–7x/sem)</option>
                    <option value="1.9">Extremamente ativo</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — objetivo */}
          {step === 2 && (
            <>
              <div style={{ color:'#555', fontSize:9, letterSpacing:3, marginBottom:22 }}>QUAL É SEU OBJETIVO?</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {GOALS.map(g => (
                  <div key={g.id} onClick={() => set('goal', g.id)} style={{ padding:18, borderRadius:8, border:`1px solid ${form.goal===g.id?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.07)'}`, background:form.goal===g.id?'rgba(220,38,38,0.1)':'rgba(255,255,255,0.02)', cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{g.icon}</div>
                    <div style={{ color:form.goal===g.id?R:'#aaa', fontSize:12, fontWeight:700, marginBottom:4 }}>{g.label}</div>
                    <div style={{ color:'#555', fontSize:10 }}>{g.desc}</div>
                  </div>
                ))}
              </div>
              {errors.goal && <div style={{ color:'#ef4444', fontSize:10, marginTop:8 }}>{errors.goal}</div>}
            </>
          )}

          {/* STEP 3 — tipo de local */}
          {step === 3 && (
            <>
              <div style={{ color:'#555', fontSize:9, letterSpacing:3, marginBottom:22 }}>ONDE VOCÊ VAI TREINAR?</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {GYM_TYPES.map(g => (
                  <div key={g.id} onClick={() => set('gymType', g.id)} style={{ padding:'14px 18px', borderRadius:8, border:`1px solid ${form.gymType===g.id?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.07)'}`, background:form.gymType===g.id?'rgba(220,38,38,0.1)':'rgba(255,255,255,0.02)', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:14 }}>
                    <span style={{ fontSize:24, flexShrink:0 }}>{g.icon}</span>
                    <div>
                      <div style={{ color:form.gymType===g.id?R:'#ccc', fontSize:13, fontWeight:700, marginBottom:3 }}>{g.label}</div>
                      <div style={{ color:'#555', fontSize:10 }}>{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 4 — programa */}
          {step === 4 && (
            <>
              <div style={{ color:'#555', fontSize:9, letterSpacing:3, marginBottom:6 }}>ESCOLHA O PROGRAMA</div>
              <div style={{ color:'#333', fontSize:9, marginBottom:18 }}>Programas disponíveis para: <span style={{ color:R }}>{GYM_TYPES.find(g=>g.id===form.gymType)?.label}</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredPrograms.map(([key, prog]) => (
                  <div key={key} onClick={() => set('program', key)} style={{ padding:'16px 18px', borderRadius:8, border:`1px solid ${form.program===key?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.07)'}`, background:form.program===key?'rgba(220,38,38,0.08)':'rgba(255,255,255,0.02)', cursor:'pointer', transition:'all 0.2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:form.program===key?R:'#ccc', fontSize:13, fontWeight:700, marginBottom:4 }}>{prog.name}</div>
                      <div style={{ color:'#555', fontSize:10 }}>{prog.description}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                      <div style={{ color:form.program===key?R:'#444', fontSize:10, marginBottom:2 }}>{prog.frequency}</div>
                      <div style={{ color:'#333', fontSize:9 }}>{prog.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {step > 1 && (
            <button onClick={() => setStep(s=>s-1)} className="btn" style={{ flex:1 }}>← VOLTAR</button>
          )}
          {step < STEPS ? (
            <button onClick={next} className="btn" style={{ flex:2, background:'rgba(220,38,38,0.12)', borderColor:R, color:R }}>
              PRÓXIMO →
            </button>
          ) : (
            <button onClick={finish} disabled={loading} className="btn" style={{ flex:2, background:'rgba(220,38,38,0.2)', borderColor:R, color:R, boxShadow:'0 0 20px rgba(220,38,38,0.2)' }}>
              {loading ? 'SALVANDO...' : '✓ COMEÇAR'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
