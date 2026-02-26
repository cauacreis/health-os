import { useState } from 'react'
import { upsertProfile, today } from '../lib/db'
import { NeonCard, SectionTitle } from '../components/UI'
import { FUN_FACTS } from '../data/funfacts'

const ACTIVITY_OPTS = [
  { v:'1.2',   l:'Sedentário' },
  { v:'1.375', l:'Levemente ativo (1–3x/sem)' },
  { v:'1.55',  l:'Moderado (3–5x/sem)' },
  { v:'1.725', l:'Muito ativo (6–7x/sem)' },
  { v:'1.9',   l:'Extremamente ativo' },
]

const PROGRAMS = [
  { v:'upperLower5', l:'Upper/Lower 5x — Intermediário' },
  { v:'ppl6',        l:'PPL 6x — Avançado' },
]

export default function Profile({ user, userId, onUpdate }) {
  const [activeTab, setActiveTab] = useState('perfil')
  const [factIdx, setFactIdx]     = useState(0)
  const [saving, setSaving]       = useState(false)

  const [edit, setEdit] = useState({
    name:     user.name || '',
    age:      user.age  || '',
    weight:   user.weight || '',
    height:   user.height || '',
    sex:      user.sex  || 'male',
    goal:     user.goal || 'muscleGain',
    activity: String(user.activity || '1.55'),
    program:  user.program || 'upperLower5',
  })

  async function saveProfile() {
    if (!edit.name || !edit.age || !edit.weight || !edit.height) return
    setSaving(true)
    try {
      const updated = await upsertProfile(userId, {
        name:     edit.name.trim(),
        age:      +edit.age,
        weight:   +edit.weight,
        height:   +edit.height,
        sex:      edit.sex,
        goal:     edit.goal,
        activity: +edit.activity,
        program:  edit.program,
      })
      onUpdate(updated)
      setActiveTab('perfil')
    } catch(e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const bmi  = (user.weight / Math.pow(user.height/100, 2)).toFixed(1)
  const bmiC = bmi<18.5?'#94a3b8':bmi<25?'#dc2626':bmi<30?'#ef4444':'#ff6b6b'
  const bmr  = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee = Math.round(bmr * (user.activity || 1.55))
  const fact = FUN_FACTS[factIdx % FUN_FACTS.length]

  const tabs = [
    { id:'perfil', label:'Perfil' },
    { id:'editar', label:'Editar Perfil' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:20 }}>
        <div style={{ color:'#dc2626', fontSize:22, letterSpacing:4, fontWeight:700 }}>PERFIL</div>
        <div style={{ color:'#666', fontSize:10, letterSpacing:3, marginTop:4 }}>DADOS PESSOAIS</div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="btn"
            style={{ flex:1, padding:'10px 0', background: activeTab===t.id?'rgba(220,38,38,0.15)':'transparent', borderColor: activeTab===t.id?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.08)', color: activeTab===t.id?'#dc2626':'#666' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PERFIL ─────────────────────────────────────────── */}
      {activeTab === 'perfil' && (
        <>
          {/* Fun fact */}
          <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(148,163,184,0.04)', border:'1px solid rgba(148,163,184,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:16, WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:18 }}>{fact.icon}</span>
            <div>
              <div style={{ color:'#94a3b8', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 {fact.category.toUpperCase()} — toque para próximo</div>
              <div style={{ color:'#666', fontSize:11, lineHeight:1.5 }}>{fact.fact}</div>
            </div>
          </div>

          {/* Avatar + stats */}
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:16, marginBottom:16 }}>
            <NeonCard color="#dc2626" style={{ padding:20, display:'flex', flexDirection:'column', alignItems:'center', gap:12, minWidth:140 }}>
              <div style={{ width:90, height:90, borderRadius:'50%', border:'2px solid rgba(220,38,38,0.25)', background:'rgba(220,38,38,0.06)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {user.photo_url
                  ? <img src={user.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                  : <span style={{ color:'#dc2626', fontSize:36 }}>{(user.name||'?')[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ color:'#d0d0d0', fontSize:15, fontWeight:700 }}>{user.name}</div>
                <div style={{ color:'#666', fontSize:10, marginTop:3 }}>{user.age}a · {user.sex==='male'?'M':'F'}</div>
              </div>
            </NeonCard>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {[
                { l:'PESO',    v:`${user.weight} kg`,        c:'#dc2626' },
                { l:'ALTURA',  v:`${user.height} cm`,        c:'#dc2626' },
                { l:'IMC',     v:bmi,                         c:bmiC },
                { l:'TMB',     v:`${Math.round(bmr)} kcal`,  c:'#94a3b8' },
                { l:'TDEE',    v:`${tdee} kcal`,              c:'#94a3b8' },
                { l:'OBJETIVO',v: user.goal==='muscleGain'?'Músculo': user.goal==='weightLoss'?'Perda peso': user.goal==='endurance'?'Resistência':'Manutenção', c:'#ef4444' },
              ].map(s => (
                <div key={s.l} style={{ padding:'10px 12px', background:'rgba(220,38,38,0.04)', border:'1px solid rgba(220,38,38,0.08)', borderRadius:6, textAlign:'center' }}>
                  <div style={{ color:'#666', fontSize:8, letterSpacing:2, marginBottom:4 }}>{s.l}</div>
                  <div style={{ color:s.c, fontSize:14, fontWeight:700 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dica: dados no calendário */}
          <NeonCard color="#6366f1" style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:24 }}>📅</span>
              <div>
                <div style={{ color:'#818cf8', fontSize:11, fontWeight:700, marginBottom:4 }}>SONO & COMPOSIÇÃO CORPORAL</div>
                <div style={{ color:'#555', fontSize:11, lineHeight:1.6 }}>
                  Registre suas noites de sono e medições de bioimpedância na aba <strong style={{ color:'#818cf8' }}>Calendário → Sono</strong> e <strong style={{ color:'#818cf8' }}>Composição</strong>.
                </div>
              </div>
            </div>
          </NeonCard>
        </>
      )}

      {/* ── TAB: EDITAR ─────────────────────────────────────────── */}
      {activeTab === 'editar' && (
        <NeonCard color="#dc2626" style={{ padding:22 }}>
          <SectionTitle color="#dc2626">EDITAR DADOS DO PERFIL</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">NOME</label>
              <input className="input" value={edit.name} onChange={e=>setEdit(v=>({...v,name:e.target.value}))} maxLength={60} />
            </div>
            {[
              { k:'age',    l:'IDADE',      p:'25', min:10, max:100 },
              { k:'weight', l:'PESO (kg)',  p:'70', min:30, max:350 },
              { k:'height', l:'ALTURA (cm)',p:'170',min:100,max:250 },
            ].map(f => (
              <div key={f.k}>
                <label className="label">{f.l}</label>
                <input type="number" className="input" value={edit[f.k]} onChange={e=>setEdit(v=>({...v,[f.k]:e.target.value}))} placeholder={f.p} min={f.min} max={f.max} />
              </div>
            ))}
            <div>
              <label className="label">SEXO</label>
              <select className="select" value={edit.sex} onChange={e=>setEdit(v=>({...v,sex:e.target.value}))}>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">NÍVEL DE ATIVIDADE</label>
              <select className="select" value={edit.activity} onChange={e=>setEdit(v=>({...v,activity:e.target.value}))}>
                {ACTIVITY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">OBJETIVO</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {[
                  {v:'muscleGain', l:'💪 Ganho Muscular'},
                  {v:'weightLoss', l:'⬇ Perda de Peso'},
                  {v:'endurance',  l:'∞ Resistência'},
                  {v:'maintenance',l:'◎ Manutenção'},
                ].map(g => (
                  <button key={g.v} type="button" onClick={() => setEdit(v=>({...v,goal:g.v}))} style={{ padding:'10px 0', borderRadius:6, border:`1px solid ${edit.goal===g.v?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.08)'}`, background:edit.goal===g.v?'rgba(220,38,38,0.12)':'transparent', color:edit.goal===g.v?'#dc2626':'#666', fontFamily:'monospace', fontSize:11, cursor:'pointer', transition:'all 0.15s' }}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">PROGRAMA DE TREINO</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {PROGRAMS.map(p => (
                  <button key={p.v} type="button" onClick={() => setEdit(v=>({...v,program:p.v}))} style={{ padding:'12px 16px', textAlign:'left', borderRadius:6, border:`1px solid ${edit.program===p.v?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.08)'}`, background:edit.program===p.v?'rgba(220,38,38,0.1)':'transparent', color:edit.program===p.v?'#dc2626':'#666', fontFamily:'monospace', fontSize:11, cursor:'pointer', transition:'all 0.15s' }}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn" onClick={saveProfile} disabled={saving}
            style={{ width:'100%', marginTop:20, background:'rgba(220,38,38,0.15)', borderColor:'#dc2626', color:'#ef4444', padding:14, fontSize:14 }}>
            {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
          </button>
        </NeonCard>
      )}
    </div>
  )
}
