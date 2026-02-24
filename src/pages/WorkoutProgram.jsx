import { useState } from 'react'
import { PROGRAMS } from '../data/workouts'
import { NeonCard, SectionTitle, Tag, Modal } from '../components/UI'
import { saveWorkoutLog, getWorkoutLogs, addCalendarEntry, today } from '../lib/storage'
import { FUN_FACTS } from '../data/funfacts'

const SET_TYPES = ['Normal','Dropset','Rest-pause','Cluster','Myo-reps','Pausa','Excêntrico','Forçada','Pirâmide']

function ExerciseLogger({ ex, dayColor, onChange, data }) {
  const sets = data?.sets || []

  function addSet() {
    onChange({ ...data, sets: [...sets, { reps: '', weight: '', type: 'Normal', note: '' }] })
  }
  function updateSet(i, patch) {
    const next = sets.map((s, idx) => idx === i ? { ...s, ...patch } : s)
    onChange({ ...data, sets: next })
  }
  function removeSet(i) {
    onChange({ ...data, sets: sets.filter((_,idx)=>idx!==i) })
  }

  return (
    <div>
      {sets.map((s, i) => (
        <div key={i} style={{ display:'flex', gap:6, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
          <div style={{ color: dayColor, fontSize:10, minWidth:24, textAlign:'center', fontFamily:'monospace' }}>{i+1}</div>
          <input value={s.reps} onChange={e=>updateSet(i,{reps:e.target.value})} placeholder="Reps" className="input" style={{ width:64, padding:'6px 8px', fontSize:12, borderColor:`${dayColor}25`, color:dayColor }} />
          <input value={s.weight} onChange={e=>updateSet(i,{weight:e.target.value})} placeholder="kg" className="input" style={{ width:64, padding:'6px 8px', fontSize:12, borderColor:`${dayColor}25`, color:dayColor }} />
          <select value={s.type} onChange={e=>updateSet(i,{type:e.target.value})} className="select" style={{ flex:1, minWidth:100, padding:'6px 8px', fontSize:11, borderColor:`${dayColor}20`, color:dayColor, background:'#0a0a0c' }}>
            {SET_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input value={s.note} onChange={e=>updateSet(i,{note:e.target.value})} placeholder="nota" className="input" style={{ flex:1, minWidth:80, padding:'6px 8px', fontSize:11, borderColor:`${dayColor}15`, color:'#888' }} />
          <button onClick={()=>removeSet(i)} style={{ background:'none', border:'none', color:'#ff6b6b', cursor:'pointer', fontSize:14, padding:'0 4px' }}>✕</button>
        </div>
      ))}
      <button onClick={addSet} style={{ background:'none', border:`1px dashed ${dayColor}30`, color:dayColor, fontFamily:'monospace', fontSize:10, letterSpacing:2, padding:'6px 14px', borderRadius:4, cursor:'pointer', width:'100%', marginTop:4 }}>
        + SÉRIE
      </button>
    </div>
  )
}

export default function WorkoutProgram({ user }) {
  const programKey = user.program || 'upperLower5'
  const program = PROGRAMS[programKey]
  const [selectedDay, setSelectedDay] = useState(0)
  const [completed, setCompleted] = useState({})
  const [logData, setLogData] = useState({}) // { 'dayId-exIdx': { sets:[...] } }
  const [logModal, setLogModal] = useState(false)
  const [factIdx, setFactIdx] = useState(0)
  const [saved, setSaved] = useState(false)

  const day = program.days[selectedDay]
  const fact = FUN_FACTS.filter(f=>f.category==='Treino')[factIdx % FUN_FACTS.filter(f=>f.category==='Treino').length]

  function toggleEx(key) {
    setCompleted(c => ({ ...c, [key]: !c[key] }))
  }

  const dayCompletedCount = day.exercises.filter((_,i) => completed[`${day.id}-${i}`]).length
  const allDone = dayCompletedCount === day.exercises.length && day.exercises.length > 0

  function finishWorkout() {
    const logEntry = {
      id: `${user.id}_${today()}_${day.id}`,
      date: today(),
      dayId: day.id,
      dayName: day.name,
      programName: program.name,
      exercises: day.exercises.map((ex, i) => ({
        name: ex.name,
        completed: !!completed[`${day.id}-${i}`],
        sets: logData[`${day.id}-${i}`]?.sets || [],
      })),
      completed: allDone,
    }
    saveWorkoutLog(user.id, logEntry)
    addCalendarEntry(user.id, { date: today(), type: 'workout', label: day.name, note: `${dayCompletedCount}/${day.exercises.length} exercícios` })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <div style={{ color:'#00ff88', fontSize:22, letterSpacing:4, fontWeight:700 }}>PROGRAMA DE TREINO</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>{program.name.toUpperCase()} · {program.frequency.toUpperCase()}</div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#00d4ff', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 FATO · clique para próximo</div>
          <div style={{ color:'#888', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {program.days.map((d,i) => {
          const active = i === selectedDay
          return (
            <button key={d.id} onClick={() => { setSelectedDay(i); setCompleted({}); setLogData({}) }}
              style={{ padding:'8px 14px', borderRadius:6, border:`1px solid ${active?d.color+'60':'#ffffff10'}`, background:active?`${d.color}12`:'rgba(255,255,255,0.02)', color:active?d.color:'#555', fontFamily:'monospace', fontSize:10, letterSpacing:1.5, cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase' }}>
              <span style={{ fontSize:9, display:'block', color:active?d.color:'#333', marginBottom:2 }}>DIA {i+1}</span>
              {d.tag}
            </button>
          )
        })}
      </div>

      {/* Day header */}
      <NeonCard color={day.color} style={{ padding:'18px 22px', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <Tag color={day.color}>{day.tag}</Tag>
            </div>
            <div style={{ color:'#e0e0e0', fontSize:16, fontWeight:700, marginBottom:4 }}>{day.name}</div>
            <div style={{ color:'#666', fontSize:11 }}>Foco em {day.focus}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:day.color, fontSize:22, fontWeight:700 }}>{dayCompletedCount}/{day.exercises.length}</div>
            <div style={{ color:'#444', fontSize:9, letterSpacing:1 }}>CONCLUÍDOS</div>
          </div>
        </div>
        <div style={{ marginTop:12, padding:'8px 12px', borderRadius:6, background:`${day.color}06`, borderLeft:`2px solid ${day.color}30` }}>
          <span style={{ color:'#555', fontSize:10 }}>📋 </span>
          <span style={{ color:'#777', fontSize:11 }}>{day.rationale}</span>
        </div>
      </NeonCard>

      {/* Exercises */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {day.exercises.map((ex, i) => {
          const key = `${day.id}-${i}`
          const done = !!completed[key]
          return (
            <NeonCard key={i} color={day.color} style={{ padding:'16px 18px', opacity: done?0.65:1, borderColor: done?`${day.color}35`:`${day.color}12`, background: done?`${day.color}05`:'rgba(0,0,0,0.6)' }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                {/* Checkbox */}
                <div onClick={() => toggleEx(key)} style={{ width:22, height:22, borderRadius:4, flexShrink:0, border:`1.5px solid ${done?day.color:'#333'}`, background:done?`${day.color}22`:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:day.color, fontSize:12, marginTop:3, cursor:'pointer', transition:'all 0.2s' }}>
                  {done && '✓'}
                </div>

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ color:done?'#555':'#e0e0e0', fontSize:14, fontWeight:700, textDecoration:done?'line-through':'none' }}>{ex.name}</span>
                    {ex.optional && <Tag color="#555">OPCIONAL</Tag>}
                    <Tag color={day.color}>{ex.muscle}</Tag>
                  </div>
                  <div style={{ color:'#666', fontSize:11, marginBottom:10, lineHeight:1.5 }}>{ex.note}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                    {[
                      { l:'SÉRIES', v:ex.sets }, { l:'REPS', v:ex.reps },
                      { l:'DESCANSO', v:ex.rest }, { l:'RIR', v:ex.rir }, { l:'EQUIP.', v:ex.equipment },
                    ].map(info => (
                      <div key={info.label} style={{ padding:'3px 8px', borderRadius:4, background:`${day.color}07`, border:`1px solid ${day.color}12` }}>
                        <div style={{ color:'#333', fontSize:7, letterSpacing:1.5 }}>{info.l}</div>
                        <div style={{ color:day.color, fontSize:10, fontWeight:700, marginTop:1 }}>{info.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Series logger */}
                  <div style={{ borderTop:`1px solid ${day.color}10`, paddingTop:10 }}>
                    <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginBottom:8 }}>REGISTRAR SÉRIES REALIZADAS</div>
                    <ExerciseLogger ex={ex} dayColor={day.color}
                      data={logData[key]}
                      onChange={d => setLogData(prev => ({ ...prev, [key]: d }))} />
                  </div>
                </div>

                <div style={{ width:26, height:26, borderRadius:'50%', background:`${day.color}10`, border:`1px solid ${day.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:day.color, fontSize:11, fontWeight:700, flexShrink:0 }}>
                  {i+1}
                </div>
              </div>
            </NeonCard>
          )
        })}
      </div>

      {/* Finish button */}
      <div style={{ marginTop:20, display:'flex', justifyContent:'center' }}>
        <button onClick={finishWorkout} className="btn" style={{ padding:'12px 40px', fontSize:12, background: allDone?'rgba(0,255,136,0.2)':'rgba(0,255,136,0.06)', borderColor: allDone?'#00ff88':'rgba(0,255,136,0.3)', boxShadow: allDone?'0 0 20px rgba(0,255,136,0.2)':'none' }}>
          {saved ? '✓ TREINO SALVO!' : allDone ? '✓ FINALIZAR & SALVAR TREINO' : '💾 SALVAR PROGRESSO'}
        </button>
      </div>

      {allDone && (
        <div className="animate-fade" style={{ marginTop:14, padding:'14px 22px', borderRadius:8, background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.25)', textAlign:'center', boxShadow:'0 0 24px rgba(0,255,136,0.08)' }}>
          <div style={{ color:'#00ff88', fontSize:15, fontWeight:700, marginBottom:3 }}>✓ TREINO CONCLUÍDO</div>
          <div style={{ color:'#555', fontSize:11 }}>Salvo automaticamente no calendário. Descanse, hidrate-se e alimente-se bem!</div>
        </div>
      )}
    </div>
  )
}
