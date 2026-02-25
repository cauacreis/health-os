import { useState, useEffect } from 'react'
import { getCalendar, addCalendarEntry, removeCalendarEntry, getWorkoutLogs, getCardioLog, getFoodLog, getSleepLog } from '../lib/db'
import { NeonCard, SectionTitle, Modal } from '../components/UI'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAY_NAMES   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const R  = '#dc2626'
const R2 = '#ef4444'
const S  = '#94a3b8'

const TYPE_CFG = {
  workout: { label:'Treino',   color: R,  icon:'💪' },
  cardio:  { label:'Cardio',   color: S,  icon:'🏃' },
  rest:    { label:'Descanso', color:'#64748b', icon:'😴' },
}

export default function CalendarPage({ user, userId }) {
  const now = new Date()
  const [tab,    setTab]    = useState('calendar')  // calendar | history
  const [year,   setYear]   = useState(now.getFullYear())
  const [month,  setMonth]  = useState(now.getMonth())
  const [entries,setEntries]= useState([])
  const [selected, setSelected] = useState(null)
  const [modal, setModal]   = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addType,  setAddType]  = useState('workout')

  // History state
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [cardioLogs,  setCardioLogs]  = useState([])
  const [sleepLogs,   setSleepLogs]   = useState([])
  const [histLoaded,  setHistLoaded]  = useState(false)

  useEffect(() => {
    getCalendar(userId).then(setEntries).catch(() => {})
  }, [userId])

  useEffect(() => {
    if (tab === 'history' && !histLoaded) {
      Promise.all([
        getWorkoutLogs(userId, 60),
        getCardioLog(userId, 60),
        getSleepLog(userId, 30),
      ]).then(([w, c, s]) => {
        setWorkoutLogs(w)
        setCardioLogs(c)
        setSleepLogs(s)
        setHistLoaded(true)
      }).catch(() => setHistLoaded(true))
    }
  }, [tab, histLoaded, userId])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }
  function getDayEntries(day) {
    const ds = dateStr(day)
    return entries.filter(e => e.date === ds)
  }
  function handleDayClick(day) { setSelected(day); setModal(true); setNoteText(''); setAddType('workout') }

  async function handleAdd() {
    const ds = dateStr(selected)
    await addCalendarEntry(userId, { date: ds, type: addType, note: noteText, label: TYPE_CFG[addType].label })
    const fresh = await getCalendar(userId)
    setEntries(fresh)
    setNoteText('')
  }

  async function handleRemove(date, type) {
    await removeCalendarEntry(userId, date, type)
    const fresh = await getCalendar(userId)
    setEntries(fresh)
    setModal(false)
    setTimeout(() => setModal(true), 50)
  }

  const todayStr    = new Date().toISOString().split('T')[0]
  const thisMonth   = entries.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
  const streak      = calcStreak(entries)

  // ── History data processing ──────────────────────────────────────────────
  // Last 8 weeks of workout frequency
  const weeklyData = buildWeeklyData(workoutLogs, cardioLogs)
  // Cardio volume by type
  const cardioByType = buildCardioByType(cardioLogs)
  // Sleep trend (last 14 days)
  const sleepData = sleepLogs.slice(0, 14).reverse().map(e => ({
    date: e.date?.slice(5),
    horas: +e.hours,
    qualidade: e.quality,
  }))

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: R, fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>CALENDÁRIO</div>
        <div style={{ color: '#555', fontSize: 12, letterSpacing: 2, marginTop: 4 }}>HISTÓRICO & DESEMPENHO</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id:'calendar', label:'📅 Calendário' },
          { id:'history',  label:'📊 Desempenho' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn"
            style={{ flex: 1, padding: '12px 0', fontSize: 13, background: tab === t.id ? 'rgba(220,38,38,0.15)' : 'transparent', borderColor: tab === t.id ? R : 'rgba(255,255,255,0.08)', color: tab === t.id ? R2 : '#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CALENDAR ─────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { l:'Treinos',  v: thisMonth.filter(e=>e.type==='workout').length, c: R },
              { l:'Cardios',  v: thisMonth.filter(e=>e.type==='cardio').length,  c: S },
              { l:'Descanso', v: thisMonth.filter(e=>e.type==='rest').length,    c:'#64748b' },
              { l:'Sequência',v: `${streak}d`,                                   c: R },
            ].map(s => (
              <NeonCard key={s.l} color={s.c} style={{ padding: '14px 10px', textAlign:'center' }}>
                <div style={{ color: s.c, fontSize: 24, fontWeight: 700 }}>{s.v}</div>
                <div style={{ color: '#444', fontSize: 10, letterSpacing: 1.5, marginTop: 4, textTransform:'uppercase' }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>

          {/* Calendar grid */}
          <NeonCard color={R} style={{ padding: 20 }}>
            {/* Navigation */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
              <button onClick={() => { if (month===0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1) }}
                style={{ background:'none', border:`1px solid rgba(220,38,38,0.2)`, borderRadius:6, color:R2, cursor:'pointer', fontSize:20, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
              <div style={{ color:'#d0d0d0', fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform:'uppercase' }}>
                {MONTH_NAMES[month]} {year}
              </div>
              <button onClick={() => { if (month===11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1) }}
                style={{ background:'none', border:`1px solid rgba(220,38,38,0.2)`, borderRadius:6, color:R2, cursor:'pointer', fontSize:20, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign:'center', color:'#444', fontSize:11, letterSpacing:1, padding:'4px 0', fontWeight:700 }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`e${i}`} />
                const ds = dateStr(day)
                const dayEnt = getDayEntries(day)
                const isToday = ds === todayStr
                return (
                  <div key={day} onClick={() => handleDayClick(day)}
                    style={{ aspectRatio:'1', borderRadius:8, cursor:'pointer', border:`1px solid ${isToday ? R+'60' : 'rgba(255,255,255,0.05)'}`, background: isToday ? 'rgba(220,38,38,0.1)' : dayEnt.length ? 'rgba(220,38,38,0.05)' : 'rgba(255,255,255,0.01)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:3, transition:'all 0.15s', WebkitTapHighlightColor:'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(220,38,38,0.1)' : dayEnt.length ? 'rgba(220,38,38,0.05)' : 'rgba(255,255,255,0.01)'}>
                    <div style={{ fontSize:13, color: isToday ? R : '#999', fontWeight: isToday ? 700 : 400 }}>{day}</div>
                    <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                      {dayEnt.map(e => (
                        <div key={e.type} style={{ width:6, height:6, borderRadius:'50%', background: TYPE_CFG[e.type]?.color || '#555' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:16, marginTop:16, justifyContent:'center', flexWrap:'wrap' }}>
              {Object.entries(TYPE_CFG).map(([k,v]) => (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:v.color }} />
                  <span style={{ color:'#555', fontSize:12 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </NeonCard>

          {/* Day modal */}
          {modal && selected && (
            <Modal title={`${String(selected).padStart(2,'0')} DE ${MONTH_NAMES[month].toUpperCase()}`} color={R} onClose={() => setModal(false)}>
              {getDayEntries(selected).length > 0 && (
                <div style={{ marginBottom:18 }}>
                  <div style={{ color:'#444', fontSize:11, letterSpacing:2, marginBottom:10 }}>REGISTRADO</div>
                  {getDayEntries(selected).map(e => (
                    <div key={e.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderRadius:8, background:`${TYPE_CFG[e.type].color}10`, border:`1px solid ${TYPE_CFG[e.type].color}20`, marginBottom:8 }}>
                      <div>
                        <span style={{ fontSize:18, marginRight:8 }}>{TYPE_CFG[e.type].icon}</span>
                        <span style={{ color:TYPE_CFG[e.type].color, fontSize:14, fontWeight:700 }}>{TYPE_CFG[e.type].label}</span>
                        {e.note && <div style={{ color:'#555', fontSize:12, marginTop:3 }}>{e.note}</div>}
                      </div>
                      <button onClick={() => handleRemove(dateStr(selected), e.type)} style={{ background:'none', border:'none', color:R2, cursor:'pointer', fontSize:16, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ color:'#444', fontSize:11, letterSpacing:2, marginBottom:12 }}>ADICIONAR ATIVIDADE</div>
              <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                {Object.entries(TYPE_CFG).map(([k,v]) => (
                  <button key={k} onClick={() => setAddType(k)} className="btn"
                    style={{ flex:1, borderColor: addType===k ? v.color+'80' : undefined, color: addType===k ? v.color : undefined, background: addType===k ? `${v.color}15` : undefined, padding:'10px 0', fontSize:13 }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Observações (opcional)..."
                className="input" style={{ height:72, resize:'vertical', marginBottom:14, fontSize:14 }} />
              <button className="btn" onClick={handleAdd} style={{ width:'100%', background:'rgba(220,38,38,0.15)', borderColor:R, color:R2, padding:14, fontSize:14 }}>
                SALVAR
              </button>
            </Modal>
          )}
        </>
      )}

      {/* ── TAB: HISTORY / DESEMPENHO ─────────────────────────────── */}
      {tab === 'history' && (
        <>
          {!histLoaded ? (
            <div style={{ padding:40, textAlign:'center', color:'#444' }}>Carregando dados...</div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
                <NeonCard color={R} style={{ padding:'18px 14px', textAlign:'center' }}>
                  <div style={{ color:R2, fontSize:28, fontWeight:700 }}>{workoutLogs.length}</div>
                  <div style={{ color:'#555', fontSize:11, marginTop:5, textTransform:'uppercase', letterSpacing:1 }}>Treinos totais</div>
                </NeonCard>
                <NeonCard color={S} style={{ padding:'18px 14px', textAlign:'center' }}>
                  <div style={{ color:S, fontSize:28, fontWeight:700 }}>{cardioLogs.length}</div>
                  <div style={{ color:'#555', fontSize:11, marginTop:5, textTransform:'uppercase', letterSpacing:1 }}>Sessões cardio</div>
                </NeonCard>
                <NeonCard color={R} style={{ padding:'18px 14px', textAlign:'center' }}>
                  <div style={{ color:R2, fontSize:28, fontWeight:700 }}>{streak}</div>
                  <div style={{ color:'#555', fontSize:11, marginTop:5, textTransform:'uppercase', letterSpacing:1 }}>Dias seguidos</div>
                </NeonCard>
              </div>

              {/* Weekly workout frequency chart */}
              {weeklyData.length > 0 && (
                <NeonCard color={R} style={{ padding:20, marginBottom:16 }}>
                  <SectionTitle color={R}>TREINOS POR SEMANA</SectionTitle>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyData} barGap={4}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill:'#555', fontSize:10, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'#555', fontSize:10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                      <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:12 }} />
                      <Bar dataKey="treinos" fill={R} opacity={0.85} radius={[4,4,0,0]} name="Treinos" />
                      <Bar dataKey="cardio"  fill={S} opacity={0.7}  radius={[4,4,0,0]} name="Cardio" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
                    <LegendDot color={R} label="Treinos" />
                    <LegendDot color={S} label="Cardio" />
                  </div>
                </NeonCard>
              )}

              {/* Sleep chart */}
              {sleepData.length > 1 && (
                <NeonCard color={R} style={{ padding:20, marginBottom:16 }}>
                  <SectionTitle color={R}>HORAS DE SONO (ÚLTIMOS 14 DIAS)</SectionTitle>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={sleepData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill:'#555', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'#555', fontSize:10 }} axisLine={false} tickLine={false} width={24} domain={[4,10]} />
                      <Tooltip contentStyle={{ background:'#0d0d10', border:`1px solid ${R}25`, borderRadius:6, fontFamily:"'Space Mono',monospace", fontSize:12 }} />
                      <Line type="monotone" dataKey="horas" stroke={R2} strokeWidth={2} dot={{ r:4, fill:R2 }} name="Horas" />
                      {/* Reference line 8h */}
                      <Line type="monotone" dataKey={() => 8} stroke="rgba(220,38,38,0.2)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Ideal (8h)" />
                    </LineChart>
                  </ResponsiveContainer>
                </NeonCard>
              )}

              {/* Cardio by type */}
              {cardioByType.length > 0 && (
                <NeonCard color={R} style={{ padding:20, marginBottom:16 }}>
                  <SectionTitle color={R}>CARDIO POR TIPO</SectionTitle>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {cardioByType.map(ct => (
                      <div key={ct.type} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ color:'#999', fontSize:13, minWidth:90 }}>{ct.type}</div>
                        <div style={{ flex:1, height:8, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${(ct.count / cardioByType[0].count) * 100}%`, background:R, borderRadius:4, transition:'width 0.5s ease' }} />
                        </div>
                        <div style={{ color:R2, fontSize:13, fontWeight:700, minWidth:20, textAlign:'right' }}>{ct.count}x</div>
                      </div>
                    ))}
                  </div>
                </NeonCard>
              )}

              {/* Recent workout log */}
              {workoutLogs.length > 0 && (
                <NeonCard color={R} style={{ padding:20 }}>
                  <SectionTitle color={R}>ÚLTIMOS TREINOS</SectionTitle>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {workoutLogs.slice(0, 8).map((w, i) => (
                      <div key={i} style={{ padding:'12px 16px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(220,38,38,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ color:'#d0d0d0', fontSize:14, fontWeight:700 }}>{w.day_name || 'Treino'}</div>
                          <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{w.date} · {w.program_name || ''}</div>
                        </div>
                        <div style={{ color:w.completed ? R2 : '#333', fontSize:12, fontWeight:700 }}>
                          {w.completed ? '✓ Concluído' : '○ Parcial'}
                        </div>
                      </div>
                    ))}
                  </div>
                </NeonCard>
              )}

              {workoutLogs.length === 0 && cardioLogs.length === 0 && sleepLogs.length === 0 && (
                <NeonCard color={R} style={{ padding:40, textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
                  <div style={{ color:'#444', fontSize:14, lineHeight:1.8 }}>
                    Nenhum dado ainda.<br/>
                    Complete treinos, registre cardio e sono<br/>
                    para ver seu desempenho aqui.
                  </div>
                </NeonCard>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:10, height:10, borderRadius:2, background:color }} />
      <span style={{ color:'#666', fontSize:11 }}>{label}</span>
    </div>
  )
}

function calcStreak(entries) {
  const trainDays = new Set(
    entries.filter(e => e.type === 'workout' || e.type === 'cardio').map(e => e.date)
  )
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (!trainDays.has(ds)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function buildWeeklyData(workoutLogs, cardioLogs) {
  const weeks = {}
  const addEntry = (date, type) => {
    if (!date) return
    const d   = new Date(date)
    const day = d.getDay()
    const mon = new Date(d)
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const key = mon.toISOString().split('T')[0].slice(5)  // MM-DD
    if (!weeks[key]) weeks[key] = { week: key, treinos: 0, cardio: 0 }
    if (type === 'workout') weeks[key].treinos++
    else weeks[key].cardio++
  }
  workoutLogs.forEach(w => addEntry(w.date, 'workout'))
  cardioLogs .forEach(c => addEntry(c.date, 'cardio'))
  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)).slice(-8)
}

function buildCardioByType(cardioLogs) {
  const map = {}
  cardioLogs.forEach(c => {
    const t = c.type || 'Outro'
    map[t] = (map[t] || 0) + 1
  })
  return Object.entries(map).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
}
