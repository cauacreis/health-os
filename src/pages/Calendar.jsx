import { useState, useEffect } from 'react'
import { getCalendar, addCalendarEntry, removeCalendarEntry, getWorkoutLogs, getCardioLog,
         getSleepLog, saveSleepEntry, getBioLog, saveBioEntry, today } from '../lib/db'
import { NeonCard, SectionTitle, Modal } from '../components/UI'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAY_NAMES   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const QUALITY_LABELS = { 1:'Péssimo', 2:'Ruim', 3:'Regular', 4:'Bom', 5:'Ótimo' }

const R  = '#dc2626'
const R2 = '#ef4444'
const S  = '#94a3b8'
const SL = '#6366f1'

const TYPE_CFG = {
  workout: { label:'Treino',   color: R,        icon:'💪' },
  cardio:  { label:'Cardio',   color: S,        icon:'🏃' },
  rest:    { label:'Descanso', color:'#64748b', icon:'😴' },
  sleep:   { label:'Sono',     color: SL,       icon:'🌙' },
}

export default function CalendarPage({ user, userId }) {
  const now = new Date()
  const [tab,     setTab]     = useState('calendar')
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth())
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(null)
  const [modal,   setModal]   = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addType,  setAddType]  = useState('workout')

  // Desempenho
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [cardioLogs,  setCardioLogs]  = useState([])
  const [perfLoaded,  setPerfLoaded]  = useState(false)

  // Sono
  const [sleepLogs,   setSleepLogs]   = useState([])
  const [sleepLoaded, setSleepLoaded] = useState(false)
  const [sleepForm,   setSleepForm]   = useState({ date: today(), hours:'', quality:3, note:'' })
  const [savingSleep, setSavingSleep] = useState(false)

  // Composição
  const [bioLog,    setBioLog]    = useState([])
  const [bioLoaded, setBioLoaded] = useState(false)
  const [bioModal,  setBioModal]  = useState(false)
  const [bioForm,   setBioForm]   = useState({ date: today(), body_fat:'', muscle_mass:'', visceral_fat:'', bone_mass:'', water_pct:'', bmr:'', metabolic_age:'', note:'' })

  useEffect(() => {
    getCalendar(userId).then(setEntries).catch(() => {})
  }, [userId])

  useEffect(() => {
    if (tab === 'performance' && !perfLoaded) {
      Promise.all([getWorkoutLogs(userId, 60), getCardioLog(userId, 60)])
        .then(([w, c]) => { setWorkoutLogs(w); setCardioLogs(c); setPerfLoaded(true) })
        .catch(() => setPerfLoaded(true))
    }
    if (tab === 'sleep' && !sleepLoaded) {
      getSleepLog(userId, 60).then(d => { setSleepLogs(d); setSleepLoaded(true) }).catch(() => setSleepLoaded(true))
    }
    if (tab === 'body' && !bioLoaded) {
      getBioLog(userId, 40).then(d => { setBioLog(d); setBioLoaded(true) }).catch(() => setBioLoaded(true))
    }
  }, [tab, perfLoaded, sleepLoaded, bioLoaded, userId])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateStr(day) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }
  function getDayEntries(day) { return entries.filter(e => e.date === dateStr(day)) }
  function handleDayClick(day) { setSelected(day); setModal(true); setNoteText(''); setAddType('workout') }

  async function handleAdd() {
    const ds = dateStr(selected)
    await addCalendarEntry(userId, { date: ds, type: addType, note: noteText, label: TYPE_CFG[addType].label })
    setEntries(await getCalendar(userId))
    setNoteText('')
  }
  async function handleRemove(date, type) {
    await removeCalendarEntry(userId, date, type)
    setEntries(await getCalendar(userId))
    setModal(false)
    setTimeout(() => setModal(true), 50)
  }

  async function saveSleep() {
    if (!sleepForm.hours) return
    setSavingSleep(true)
    try {
      await saveSleepEntry(userId, sleepForm)
      // Marca no calendário como 🌙
      await addCalendarEntry(userId, {
        date: sleepForm.date,
        type: 'sleep',
        note: `${sleepForm.hours}h · ${QUALITY_LABELS[sleepForm.quality]}`,
        label: 'Sono'
      }).catch(() => {})
      const [fresh, cal] = await Promise.all([getSleepLog(userId, 60), getCalendar(userId)])
      setSleepLogs(fresh)
      setEntries(cal)
      setSleepForm({ date: today(), hours:'', quality:3, note:'' })
    } catch(e) { console.error(e) }
    finally { setSavingSleep(false) }
  }

  async function saveBio() {
    if (!bioForm.body_fat && !bioForm.muscle_mass) return
    await saveBioEntry(userId, bioForm)
    setBioLog(await getBioLog(userId, 40))
    setBioModal(false)
    setBioForm({ date: today(), body_fat:'', muscle_mass:'', visceral_fat:'', bone_mass:'', water_pct:'', bmr:'', metabolic_age:'', note:'' })
  }

  const todayStr  = new Date().toISOString().split('T')[0]
  const thisMonth = entries.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
  const streak    = calcStreak(entries)
  const weeklyData   = buildWeeklyData(workoutLogs, cardioLogs)
  const cardioByType = buildCardioByType(cardioLogs)
  const sleepData  = sleepLogs.slice(0, 30).reverse().map(e => ({ date: e.date?.slice(5), horas: +e.hours, qualidade: e.quality }))
  const avgSleep   = sleepLogs.length ? (sleepLogs.reduce((s,e) => s + +e.hours, 0) / sleepLogs.length).toFixed(1) : '—'
  const bioChartData = bioLog.filter(e => e.body_fat || e.muscle_mass).map(e => ({ date: e.date?.slice(5), gordura: e.body_fat, musculo: e.muscle_mass })).reverse()

  const TABS = [
    { id:'calendar',    label:'📅 Calendário' },
    { id:'performance', label:'📊 Treinos' },
    { id:'sleep',       label:'😴 Sono' },
    { id:'body',        label:'🧬 Composição' },
  ]

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:18 }}>
        <div style={{ color:R, fontSize:20, letterSpacing:4, fontWeight:700 }}>CALENDÁRIO</div>
        <div style={{ color:'#555', fontSize:10, letterSpacing:2, marginTop:4 }}>HISTÓRICO & DESEMPENHO</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn"
            style={{ padding:'10px 0', fontSize:10, background: tab===t.id ? 'rgba(220,38,38,0.15)' : 'transparent', borderColor: tab===t.id ? R : 'rgba(255,255,255,0.08)', color: tab===t.id ? R2 : '#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CALENDÁRIO ───────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[
              { l:'Treinos',  v: thisMonth.filter(e=>e.type==='workout').length, c: R },
              { l:'Cardios',  v: thisMonth.filter(e=>e.type==='cardio').length,  c: S },
              { l:'Sono',     v: thisMonth.filter(e=>e.type==='sleep').length,   c: SL },
              { l:'Sequência',v: `${streak}d`,                                   c: R },
            ].map(s => (
              <NeonCard key={s.l} color={s.c} style={{ padding:'12px 8px', textAlign:'center' }}>
                <div style={{ color:s.c, fontSize:22, fontWeight:700 }}>{s.v}</div>
                <div style={{ color:'#444', fontSize:9, letterSpacing:1.5, marginTop:4, textTransform:'uppercase' }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>

          <NeonCard color={R} style={{ padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }}
                style={{ background:'none', border:`1px solid rgba(220,38,38,0.2)`, borderRadius:6, color:R2, cursor:'pointer', fontSize:20, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
              <div style={{ color:'#d0d0d0', fontSize:15, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>{MONTH_NAMES[month]} {year}</div>
              <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }}
                style={{ background:'none', border:`1px solid rgba(220,38,38,0.2)`, borderRadius:6, color:R2, cursor:'pointer', fontSize:20, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:6 }}>
              {DAY_NAMES.map(d => <div key={d} style={{ textAlign:'center', color:'#444', fontSize:10, letterSpacing:1, padding:'3px 0', fontWeight:700 }}>{d}</div>)}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`e${i}`} />
                const ds = dateStr(day)
                const dayEnt = getDayEntries(day)
                const isToday = ds === todayStr
                const hasSleep = dayEnt.some(e => e.type === 'sleep')
                return (
                  <div key={day} onClick={() => handleDayClick(day)}
                    style={{ aspectRatio:'1', borderRadius:7, cursor:'pointer', border:`1px solid ${isToday ? R+'60' : 'rgba(255,255,255,0.05)'}`, background: isToday ? 'rgba(220,38,38,0.1)' : dayEnt.length ? 'rgba(220,38,38,0.04)' : 'rgba(255,255,255,0.01)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, padding:2, transition:'all 0.15s', WebkitTapHighlightColor:'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(220,38,38,0.1)' : dayEnt.length ? 'rgba(220,38,38,0.04)' : 'rgba(255,255,255,0.01)'}>
                    <div style={{ fontSize:12, color: isToday ? R : '#999', fontWeight: isToday ? 700 : 400 }}>{day}</div>
                    <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                      {dayEnt.filter(e => e.type !== 'sleep').map(e => (
                        <div key={e.type} style={{ width:5, height:5, borderRadius:'50%', background: TYPE_CFG[e.type]?.color || '#555' }} />
                      ))}
                      {hasSleep && <span style={{ fontSize:7, lineHeight:1 }}>🌙</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display:'flex', gap:12, marginTop:14, justifyContent:'center', flexWrap:'wrap' }}>
              {Object.entries(TYPE_CFG).map(([k,v]) => (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:v.color }} />
                  <span style={{ color:'#555', fontSize:10 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </NeonCard>

          {modal && selected && (
            <Modal title={`${String(selected).padStart(2,'0')} DE ${MONTH_NAMES[month].toUpperCase()}`} color={R} onClose={() => setModal(false)}>
              {getDayEntries(selected).length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ color:'#444', fontSize:10, letterSpacing:2, marginBottom:10 }}>REGISTRADO</div>
                  {getDayEntries(selected).map(e => (
                    <div key={e.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:8, background:`${TYPE_CFG[e.type]?.color||R}10`, border:`1px solid ${TYPE_CFG[e.type]?.color||R}20`, marginBottom:8 }}>
                      <div>
                        <span style={{ fontSize:16, marginRight:8 }}>{TYPE_CFG[e.type]?.icon}</span>
                        <span style={{ color:TYPE_CFG[e.type]?.color||R, fontSize:13, fontWeight:700 }}>{TYPE_CFG[e.type]?.label||e.type}</span>
                        {e.note && <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{e.note}</div>}
                      </div>
                      <button onClick={() => handleRemove(dateStr(selected), e.type)} style={{ background:'none', border:'none', color:R2, cursor:'pointer', fontSize:16, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ color:'#444', fontSize:10, letterSpacing:2, marginBottom:10 }}>ADICIONAR ATIVIDADE</div>
              <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                {Object.entries(TYPE_CFG).filter(([k]) => k !== 'sleep').map(([k,v]) => (
                  <button key={k} onClick={() => setAddType(k)} className="btn"
                    style={{ flex:1, borderColor: addType===k ? v.color+'80' : undefined, color: addType===k ? v.color : undefined, background: addType===k ? `${v.color}15` : undefined, padding:'10px 0', fontSize:12 }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Observações (opcional)..."
                className="input" style={{ height:64, resize:'vertical', marginBottom:12, fontSize:13 }} />
              <button className="btn" onClick={handleAdd} style={{ width:'100%', background:'rgba(220,38,38,0.15)', borderColor:R, color:R2, padding:13, fontSize:13 }}>SALVAR</button>
            </Modal>
          )}
        </>
      )}

      {/* ── DESEMPENHO ───────────────────────────────────────────── */}
      {tab === 'performance' && (
        <>
          {!perfLoaded ? <div style={{ padding:40, textAlign:'center', color:'#444' }}>Carregando...</div> : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { l:'Treinos totais', v: workoutLogs.length, c: R },
                  { l:'Sessões cardio', v: cardioLogs.length,  c: S },
                  { l:'Dias seguidos',  v: streak,             c: R },
                ].map(s => (
                  <NeonCard key={s.l} color={s.c} style={{ padding:'16px 10px', textAlign:'center' }}>
                    <div style={{ color: s.c === R ? R2 : s.c, fontSize:26, fontWeight:700 }}>{s.v}</div>
                    <div style={{ color:'#555', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
                  </NeonCard>
                ))}
              </div>

              {weeklyData.length > 0 && (
                <NeonCard color={R} style={{ padding:18, marginBottom:14 }}>
                  <SectionTitle color={R}>TREINOS POR SEMANA</SectionTitle>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyData} barGap={4}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
                      <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} />
                      <Bar dataKey="treinos" fill={R} opacity={0.85} radius={[4,4,0,0]} name="Treinos" />
                      <Bar dataKey="cardio"  fill={S} opacity={0.7}  radius={[4,4,0,0]} name="Cardio" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:8 }}>
                    <LegendDot color={R} label="Treinos" /><LegendDot color={S} label="Cardio" />
                  </div>
                </NeonCard>
              )}

              {cardioByType.length > 0 && (
                <NeonCard color={R} style={{ padding:18, marginBottom:14 }}>
                  <SectionTitle color={R}>CARDIO POR TIPO</SectionTitle>
                  {cardioByType.map(ct => (
                    <div key={ct.type} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                      <div style={{ color:'#999', fontSize:12, minWidth:90 }}>{ct.type}</div>
                      <div style={{ flex:1, height:7, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(ct.count/cardioByType[0].count)*100}%`, background:R, borderRadius:4 }} />
                      </div>
                      <div style={{ color:R2, fontSize:12, fontWeight:700, minWidth:24, textAlign:'right' }}>{ct.count}x</div>
                    </div>
                  ))}
                </NeonCard>
              )}

              {workoutLogs.length > 0 && (
                <NeonCard color={R} style={{ padding:18 }}>
                  <SectionTitle color={R}>ÚLTIMOS TREINOS</SectionTitle>
                  {workoutLogs.slice(0,8).map((w,i) => (
                    <div key={i} style={{ padding:'11px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(220,38,38,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div>
                        <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{w.day_name||'Treino'}</div>
                        <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{w.date} · {w.program_name||''}</div>
                      </div>
                      <div style={{ color: w.completed ? R2 : '#333', fontSize:12, fontWeight:700 }}>{w.completed ? '✓ Concluído' : '○ Parcial'}</div>
                    </div>
                  ))}
                </NeonCard>
              )}

              {workoutLogs.length === 0 && cardioLogs.length === 0 && (
                <NeonCard color={R} style={{ padding:40, textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
                  <div style={{ color:'#444', fontSize:13 }}>Nenhum dado ainda.</div>
                </NeonCard>
              )}
            </>
          )}
        </>
      )}

      {/* ── SONO ─────────────────────────────────────────────────── */}
      {tab === 'sleep' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {[
              { l:'Noites registradas', v: sleepLogs.length,    c: SL },
              { l:'Média de sono',      v: `${avgSleep}h`,      c: S },
              { l:'Meta diária',        v: '8h',                c: R },
            ].map(s => (
              <NeonCard key={s.l} color={s.c} style={{ padding:'14px 10px', textAlign:'center' }}>
                <div style={{ color: s.c === SL ? '#818cf8' : s.c === S ? S : R2, fontSize:22, fontWeight:700 }}>{s.v}</div>
                <div style={{ color:'#444', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>

          <NeonCard color={SL} style={{ padding:18, marginBottom:14 }}>
            <SectionTitle color={SL}>REGISTRAR NOITE DE SONO</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label className="label">DATA</label>
                <input type="date" value={sleepForm.date} onChange={e => setSleepForm(s=>({...s,date:e.target.value}))} className="input" style={{ borderColor:'rgba(99,102,241,0.3)', color:'#818cf8' }} />
              </div>
              <div>
                <label className="label">HORAS DORMIDAS</label>
                <input type="number" step="0.5" min="0" max="24" value={sleepForm.hours} onChange={e => setSleepForm(s=>({...s,hours:e.target.value}))} placeholder="ex: 7.5" className="input" style={{ borderColor:'rgba(99,102,241,0.3)', color:'#818cf8' }} />
              </div>
            </div>
            <label className="label">QUALIDADE DO SONO</label>
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {[1,2,3,4,5].map(q => (
                <button key={q} onClick={() => setSleepForm(s=>({...s,quality:q}))}
                  style={{ flex:1, padding:'10px 0', borderRadius:6, border:`1px solid ${sleepForm.quality===q ? SL+'80' : 'rgba(255,255,255,0.08)'}`, background: sleepForm.quality===q ? 'rgba(99,102,241,0.15)' : 'transparent', color: sleepForm.quality===q ? '#818cf8' : '#555', fontFamily:"'Space Mono',monospace", fontSize:10, cursor:'pointer' }}>
                  {QUALITY_LABELS[q]}
                </button>
              ))}
            </div>
            <label className="label">OBSERVAÇÕES</label>
            <input value={sleepForm.note} onChange={e => setSleepForm(s=>({...s,note:e.target.value}))} placeholder="ex: acordei 2x, pesadelo..." className="input" style={{ marginBottom:14, borderColor:'rgba(99,102,241,0.2)' }} />
            <button className="btn" onClick={saveSleep} disabled={savingSleep}
              style={{ width:'100%', background:'rgba(99,102,241,0.15)', borderColor:SL, color:'#818cf8', padding:13, fontSize:13 }}>
              {savingSleep ? 'SALVANDO...' : '🌙 REGISTRAR SONO'}
            </button>
          </NeonCard>

          {sleepData.length > 1 && (
            <NeonCard color={SL} style={{ padding:18, marginBottom:14 }}>
              <SectionTitle color={SL}>HISTÓRICO DE SONO</SectionTitle>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={sleepData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={24} domain={[4,10]} />
                  <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${SL}40`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} />
                  <Line type="monotone" dataKey="horas" stroke="#818cf8" strokeWidth={2} dot={{ r:3, fill:'#818cf8' }} name="Horas" />
                  <Line type="monotone" dataKey={() => 8} stroke="rgba(99,102,241,0.25)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Meta 8h" />
                </LineChart>
              </ResponsiveContainer>
            </NeonCard>
          )}

          {!sleepLoaded ? (
            <div style={{ padding:40, textAlign:'center', color:'#444' }}>Carregando...</div>
          ) : sleepLogs.length === 0 ? (
            <NeonCard color={SL} style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>😴</div>
              <div style={{ color:'#444', fontSize:13 }}>Nenhuma noite registrada ainda.</div>
            </NeonCard>
          ) : (
            <NeonCard color={SL} style={{ padding:18 }}>
              <SectionTitle color={SL}>TODAS AS NOITES</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {sleepLogs.map((e, i) => {
                  const q = e.quality || 3
                  const qColor = q >= 4 ? '#818cf8' : q === 3 ? S : '#64748b'
                  const horasNum = +e.hours
                  const metColor = horasNum >= 8 ? '#818cf8' : horasNum >= 6 ? S : R2
                  return (
                    <div key={i} style={{ padding:'11px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(99,102,241,0.12)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{e.date}</div>
                        {e.note && <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{e.note}</div>}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ color:metColor, fontSize:16, fontWeight:700 }}>{e.hours}h</div>
                        <div style={{ color:qColor, fontSize:10, marginTop:2 }}>{QUALITY_LABELS[q]}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </NeonCard>
          )}
        </>
      )}

      {/* ── COMPOSIÇÃO ───────────────────────────────────────────── */}
      {tab === 'body' && (
        <>
          {/* Form sempre visível */}
          <NeonCard color={R} style={{ padding:20, marginBottom:16 }}>
            <SectionTitle color={R}>NOVA MEDIÇÃO DE BIOIMPEDÂNCIA</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                { k:'date',         l:'DATA',                    t:'date' },
                { k:'body_fat',     l:'GORDURA CORPORAL (%)',    p:'ex: 18.5' },
                { k:'muscle_mass',  l:'MASSA MUSCULAR (%)',      p:'ex: 42.0' },
                { k:'visceral_fat', l:'GORDURA VISCERAL (nível)',p:'ex: 5' },
                { k:'water_pct',    l:'ÁGUA CORPORAL (%)',       p:'ex: 55.0' },
                { k:'bone_mass',    l:'MASSA ÓSSEA (kg)',        p:'ex: 3.2' },
                { k:'bmr',          l:'TMB PELA BALANÇA (kcal)', p:'ex: 1650' },
                { k:'metabolic_age',l:'IDADE METABÓLICA',        p:'ex: 24' },
              ].map(f => (
                <div key={f.k}>
                  <label className="label" style={{ fontSize:10 }}>{f.l}</label>
                  <input type={f.t||'number'} step="0.1" value={bioForm[f.k]}
                    onChange={e=>setBioForm(b=>({...b,[f.k]:e.target.value}))} placeholder={f.p}
                    className="input" style={{ borderColor:'rgba(220,38,38,0.25)', color:'#d0d0d0', padding:'8px 12px', fontSize:14 }} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label className="label" style={{ fontSize:10 }}>OBSERVAÇÕES</label>
                <input value={bioForm.note} onChange={e=>setBioForm(b=>({...b,note:e.target.value}))}
                  placeholder="Notas opcionais..." className="input"
                  style={{ borderColor:'rgba(220,38,38,0.15)', padding:'8px 12px', fontSize:14 }} />
              </div>
            </div>
            <button className="btn" onClick={saveBio}
              style={{ width:'100%', background:'rgba(220,38,38,0.15)', borderColor:R, color:R2, padding:12, fontSize:13 }}>
              💾 SALVAR MEDIÇÃO
            </button>
          </NeonCard>

          {/* Gráfico evolução */}
          {bioChartData.length >= 2 && (
            <NeonCard color={S} style={{ padding:18, marginBottom:14 }}>
              <SectionTitle color={S}>EVOLUÇÃO DA COMPOSIÇÃO CORPORAL</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bioChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:11 }} />
                  <Line type="monotone" dataKey="gordura" stroke="#ff6b6b" strokeWidth={2} dot={{ r:3, fill:'#ff6b6b' }} name="Gordura %" />
                  <Line type="monotone" dataKey="musculo" stroke={R2} strokeWidth={2} dot={{ r:3, fill:R2 }} name="Músculo %" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
                <LegendDot color="#ff6b6b" label="Gordura %" /><LegendDot color={R2} label="Músculo %" />
              </div>
            </NeonCard>
          )}

          {/* Histórico com alertas */}
          {!bioLoaded ? (
            <div style={{ padding:40, textAlign:'center', color:'#444' }}>Carregando...</div>
          ) : bioLog.length === 0 ? (
            <NeonCard color={R} style={{ padding:32, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🧬</div>
              <div style={{ color:'#444', fontSize:13 }}>Nenhuma medição ainda. Preencha o formulário acima.</div>
            </NeonCard>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bioLog.map((e, i) => {
                const alerts = getBioAlerts(e)
                return (
                  <NeonCard key={e.id||i} color={S} style={{ padding:'16px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div style={{ color:'#d0d0d0', fontSize:14, fontWeight:700 }}>{e.date}</div>
                      {i === 0 && <span style={{ background:'rgba(220,38,38,0.15)', color:R, fontSize:8, letterSpacing:2, padding:'3px 8px', borderRadius:3 }}>MAIS RECENTE</span>}
                    </div>

                    {/* Métricas */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom: alerts.length ? 12 : 0 }}>
                      {[
                        { l:'Gordura Corporal', v: e.body_fat,     unit:'%',    c: e.body_fat ? bioFatColor(e.body_fat, user?.sex)   : S },
                        { l:'Massa Muscular',   v: e.muscle_mass,  unit:'%',    c: e.muscle_mass ? bioMuscleColor(e.muscle_mass, user?.sex) : S },
                        { l:'Água Corporal',    v: e.water_pct,    unit:'%',    c: S },
                        { l:'Gordura Visceral', v: e.visceral_fat, unit:'nível',c: e.visceral_fat ? bioVisceralColor(e.visceral_fat) : S },
                        { l:'Massa Óssea',      v: e.bone_mass,    unit:'kg',   c: S },
                        { l:'TMB Balança',      v: e.bmr,          unit:'kcal', c: S },
                        { l:'Idade Metabólica', v: e.metabolic_age,unit:'anos', c: e.metabolic_age && user?.age ? (e.metabolic_age <= user.age ? '#22c55e' : e.metabolic_age <= user.age+5 ? '#eab308' : R2) : S },
                      ].filter(s => s.v).map(s => (
                        <div key={s.l} style={{ padding:'8px 10px', background:`${s.c}0a`, border:`1px solid ${s.c}20`, borderRadius:6 }}>
                          <div style={{ color:'#444', fontSize:9, letterSpacing:1, marginBottom:3 }}>{s.l.toUpperCase()}</div>
                          <div style={{ color:s.c, fontSize:15, fontWeight:700 }}>{s.v}{s.unit}</div>
                        </div>
                      ))}
                    </div>

                    {/* Alertas */}
                    {alerts.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {alerts.map((a, ai) => (
                          <div key={ai} style={{ padding:'8px 12px', borderRadius:6, background:`${a.color}0d`, border:`1px solid ${a.color}25`, display:'flex', gap:8, alignItems:'flex-start' }}>
                            <span style={{ fontSize:14, flexShrink:0 }}>{a.icon}</span>
                            <div>
                              <div style={{ color:a.color, fontSize:10, fontWeight:700, letterSpacing:1 }}>{a.label}</div>
                              <div style={{ color:'#666', fontSize:11, marginTop:2, lineHeight:1.5 }}>{a.msg}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {e.note && <div style={{ color:'#555', fontSize:11, marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>📝 {e.note}</div>}
                  </NeonCard>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:9, height:9, borderRadius:2, background:color }} />
      <span style={{ color:'#666', fontSize:11 }}>{label}</span>
    </div>
  )
}

function calcStreak(entries) {
  const trainDays = new Set(entries.filter(e => e.type==='workout'||e.type==='cardio').map(e=>e.date))
  let streak = 0, d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (!trainDays.has(ds)) break
    streak++
    d.setDate(d.getDate()-1)
  }
  return streak
}

function buildWeeklyData(workoutLogs, cardioLogs) {
  const weeks = {}
  const add = (date, type) => {
    if (!date) return
    const d = new Date(date), day = d.getDay()
    const mon = new Date(d)
    mon.setDate(d.getDate()-(day===0?6:day-1))
    const key = mon.toISOString().split('T')[0].slice(5)
    if (!weeks[key]) weeks[key] = { week:key, treinos:0, cardio:0 }
    if (type==='workout') weeks[key].treinos++; else weeks[key].cardio++
  }
  workoutLogs.forEach(w => add(w.date,'workout'))
  cardioLogs .forEach(c => add(c.date,'cardio'))
  return Object.values(weeks).sort((a,b)=>a.week.localeCompare(b.week)).slice(-8)
}

function buildCardioByType(cardioLogs) {
  const map = {}
  cardioLogs.forEach(c => { const t = c.type||'Outro'; map[t]=(map[t]||0)+1 })
  return Object.entries(map).map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count)
}

// ── Bio alert helpers ─────────────────────────────────────────────────────────
function bioFatColor(fat, sex) {
  fat = +fat
  if (sex === 'female') {
    if (fat < 14) return '#94a3b8'      // abaixo do ideal
    if (fat <= 24) return '#22c55e'     // ótimo
    if (fat <= 31) return '#eab308'     // aceitável
    return '#ef4444'                    // alto
  } else {
    if (fat < 6) return '#94a3b8'
    if (fat <= 17) return '#22c55e'
    if (fat <= 24) return '#eab308'
    return '#ef4444'
  }
}

function bioMuscleColor(muscle, sex) {
  muscle = +muscle
  if (sex === 'female') {
    if (muscle >= 30) return '#22c55e'
    if (muscle >= 24) return '#eab308'
    return '#ef4444'
  } else {
    if (muscle >= 40) return '#22c55e'
    if (muscle >= 33) return '#eab308'
    return '#ef4444'
  }
}

function bioVisceralColor(v) {
  v = +v
  if (v <= 9)  return '#22c55e'
  if (v <= 14) return '#eab308'
  return '#ef4444'
}

function getBioAlerts(e) {
  const alerts = []
  const R2 = '#ef4444'
  const Y  = '#eab308'
  const G  = '#22c55e'

  if (e.body_fat) {
    const f = +e.body_fat
    if (f > 30) alerts.push({ icon:'🔴', color:R2, label:'GORDURA ALTA', msg:`${f}% de gordura corporal está acima do recomendado. Considere déficit calórico e aumentar cardio.` })
    else if (f > 24) alerts.push({ icon:'🟡', color:Y, label:'GORDURA MODERADA', msg:`${f}% está na faixa aceitável, mas pode melhorar com treino consistente.` })
    else if (f < 6) alerts.push({ icon:'⚠️', color:Y, label:'GORDURA MUITO BAIXA', msg:`${f}% pode indicar desnutrição ou excesso de treino. Avalie com um profissional.` })
    else alerts.push({ icon:'✅', color:G, label:'GORDURA CORPORAL OK', msg:`${f}% está dentro da faixa saudável. Continue assim!` })
  }

  if (e.visceral_fat) {
    const v = +e.visceral_fat
    if (v >= 15) alerts.push({ icon:'🔴', color:R2, label:'GORDURA VISCERAL MUITO ALTA', msg:`Nível ${v} é considerado alto risco. Associado a doenças cardiovasculares e diabetes.` })
    else if (v >= 10) alerts.push({ icon:'🟡', color:Y, label:'GORDURA VISCERAL ELEVADA', msg:`Nível ${v}. Monitore de perto e priorize exercícios aeróbicos.` })
    else alerts.push({ icon:'✅', color:G, label:'GORDURA VISCERAL OK', msg:`Nível ${v} dentro da faixa normal (abaixo de 10).` })
  }

  if (e.muscle_mass) {
    const m = +e.muscle_mass
    if (m < 30) alerts.push({ icon:'🟡', color:Y, label:'MASSA MUSCULAR BAIXA', msg:`${m}% indica baixa massa muscular. Priorize treino de força e consumo adequado de proteína.` })
    else alerts.push({ icon:'✅', color:G, label:'MASSA MUSCULAR BOA', msg:`${m}% está em boa faixa. Mantenha o treino de força.` })
  }

  if (e.metabolic_age && e.user_age) {
    const diff = e.metabolic_age - e.user_age
    if (diff > 5) alerts.push({ icon:'🔴', color:R2, label:'IDADE METABÓLICA ACIMA DA REAL', msg:`Seu metabolismo está ${diff} anos mais velho. Exercícios e dieta podem reverter isso.` })
    else if (diff > 0) alerts.push({ icon:'🟡', color:Y, label:'IDADE METABÓLICA LEVEMENTE ACIMA', msg:`Diferença de ${diff} anos. Com treino consistente você melhora esse número.` })
    else alerts.push({ icon:'✅', color:G, label:'IDADE METABÓLICA BOA', msg:`Seu metabolismo está jovem! Continue com o estilo de vida ativo.` })
  }

  return alerts
}
