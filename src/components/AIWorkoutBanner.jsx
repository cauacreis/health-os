import { useState, useEffect } from 'react'
import { getCustomWorkoutSheet, saveCustomExercise } from '../lib/db'

const R  = '#dc2626'
const R2 = '#ef4444'

function loadAIWorkouts() {
  try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] }
}

export default function AIWorkoutBanner({ userId }) {
  const [workouts,  setWorkouts]  = useState([])
  const [expanded,  setExpanded]  = useState(null)
  const [days,      setDays]      = useState([])
  const [adding,    setAdding]    = useState({}) // { [workoutId]: 'idle'|'saving'|'done' }
  const [dayPick,   setDayPick]   = useState({}) // { [workoutId]: dayId }

  useEffect(() => {
    setWorkouts(loadAIWorkouts())

    if (userId) {
      getCustomWorkoutSheet(userId)
        .then(sheet => { if (sheet?.days) setDays(sheet.days) })
        .catch(() => {})
    }

    const handler = e => {
      setWorkouts(prev => [e.detail, ...prev].slice(0, 10))
      setExpanded(e.detail.id)
    }
    window.addEventListener('ai-workout-ready', handler)
    return () => window.removeEventListener('ai-workout-ready', handler)
  }, [userId])

  function removeWorkout(id) {
    const updated = workouts.filter(w => w.id !== id)
    localStorage.setItem('healthos_ai_workouts', JSON.stringify(updated))
    setWorkouts(updated)
    if (expanded === id) setExpanded(null)
  }

  async function handleAddToDay(workout) {
    const dayId = dayPick[workout.id]
    if (!dayId) return
    setAdding(prev => ({ ...prev, [workout.id]: 'saving' }))
    try {
      for (const ex of (workout.exercicios || [])) {
        await saveCustomExercise(userId, {
          name:      ex.nome,
          muscle:    workout.foco || 'Geral',
          sets:      String(ex.series || 3),
          reps:      ex.reps || '10-12',
          rest:      ex.descanso || '90s',
          rir:       ex.rir || 'RIR 2',
          equipment: '',
          note:      ex.dica || '',
          day_id:    dayId,
        })
      }
      setAdding(prev => ({ ...prev, [workout.id]: 'done' }))
    } catch(e) {
      console.error(e)
      setAdding(prev => ({ ...prev, [workout.id]: 'idle' }))
    }
  }

  if (workouts.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: R, fontSize: 11, letterSpacing: 3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        🤖 TREINOS GERADOS PELA IA
        <span style={{ color: '#333', fontSize: 9 }}>({workouts.length})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {workouts.map(workout => {
          const state      = adding[workout.id] || 'idle'
          const picked     = dayPick[workout.id]
          const pickedDay  = days.find(d => d.id === picked)

          return (
            <div key={workout.id} style={{ background: 'rgba(220,38,38,0.04)', border: `1px solid ${expanded === workout.id ? 'rgba(220,38,38,0.25)' : 'rgba(220,38,38,0.1)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border 0.2s' }}>

              {/* Header */}
              <div onClick={() => setExpanded(expanded === workout.id ? null : workout.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}>
                <div>
                  <div style={{ color: '#d0d0d0', fontSize: 13, fontWeight: 700 }}>{workout.nome}</div>
                  <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{workout.foco} · {workout.duracao} · {workout.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {state === 'done' && <span style={{ color: '#22c55e', fontSize: 10, letterSpacing: 1 }}>✓ ADICIONADO</span>}
                  <span style={{ color: '#444', fontSize: 14 }}>{expanded === workout.id ? '▲' : '▼'}</span>
                  <button onClick={e => { e.stopPropagation(); removeWorkout(workout.id) }}
                    style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
                    onMouseEnter={e => e.currentTarget.style.color = R2}
                    onMouseLeave={e => e.currentTarget.style.color = '#333'}>✕</button>
                </div>
              </div>

              {/* Expandido */}
              {expanded === workout.id && (
                <div style={{ borderTop: '1px solid rgba(220,38,38,0.1)', padding: '14px 16px' }}>

                  {/* Exercícios */}
                  <div style={{ color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>EXERCÍCIOS DO TREINO</div>
                  {workout.exercicios?.map((ex, i) => (
                    <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ color: '#ccc', fontSize: 12, fontWeight: 700 }}>{ex.nome}</div>
                        <div style={{ color: R2, fontSize: 11, fontWeight: 700 }}>{ex.series}×{ex.reps}</div>
                      </div>
                      <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{ex.rir} · {ex.descanso}</div>
                      {ex.dica && <div style={{ color: '#333', fontSize: 10, marginTop: 3 }}>💡 {ex.dica}</div>}
                    </div>
                  ))}

                  {workout.observacoes && (
                    <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, color: '#444', fontSize: 11 }}>
                      📝 {workout.observacoes}
                    </div>
                  )}

                  {/* Seletor de dia */}
                  {state !== 'done' ? (
                    <>
                      <div style={{ color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>
                        ADICIONAR AO DIA DA SUA FICHA
                      </div>

                      {days.length === 0 ? (
                        <div style={{ color: '#555', fontSize: 11, marginBottom: 12, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                          Nenhuma ficha encontrada. Crie sua ficha personalizada em "Treinos" primeiro.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          {days.map(day => (
                            <button key={day.id}
                              onClick={() => setDayPick(prev => ({ ...prev, [workout.id]: day.id }))}
                              style={{
                                padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                                fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1.5,
                                border: `1px solid ${picked === day.id ? (day.color || R) + '80' : 'rgba(255,255,255,0.08)'}`,
                                background: picked === day.id ? `${day.color || R}18` : 'rgba(255,255,255,0.02)',
                                color: picked === day.id ? day.color || R2 : '#555',
                                transition: 'all 0.15s',
                              }}>
                              {day.tag || day.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleAddToDay(workout)}
                        disabled={!picked || state === 'saving'}
                        style={{
                          width: '100%', padding: '11px 0', borderRadius: 6,
                          border: `1px solid ${picked ? R : '#222'}`,
                          background: picked ? 'rgba(220,38,38,0.12)' : 'transparent',
                          color: picked ? R2 : '#333',
                          fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2,
                          cursor: picked && state !== 'saving' ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                        }}>
                        {state === 'saving'
                          ? 'ADICIONANDO...'
                          : picked
                            ? `➕ ADICIONAR AO ${pickedDay?.tag || pickedDay?.name || 'DIA'}`
                            : 'SELECIONE UM DIA ACIMA ↑'}
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
                      <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                        ✓ Exercícios adicionados ao {pickedDay?.tag || pickedDay?.name}!
                      </div>
                      <div style={{ color: '#555', fontSize: 11 }}>
                        Selecione o dia na sua ficha, registre suas séries e finalize normalmente.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}