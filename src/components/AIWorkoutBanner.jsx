import { useState, useEffect } from 'react'

const R  = '#dc2626'
const R2 = '#ef4444'

function loadAIWorkouts() {
  try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] }
}

export default function AIWorkoutBanner({ userId }) {
  const [workouts, setWorkouts] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [logs, setLogs]         = useState({}) // { [exIdx]: { series: '', reps: '', kg: '' } }

  useEffect(() => {
    setWorkouts(loadAIWorkouts())

    // Escuta treinos novos gerados no chat
    const handler = e => {
      setWorkouts(prev => {
        const updated = [e.detail, ...prev].slice(0, 10)
        return updated
      })
      setExpanded(e.detail.id)
    }
    window.addEventListener('ai-workout-ready', handler)
    return () => window.removeEventListener('ai-workout-ready', handler)
  }, [])

  function removeWorkout(id) {
    const updated = workouts.filter(w => w.id !== id)
    localStorage.setItem('healthos_ai_workouts', JSON.stringify(updated))
    setWorkouts(updated)
    if (expanded === id) setExpanded(null)
  }

  function updateLog(workoutId, exIdx, field, value) {
    setLogs(prev => ({
      ...prev,
      [`${workoutId}_${exIdx}`]: {
        ...(prev[`${workoutId}_${exIdx}`] || {}),
        [field]: value,
      },
    }))
  }

  if (workouts.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: R, fontSize: 11, letterSpacing: 3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        🤖 TREINOS GERADOS PELA IA
        <span style={{ color: '#333', fontSize: 9 }}>({workouts.length})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {workouts.map(workout => (
          <div key={workout.id} style={{ background: 'rgba(220,38,38,0.04)', border: `1px solid ${expanded === workout.id ? 'rgba(220,38,38,0.25)' : 'rgba(220,38,38,0.1)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border 0.2s' }}>

            {/* Header do treino */}
            <div onClick={() => setExpanded(expanded === workout.id ? null : workout.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}>
              <div>
                <div style={{ color: '#d0d0d0', fontSize: 13, fontWeight: 700 }}>{workout.nome}</div>
                <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{workout.foco} · {workout.duracao} · {workout.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#444', fontSize: 14 }}>{expanded === workout.id ? '▲' : '▼'}</span>
                <button onClick={e => { e.stopPropagation(); removeWorkout(workout.id) }}
                  style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
                  onMouseEnter={e => e.currentTarget.style.color = R2}
                  onMouseLeave={e => e.currentTarget.style.color = '#333'}>✕</button>
              </div>
            </div>

            {/* Exercícios expandidos com inputs */}
            {expanded === workout.id && (
              <div style={{ borderTop: '1px solid rgba(220,38,38,0.1)', padding: '12px 16px' }}>
                <div style={{ color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>PREENCHA COM SEU DESEMPENHO</div>

                {/* Header da tabela */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px', gap: 6, marginBottom: 6 }}>
                  <div style={{ color: '#333', fontSize: 9, letterSpacing: 1 }}>EXERCÍCIO</div>
                  <div style={{ color: '#333', fontSize: 9, letterSpacing: 1, textAlign: 'center' }}>SÉRIES</div>
                  <div style={{ color: '#333', fontSize: 9, letterSpacing: 1, textAlign: 'center' }}>REPS</div>
                  <div style={{ color: '#333', fontSize: 9, letterSpacing: 1, textAlign: 'center' }}>KG</div>
                </div>

                {workout.exercicios?.map((ex, i) => {
                  const logKey = `${workout.id}_${i}`
                  const log = logs[logKey] || {}
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px', gap: 6, alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#ccc', fontSize: 12, fontWeight: 700 }}>{ex.nome}</div>
                          <div style={{ color: '#444', fontSize: 10 }}>{ex.series}×{ex.reps} · {ex.rir} · {ex.descanso}</div>
                        </div>
                        {['series', 'reps', 'kg'].map(field => (
                          <input key={field}
                            value={log[field] || ''}
                            onChange={e => updateLog(workout.id, i, field, e.target.value)}
                            placeholder={field === 'series' ? ex.series : field === 'reps' ? ex.reps : '—'}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '5px 8px', color: '#d0d0d0', fontFamily: "'Space Mono',monospace", fontSize: 11, textAlign: 'center', width: '100%', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = 'rgba(220,38,38,0.4)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                          />
                        ))}
                      </div>
                      {ex.dica && <div style={{ color: '#333', fontSize: 10, marginTop: 3, paddingLeft: 2 }}>💡 {ex.dica}</div>}
                    </div>
                  )
                })}

                {workout.observacoes && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, color: '#444', fontSize: 11 }}>
                    📝 {workout.observacoes}
                  </div>
                )}

                <button
                  onClick={() => {
                    // Aqui você pode salvar os logs no Supabase futuramente
                    alert('Treino registrado! Em breve o histórico de performance ficará salvo automaticamente.')
                  }}
                  style={{ marginTop: 14, width: '100%', padding: '10px 0', borderRadius: 6, border: `1px solid ${R}`, background: 'rgba(220,38,38,0.1)', color: R2, fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2, cursor: 'pointer' }}>
                  ✓ REGISTRAR TREINO
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
