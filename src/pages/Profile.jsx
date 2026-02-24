import { useState, useRef } from 'react'
import { updateUser, saveBioEntry, getBioLog, saveSleepEntry, getSleepLog, today } from '../lib/storage'
import { NeonCard, SectionTitle, Modal } from '../components/UI'
import { FUN_FACTS } from '../data/funfacts'

export default function Profile({ user, onUpdate }) {
  const [bioLog, setBioLog] = useState(() => getBioLog(user.id))
  const [sleepLog, setSleepLog] = useState(() => getSleepLog(user.id))
  const [bioModal, setBioModal] = useState(false)
  const [sleepModal, setSleepModal] = useState(false)
  const [factIdx, setFactIdx] = useState(0)
  const fileRef = useRef()

  // Bio form
  const [bio, setBio] = useState({ date: today(), bodyFat: '', muscleMass: '', visceralFat: '', boneMass: '', waterPct: '', bmr: '', metabolicAge: '', note: '' })
  // Sleep form
  const [sleep, setSleep] = useState({ date: today(), hours: '', quality: 3, note: '' })

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const updated = updateUser(user.id, { photo: ev.target.result })
      onUpdate(updated)
    }
    reader.readAsDataURL(file)
  }

  function saveBio() {
    if (!bio.bodyFat && !bio.muscleMass) return
    saveBioEntry(user.id, bio)
    setBioLog(getBioLog(user.id))
    setBioModal(false)
    setBio({ date: today(), bodyFat: '', muscleMass: '', visceralFat: '', boneMass: '', waterPct: '', bmr: '', metabolicAge: '', note: '' })
  }

  function saveSleep() {
    if (!sleep.hours) return
    saveSleepEntry(user.id, sleep)
    setSleepLog(getSleepLog(user.id))
    const updated = updateUser(user.id, { sleepHours: +sleep.hours })
    onUpdate(updated)
    setSleepModal(false)
  }

  const latestBio = bioLog[0]
  const latestSleep = sleepLog[0]
  const avgSleep = sleepLog.length ? (sleepLog.slice(0,7).reduce((s,e) => s + +e.hours, 0) / Math.min(sleepLog.length, 7)).toFixed(1) : '—'

  const bmi = (user.weight / Math.pow(user.height/100,2)).toFixed(1)
  const bmr = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const fact = FUN_FACTS[factIdx % FUN_FACTS.length]

  const QUALITY_LABELS = {1:'Péssimo',2:'Ruim',3:'Regular',4:'Bom',5:'Ótimo'}

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#00ff88', fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>PERFIL</div>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>DADOS PESSOAIS & BIOIMPEDÂNCIA</div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'12px 16px', borderRadius:8, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.12)', display:'flex', gap:12, alignItems:'center', cursor:'pointer', marginBottom:20 }}>
        <span style={{ fontSize:22 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#00d4ff', fontSize:9, letterSpacing:2, marginBottom:3 }}>💡 SABIA QUE... · {fact.category.toUpperCase()} — clique para próximo</div>
          <div style={{ color:'#888', fontSize:11, lineHeight:1.6 }}>{fact.fact}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16, marginBottom:16 }}>
        {/* Avatar */}
        <NeonCard color="#00ff88" style={{ padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:110, height:110, borderRadius:'50%', border:'2px solid rgba(0,255,136,0.3)', background:'rgba(0,255,136,0.08)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {user.photo
              ? <img src={user.photo} alt="" onError={e => { e.target.style.display='none' }} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ color:'#00ff88', fontSize:40 }}>{user.name[0].toUpperCase()}</span>
              }
            </div>
            <button onClick={() => fileRef.current.click()} style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:'50%', background:'#00ff88', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
              📷
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#e0e0e0', fontSize:16, fontWeight:700, marginBottom:4 }}>{user.name}</div>
            <div style={{ color:'#555', fontSize:10, letterSpacing:1 }}>{user.age}a · {user.sex==='male'?'M':'F'} · {user.weight}kg</div>
          </div>
          <div style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { l:'IMC', v:bmi },
              { l:'TMB', v:`${Math.round(bmr)} kcal` },
              { l:'Altura', v:`${user.height}cm` },
              { l:'Peso', v:`${user.weight}kg` },
            ].map(s => (
              <div key={s.l} style={{ padding:'8px', background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.08)', borderRadius:6, textAlign:'center' }}>
                <div style={{ color:'#444', fontSize:8, letterSpacing:2 }}>{s.l}</div>
                <div style={{ color:'#00ff88', fontSize:13, fontWeight:700, marginTop:2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </NeonCard>

        {/* Summary cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Sleep */}
          <NeonCard color="#4ecdc4" style={{ padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <SectionTitle color="#4ecdc4">SONO</SectionTitle>
                <div style={{ display:'flex', gap:16 }}>
                  <div>
                    <div style={{ color:'#444', fontSize:9, letterSpacing:2 }}>ÚLTIMA NOITE</div>
                    <div style={{ color:'#4ecdc4', fontSize:26, fontWeight:700 }}>{latestSleep?.hours || '—'}<span style={{ fontSize:12, color:'#555' }}>h</span></div>
                  </div>
                  <div>
                    <div style={{ color:'#444', fontSize:9, letterSpacing:2 }}>MÉDIA 7 DIAS</div>
                    <div style={{ color:'#4ecdc4', fontSize:26, fontWeight:700 }}>{avgSleep}<span style={{ fontSize:12, color:'#555' }}>h</span></div>
                  </div>
                  {latestSleep && (
                    <div>
                      <div style={{ color:'#444', fontSize:9, letterSpacing:2 }}>QUALIDADE</div>
                      <div style={{ color:'#4ecdc4', fontSize:13, fontWeight:700, marginTop:6 }}>{QUALITY_LABELS[latestSleep.quality]}</div>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn" onClick={() => setSleepModal(true)} style={{ fontSize:11, padding:'6px 14px' }}>+ REGISTRAR</button>
            </div>
            {sleepLog.slice(0,7).length > 0 && (
              <div style={{ display:'flex', gap:4, marginTop:12 }}>
                {[...Array(7)].map((_,i) => {
                  const e = sleepLog[6-i]
                  const h = e ? +e.hours : 0
                  return (
                    <div key={i} title={e ? `${e.date}: ${e.hours}h` : ''} style={{ flex:1, borderRadius:3, background: h>=7 ? '#4ecdc4' : h>=6 ? '#4ecdc490' : h>0 ? '#ff9f4360' : '#111', height: Math.max(h*4, 4), alignSelf:'flex-end', transition:'all 0.3s' }} />
                  )
                })}
              </div>
            )}
          </NeonCard>

          {/* Latest bioimpedance */}
          <NeonCard color="#f7c59f" style={{ padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <SectionTitle color="#f7c59f">BIOIMPEDÂNCIA</SectionTitle>
              <button className="btn" onClick={() => setBioModal(true)} style={{ fontSize:11, padding:'6px 14px' }}>+ MEDIR</button>
            </div>
            {latestBio ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[
                  { l:'GORDURA', v:`${latestBio.bodyFat}%`, c:'#ff6b6b' },
                  { l:'MÚSCULO', v:`${latestBio.muscleMass}%`, c:'#00ff88' },
                  { l:'VISCERAL', v:latestBio.visceralFat||'—', c:'#ff9f43' },
                  { l:'ÁGUA', v:`${latestBio.waterPct}%`, c:'#00d4ff' },
                ].map(s => (
                  <div key={s.l} style={{ padding:'8px', background:`${s.c}08`, border:`1px solid ${s.c}15`, borderRadius:6, textAlign:'center' }}>
                    <div style={{ color:'#444', fontSize:8, letterSpacing:1.5 }}>{s.l}</div>
                    <div style={{ color:s.c, fontSize:16, fontWeight:700, marginTop:3 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color:'#333', fontSize:11, marginTop:8 }}>Nenhuma medição registrada. Adicione dados da sua balança de bioimpedância.</div>
            )}
          </NeonCard>
        </div>
      </div>

      {/* Bioimpedance history */}
      {bioLog.length > 1 && (
        <NeonCard color="#f7c59f" style={{ padding:20, marginBottom:16 }}>
          <SectionTitle color="#f7c59f">HISTÓRICO DE BIOIMPEDÂNCIA</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {bioLog.slice(0,5).map((e,i) => (
              <div key={e.id} style={{ display:'flex', gap:16, padding:'10px 14px', borderRadius:6, background:'rgba(247,197,159,0.04)', border:'1px solid rgba(247,197,159,0.1)', alignItems:'center' }}>
                <div style={{ color:'#555', fontSize:10, minWidth:80 }}>{e.date}</div>
                {[
                  { l:'Gordura', v:`${e.bodyFat}%`, c:'#ff6b6b' },
                  { l:'Músculo', v:`${e.muscleMass}%`, c:'#00ff88' },
                  { l:'Visceral', v:e.visceralFat, c:'#ff9f43' },
                  { l:'Água', v:`${e.waterPct}%`, c:'#00d4ff' },
                ].map(s => s.v && (
                  <div key={s.l}>
                    <div style={{ color:'#444', fontSize:8 }}>{s.l}</div>
                    <div style={{ color:s.c, fontSize:13, fontWeight:700 }}>{s.v}</div>
                  </div>
                ))}
                {e.note && <div style={{ color:'#555', fontSize:10, marginLeft:'auto' }}>{e.note}</div>}
              </div>
            ))}
          </div>
        </NeonCard>
      )}

      {/* Bio modal */}
      {bioModal && (
        <Modal title="NOVA MEDIÇÃO DE BIOIMPEDÂNCIA" color="#f7c59f" onClose={() => setBioModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { k:'date', l:'DATA', type:'date' },
              { k:'bodyFat', l:'GORDURA CORPORAL (%)', placeholder:'ex: 18.5' },
              { k:'muscleMass', l:'MASSA MUSCULAR (%)', placeholder:'ex: 42.0' },
              { k:'visceralFat', l:'GORDURA VISCERAL (nível)', placeholder:'ex: 5' },
              { k:'waterPct', l:'ÁGUA CORPORAL (%)', placeholder:'ex: 55.0' },
              { k:'boneMass', l:'MASSA ÓSSEA (kg)', placeholder:'ex: 3.2' },
              { k:'bmr', l:'TMB (kcal) pela balança', placeholder:'ex: 1650' },
              { k:'metabolicAge', l:'IDADE METABÓLICA', placeholder:'ex: 24' },
            ].map(f => (
              <div key={f.k}>
                <label className="label">{f.l}</label>
                <input type={f.type||'number'} value={bio[f.k]} onChange={e=>setBio(b=>({...b,[f.k]:e.target.value}))}
                  placeholder={f.placeholder} className="input" style={{ borderColor:'rgba(247,197,159,0.25)', color:'#f7c59f' }} />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">OBSERVAÇÕES</label>
              <input value={bio.note} onChange={e=>setBio(b=>({...b,note:e.target.value}))} placeholder="Notas opcionais..." className="input" style={{ borderColor:'rgba(247,197,159,0.25)', color:'#f7c59f' }} />
            </div>
          </div>
          <button className="btn" onClick={saveBio} style={{ width:'100%', marginTop:16, background:'rgba(247,197,159,0.15)', borderColor:'#f7c59f', color:'#f7c59f' }}>
            SALVAR MEDIÇÃO
          </button>
        </Modal>
      )}

      {/* Sleep modal */}
      {sleepModal && (
        <Modal title="REGISTRAR SONO" color="#4ecdc4" onClose={() => setSleepModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">DATA</label>
              <input type="date" value={sleep.date} onChange={e=>setSleep(s=>({...s,date:e.target.value}))} className="input" style={{ borderColor:'rgba(78,205,196,0.25)', color:'#4ecdc4' }} />
            </div>
            <div>
              <label className="label">HORAS DORMIDAS</label>
              <input type="number" step="0.5" min="0" max="24" value={sleep.hours} onChange={e=>setSleep(s=>({...s,hours:e.target.value}))} placeholder="ex: 7.5" className="input" style={{ borderColor:'rgba(78,205,196,0.25)', color:'#4ecdc4' }} />
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <label className="label">QUALIDADE DO SONO</label>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              {[1,2,3,4,5].map(q => (
                <button key={q} onClick={() => setSleep(s=>({...s,quality:q}))} style={{ flex:1, padding:'10px 0', borderRadius:6, border:`1px solid ${sleep.quality===q?'#4ecdc460':'#ffffff10'}`, background:sleep.quality===q?'rgba(78,205,196,0.15)':'rgba(255,255,255,0.02)', color:sleep.quality===q?'#4ecdc4':'#555', fontFamily:'monospace', fontSize:11, cursor:'pointer' }}>
                  {QUALITY_LABELS[q]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <label className="label">OBSERVAÇÕES</label>
            <input value={sleep.note} onChange={e=>setSleep(s=>({...s,note:e.target.value}))} placeholder="ex: acordei 2x, pesadelo, etc..." className="input" style={{ marginTop:6, borderColor:'rgba(78,205,196,0.25)', color:'#4ecdc4' }} />
          </div>
          <button className="btn" onClick={saveSleep} style={{ width:'100%', marginTop:16, background:'rgba(78,205,196,0.15)', borderColor:'#4ecdc4', color:'#4ecdc4' }}>
            SALVAR
          </button>
        </Modal>
      )}
    </div>
  )
}

const QUALITY_LABELS = {1:'Péssimo',2:'Ruim',3:'Regular',4:'Bom',5:'Ótimo'}
