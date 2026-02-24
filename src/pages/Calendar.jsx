import { useState } from 'react'
import { getCalendar, addCalendarEntry, removeCalendarEntry } from '../lib/storage'
import { NeonCard, SectionTitle, Modal } from '../components/UI'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TYPE_CFG = {
  workout: { label: 'Treino', color: '#00ff88', icon: '💪' },
  cardio:  { label: 'Cardio', color: '#ff6b6b', icon: '🏃' },
  rest:    { label: 'Descanso', color: '#4ecdc4', icon: '😴' },
}

export default function CalendarPage({ user }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [entries, setEntries] = useState(() => getCalendar(user.id))
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addType, setAddType] = useState('workout')

  function refresh() { setEntries(getCalendar(user.id)) }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function getEntries(day) {
    const ds = dateStr(day)
    return entries.filter(e => e.date === ds)
  }

  function handleDayClick(day) {
    setSelected(day)
    setModal(true)
    setNoteText('')
    setAddType('workout')
  }

  function handleAdd() {
    const ds = dateStr(selected)
    addCalendarEntry(user.id, { date: ds, type: addType, note: noteText, label: TYPE_CFG[addType].label })
    refresh()
    setNoteText('')
  }

  function handleRemove(date, type) {
    removeCalendarEntry(user.id, date, type)
    refresh()
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Stats
  const workoutCount = entries.filter(e => e.type === 'workout').length
  const cardioCount  = entries.filter(e => e.type === 'cardio').length
  const thisMonth    = entries.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#00ff88', fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>CALENDÁRIO</div>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>HISTÓRICO DE TREINOS E CARDIO</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Treinos este mês', v: thisMonth.filter(e=>e.type==='workout').length, c: '#00ff88', icon: '💪' },
          { l: 'Cardios este mês',  v: thisMonth.filter(e=>e.type==='cardio').length,  c: '#ff6b6b', icon: '🏃' },
          { l: 'Descanso este mês', v: thisMonth.filter(e=>e.type==='rest').length,    c: '#4ecdc4', icon: '😴' },
        ].map(s => (
          <NeonCard key={s.l} color={s.c} style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ color: s.c, fontSize: 26, fontWeight: 700 }}>{s.v}</div>
            <div style={{ color: '#444', fontSize: 9, letterSpacing: 2, marginTop: 4 }}>{s.l.toUpperCase()}</div>
          </NeonCard>
        ))}
      </div>

      {/* Calendar */}
      <NeonCard color="#00ff88" style={{ padding: 24 }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1) }}
            style={{ background:'none', border:'none', color:'#00ff88', cursor:'pointer', fontSize:20, padding:'0 8px' }}>‹</button>
          <div style={{ color: '#e0e0e0', fontSize: 14, letterSpacing: 3, fontFamily: 'monospace', textTransform: 'uppercase' }}>
            {MONTH_NAMES[month]} {year}
          </div>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1) }}
            style={{ background:'none', border:'none', color:'#00ff88', cursor:'pointer', fontSize:20, padding:'0 8px' }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', color: '#444', fontSize: 9, letterSpacing: 2, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const ds = dateStr(day)
            const dayEntries = getEntries(day)
            const isToday = ds === todayStr
            return (
              <div key={day} onClick={() => handleDayClick(day)}
                style={{
                  aspectRatio: '1', borderRadius: 6, cursor: 'pointer',
                  border: isToday ? '1px solid #00ff8860' : '1px solid #ffffff08',
                  background: isToday ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', gap: 2, padding: 2, position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)'}
              >
                <div style={{ fontSize: 11, color: isToday ? '#00ff88' : '#aaa', fontFamily: 'monospace', fontWeight: isToday ? 700 : 400 }}>{day}</div>
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayEntries.map(e => (
                    <div key={e.type} style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_CFG[e.type]?.color || '#555', boxShadow: `0 0 4px ${TYPE_CFG[e.type]?.color || '#555'}` }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, boxShadow: `0 0 6px ${v.color}` }} />
              <span style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>{v.label}</span>
            </div>
          ))}
        </div>
      </NeonCard>

      {/* Day modal */}
      {modal && selected && (
        <Modal title={`${String(selected).padStart(2,'0')} de ${MONTH_NAMES[month]}`} color="#00ff88" onClose={() => setModal(false)}>
          {/* Existing entries */}
          {getEntries(selected).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color:'#444', fontSize:10, letterSpacing:2, marginBottom:8 }}>REGISTRADO</div>
              {getEntries(selected).map(e => (
                <div key={e.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:6, background:`${TYPE_CFG[e.type].color}10`, border:`1px solid ${TYPE_CFG[e.type].color}20`, marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:16, marginRight:8 }}>{TYPE_CFG[e.type].icon}</span>
                    <span style={{ color: TYPE_CFG[e.type].color, fontSize:12 }}>{TYPE_CFG[e.type].label}</span>
                    {e.note && <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{e.note}</div>}
                  </div>
                  <button onClick={() => { handleRemove(dateStr(selected), e.type); setModal(false); setTimeout(() => setModal(true), 50) }}
                    style={{ background:'none', border:'none', color:'#ff6b6b', cursor:'pointer', fontSize:14 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          <div style={{ color:'#444', fontSize:10, letterSpacing:2, marginBottom:10 }}>ADICIONAR ATIVIDADE</div>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {Object.entries(TYPE_CFG).map(([k,v]) => (
              <button key={k} onClick={() => setAddType(k)}
                className="btn" style={{ flex:1, borderColor: addType===k ? `${v.color}80` : undefined, color: addType===k ? v.color : undefined, background: addType===k ? `${v.color}12` : undefined, padding:'8px 0' }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Observações (opcional)..."
            className="input" style={{ height:70, resize:'vertical', marginBottom:12 }} />
          <button className="btn" onClick={handleAdd} style={{ width:'100%', background:'rgba(0,255,136,0.15)', borderColor:'#00ff88' }}>
            SALVAR
          </button>
        </Modal>
      )}
    </div>
  )
}
