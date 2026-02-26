import { useState } from 'react'
import { upsertProfile, saveBioEntry, getBioLog, saveSleepEntry, getSleepLog, today } from '../lib/db'
import { NeonCard, SectionTitle, Modal } from '../components/UI'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { FUN_FACTS } from '../data/funfacts'

const QUALITY_LABELS = { 1:'Péssimo', 2:'Ruim', 3:'Regular', 4:'Bom', 5:'Ótimo' }

const ACTIVITY_OPTS = [
  { v:'1.2',    l:'Sedentário' },
  { v:'1.375',  l:'Levemente ativo (1–3x/sem)' },
  { v:'1.55',   l:'Moderado (3–5x/sem)' },
  { v:'1.725',  l:'Muito ativo (6–7x/sem)' },
  { v:'1.9',    l:'Extremamente ativo' },
]

const PROGRAMS = [
  { v:'upperLower5', l:'Upper/Lower 5x — Intermediário' },
  { v:'ppl6',        l:'PPL 6x — Avançado' },
]

export default function Profile({ user, userId, onUpdate }) {
  const [activeTab, setActiveTab] = useState('perfil') // perfil | historico | editar
  const [bioLog, setBioLog]       = useState([])
  const [sleepLog, setSleepLog]   = useState([])
  const [bioModal, setBioModal]   = useState(false)
  const [sleepModal, setSleepModal] = useState(false)
  const [factIdx, setFactIdx]     = useState(0)
  const [saving, setSaving]       = useState(false)

  // Bio form
  const [bio, setBio] = useState({ date: today(), body_fat:'', muscle_mass:'', visceral_fat:'', bone_mass:'', water_pct:'', bmr:'', metabolic_age:'', note:'' })

  // Sleep form
  const [sleep, setSleep] = useState({ date: today(), hours:'', quality:3, note:'' })

  // Edit form — pre-filled with current values
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

  // Load logs when switching to history tab
  function handleTabChange(t) {
    setActiveTab(t)
    if (t === 'historico') {
      getBioLog(userId, 20).then(setBioLog).catch(()=>{})
      getSleepLog(userId, 14).then(setSleepLog).catch(()=>{})
    }
  }

  async function saveBio() {
    if (!bio.body_fat && !bio.muscle_mass) return
    await saveBioEntry(userId, bio)
    const fresh = await getBioLog(userId, 20)
    setBioLog(fresh)
    setBioModal(false)
    setBio({ date: today(), body_fat:'', muscle_mass:'', visceral_fat:'', bone_mass:'', water_pct:'', bmr:'', metabolic_age:'', note:'' })
  }

  async function saveSleep() {
    if (!sleep.hours) return
    await saveSleepEntry(userId, sleep)
    const fresh = await getSleepLog(userId, 14)
    setSleepLog(fresh)
    setSleepModal(false)
  }

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

  const bmi   = (user.weight / Math.pow(user.height/100, 2)).toFixed(1)
  const bmiC  = bmi<18.5?'#94a3b8':bmi<25?'#dc2626':bmi<30?'#ef4444':'#ff6b6b'
  const bmr   = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee  = Math.round(bmr * (user.activity || 1.55))
  const fact  = FUN_FACTS[factIdx % FUN_FACTS.length]

  // Chart data — weight history from bio_log
  const weightData = bioLog
    .filter(e => e.weight || e.body_fat)
    .map(e => ({ date: e.date?.slice(5), gordura: e.body_fat, musculo: e.muscle_mass }))
    .reverse()

  const tabs = [
    { id:'perfil',    label:'Perfil' },
    { id:'historico', label:'Histórico' },
    { id:'editar',    label:'Editar Perfil' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:20 }}>
        <div style={{ color:'#dc2626', fontSize:22, letterSpacing:4, fontWeight:700 }}>PERFIL</div>
        <div style={{ color:'#666', fontSize:10, letterSpacing:3, marginTop:4 }}>DADOS PESSOAIS & HISTÓRICO</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} className="btn"
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
              {/* Avatar — sem botão de foto */}
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

            {/* Stats grid */}
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

          {/* Quick actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button className="btn" onClick={() => setBioModal(true)} style={{ padding:14, background:'rgba(148,163,184,0.08)', borderColor:'rgba(148,163,184,0.3)', color:'#94a3b8' }}>
              ⚖ NOVA MEDIÇÃO
            </button>
            <button className="btn" onClick={() => setSleepModal(true)} style={{ padding:14, background:'rgba(100,116,139,0.08)', borderColor:'rgba(100,116,139,0.3)', color:'#64748b' }}>
              😴 REGISTRAR SONO
            </button>
          </div>
        </>
      )}

      {/* ── TAB: HISTÓRICO ──────────────────────────────────────── */}
      {activeTab === 'historico' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ color:'#666', fontSize:10, letterSpacing:2 }}>BIOIMPEDÂNCIA & COMPOSIÇÃO CORPORAL</div>
            <button className="btn" onClick={() => setBioModal(true)} style={{ fontSize:10, padding:'6px 14px', color:'#94a3b8', borderColor:'rgba(148,163,184,0.3)' }}>+ NOVA</button>
          </div>

          {/* Chart — gordura vs músculo */}
          {weightData.length >= 2 && (
            <NeonCard color="#94a3b8" style={{ padding:16, marginBottom:14 }}>
              <SectionTitle color="#94a3b8">EVOLUÇÃO DA COMPOSIÇÃO</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background:'#0a0a0c', border:'1px solid #94a3b825', borderRadius:4, fontFamily:'monospace', fontSize:10 }} />
                  <Line type="monotone" dataKey="gordura" stroke="#ff6b6b" strokeWidth={2} dot={{ r:3, fill:'#ff6b6b' }} name="Gordura %" />
                  <Line type="monotone" dataKey="musculo" stroke="#dc2626" strokeWidth={2} dot={{ r:3, fill:'#dc2626' }} name="Músculo %" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:10, height:2, background:'#ff6b6b', borderRadius:1 }}/><span style={{ color:'#888', fontSize:10 }}>Gordura %</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:10, height:2, background:'#dc2626', borderRadius:1 }}/><span style={{ color:'#888', fontSize:10 }}>Músculo %</span></div>
              </div>
            </NeonCard>
          )}

          {/* History list */}
          {bioLog.length === 0 ? (
            <NeonCard color="#94a3b8" style={{ padding:32, textAlign:'center' }}>
              <div style={{ color:'#333', fontSize:12, marginBottom:16 }}>Nenhuma medição registrada ainda.</div>
              <button className="btn" onClick={() => setBioModal(true)} style={{ background:'rgba(148,163,184,0.1)', borderColor:'#94a3b8', color:'#94a3b8' }}>+ ADICIONAR PRIMEIRA MEDIÇÃO</button>
            </NeonCard>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {bioLog.map((e, i) => (
                <NeonCard key={e.id} color="#94a3b8" style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: (e.body_fat||e.muscle_mass) ? 10 : 0 }}>
                    <div style={{ color:'#d0d0d0', fontSize:12, fontWeight:700 }}>{e.date}</div>
                    {i === 0 && <span style={{ background:'rgba(220,38,38,0.15)', color:'#dc2626', fontSize:8, letterSpacing:2, padding:'3px 8px', borderRadius:3 }}>MAIS RECENTE</span>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[
                      { l:'Gordura',  v: e.body_fat     ? `${e.body_fat}%`     : null, c:'#ff6b6b' },
                      { l:'Músculo',  v: e.muscle_mass  ? `${e.muscle_mass}%`  : null, c:'#dc2626' },
                      { l:'Visceral', v: e.visceral_fat ? `${e.visceral_fat}`  : null, c:'#ef4444' },
                      { l:'Água',     v: e.water_pct    ? `${e.water_pct}%`    : null, c:'#94a3b8' },
                      { l:'Óssea',    v: e.bone_mass    ? `${e.bone_mass}kg`   : null, c:'#888' },
                      { l:'TMB',      v: e.bmr          ? `${e.bmr} kcal`      : null, c:'#64748b' },
                      { l:'Id. Met.', v: e.metabolic_age? `${e.metabolic_age}a`: null, c:'#94a3b8' },
                    ].filter(s => s.v).map(s => (
                      <div key={s.l} style={{ padding:'6px 8px', background:`${s.c}08`, border:`1px solid ${s.c}15`, borderRadius:5, textAlign:'center' }}>
                        <div style={{ color:'#444', fontSize:8, letterSpacing:1 }}>{s.l.toUpperCase()}</div>
                        <div style={{ color:s.c, fontSize:13, fontWeight:700, marginTop:2 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {e.note && <div style={{ color:'#666', fontSize:11, marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)' }}>📝 {e.note}</div>}

                  {/* Delta vs anterior */}
                  {i < bioLog.length-1 && bioLog[i+1].body_fat && e.body_fat && (
                    <div style={{ marginTop:8, fontSize:10, color:'#666' }}>
                      Gordura: <span style={{ color: e.body_fat < bioLog[i+1].body_fat ? '#dc2626' : '#ff6b6b', fontWeight:700 }}>
                        {e.body_fat < bioLog[i+1].body_fat ? '↓' : '↑'} {Math.abs(e.body_fat - bioLog[i+1].body_fat).toFixed(1)}%
                      </span> vs medição anterior
                    </div>
                  )}
                </NeonCard>
              ))}
            </div>
          )}
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
          <button className="btn" onClick={saveProfile} disabled={saving} style={{ width:'100%', marginTop:20, padding:14, background:'rgba(220,38,38,0.15)', borderColor:'#dc2626', fontSize:12, letterSpacing:3 }}>
            {saving ? 'SALVANDO...' : '✓ SALVAR ALTERAÇÕES'}
          </button>
        </NeonCard>
      )}

      {/* ── Modal Bioimpedância ─────────────────────────────────── */}
      {bioModal && (
        <Modal title="NOVA MEDIÇÃO DE BIOIMPEDÂNCIA" color="#dc2626" onClose={() => setBioModal(false)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { k:'date',         l:'DATA',                    t:'date'   },
              { k:'body_fat',     l:'GORDURA CORPORAL (%)',    p:'ex: 18.5' },
              { k:'muscle_mass',  l:'MASSA MUSCULAR (%)',      p:'ex: 42.0' },
              { k:'visceral_fat', l:'GORDURA VISCERAL (nível)',p:'ex: 5' },
              { k:'water_pct',    l:'ÁGUA CORPORAL (%)',       p:'ex: 55.0' },
              { k:'bone_mass',    l:'MASSA ÓSSEA (kg)',        p:'ex: 3.2' },
              { k:'bmr',          l:'TMB pela balança (kcal)', p:'ex: 1650' },
              { k:'metabolic_age',l:'IDADE METABÓLICA',        p:'ex: 24' },
            ].map(f => (
              <div key={f.k}>
                <label className="label" style={{ fontSize:16, marginBottom:6 }}>{f.l}</label>
                <input type={f.t||'number'} step="0.1" value={bio[f.k]} onChange={e=>setBio(b=>({...b,[f.k]:e.target.value}))} placeholder={f.p}
                  className="input" style={{ borderColor:'rgba(220,38,38,0.25)', color:'#d0d0d0', padding:'11px 14px', fontSize:21 }} />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label" style={{ fontSize:16, marginBottom:6 }}>OBSERVAÇÕES</label>
              <input value={bio.note} onChange={e=>setBio(b=>({...b,note:e.target.value}))} placeholder="Notas opcionais..." className="input" style={{ borderColor:'rgba(220,38,38,0.15)', padding:'11px 14px', fontSize:21 }} />
            </div>
          </div>
          <button className="btn" onClick={saveBio} style={{ width:'100%', marginTop:16, background:'rgba(220,38,38,0.15)', borderColor:'#dc2626', color:'#ef4444', padding:14, fontSize:19 }}>
            SALVAR MEDIÇÃO
          </button>
        </Modal>
      )}

      {/* ── Modal Sono ──────────────────────────────────────────── */}
      {sleepModal && (
        <Modal title="REGISTRAR SONO" color="#64748b" onClose={() => setSleepModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label className="label">DATA</label>
              <input type="date" value={sleep.date} onChange={e=>setSleep(s=>({...s,date:e.target.value}))} className="input" style={{ borderColor:'rgba(100,116,139,0.25)', color:'#64748b' }} />
            </div>
            <div>
              <label className="label">HORAS DORMIDAS</label>
              <input type="number" step="0.5" min="0" max="24" value={sleep.hours} onChange={e=>setSleep(s=>({...s,hours:e.target.value}))} placeholder="ex: 7.5" className="input" style={{ borderColor:'rgba(100,116,139,0.25)', color:'#64748b' }} />
            </div>
          </div>
          <label className="label">QUALIDADE DO SONO</label>
          <div style={{ display:'flex', gap:6, marginBottom:14 }}>
            {[1,2,3,4,5].map(q => (
              <button key={q} onClick={() => setSleep(s=>({...s,quality:q}))} style={{ flex:1, padding:'10px 0', borderRadius:6, border:`1px solid ${sleep.quality===q?'#4ecdc460':'rgba(255,255,255,0.08)'}`, background:sleep.quality===q?'rgba(100,116,139,0.15)':'transparent', color:sleep.quality===q?'#64748b':'#666', fontFamily:'monospace', fontSize:10, cursor:'pointer' }}>
                {QUALITY_LABELS[q]}
              </button>
            ))}
          </div>
          <label className="label">OBSERVAÇÕES</label>
          <input value={sleep.note} onChange={e=>setSleep(s=>({...s,note:e.target.value}))} placeholder="ex: acordei 2x, pesadelo..." className="input" style={{ borderColor:'rgba(100,116,139,0.2)', marginBottom:14 }} />
          <button className="btn" onClick={saveSleep} style={{ width:'100%', background:'rgba(100,116,139,0.15)', borderColor:'#64748b', color:'#64748b', padding:14 }}>
            SALVAR
          </button>
        </Modal>
      )}
    </div>
  )
}
