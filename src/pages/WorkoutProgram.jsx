import { useState, useEffect, useRef } from 'react'
import { PROGRAMS } from '../data/workouts'
import { MUSCLE_GROUPS, EXERCISES_BY_MUSCLE, searchExercises } from '../data/exercises'
import { NeonCard, SectionTitle, Tag, Modal } from '../components/UI'
import { saveWorkoutLog, addCalendarEntry, getExerciseHistory, getCustomExercises, saveCustomExercise, deleteCustomExercise, getCustomWorkoutSheet, saveCustomWorkoutSheet, today } from '../lib/db'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { FUN_FACTS } from '../data/funfacts'

const R  = '#dc2626'
const R2 = '#ef4444'
const S  = '#94a3b8'

const SET_TYPES = ['Normal','Dropset','Rest-pause','Cluster','Myo-reps','Pausa','Excêntrico','Forçada','Pirâmide']

// ─── Video paths — coloque aqui o caminho dos seus vídeos ─────────────────────
// Exemplo: 'Supino Inclinado': '/videos/supino-inclinado.mp4'
// Coloque os arquivos em /public/videos/ do projeto
const EXERCISE_VIDEOS = {
  'Supino Inclinado':       '/videos/supino-inclinado.mp4',
  'Supino Reto':            '/videos/supino-reto.mp4',
  'Barra Fixa':             '/videos/barra-fixa.mp4',
  'Agachamento Livre':      '/videos/agachamento-livre.mp4',
  'Terra Romeno':           '/videos/terra-romeno.mp4',
  'Hip Thrust':             '/videos/hip-thrust.mp4',
  'Desenvolvimento Militar':'/videos/desenvolvimento-militar.mp4',
  'Elevação Lateral':       '/videos/elevacao-lateral.mp4',
  'Remada Curvada':         '/videos/remada-curvada.mp4',
  'Puxada Fechada':         '/videos/puxada-fechada.mp4',
  'Leg Press 45°':          '/videos/leg-press.mp4',
  'Cadeira Extensora':      '/videos/cadeira-extensora.mp4',
  'Mesa Flexora':           '/videos/mesa-flexora.mp4',
  'Crucifixo Polia':        '/videos/crucifixo-polia.mp4',
  'Facepull':               '/videos/facepull.mp4',
  'Rosca Direta':           '/videos/rosca-direta.mp4',
  'Rosca Martelo':          '/videos/rosca-martelo.mp4',
  'Tríceps Polia':          '/videos/triceps-polia.mp4',
  'Tríceps Francês':        '/videos/triceps-frances.mp4',
  'Pullover':               '/videos/pullover.mp4',
  'Crossover':              '/videos/crossover.mp4',
  'Afundo com Barra':       '/videos/afundo.mp4',
  'Panturrilha Sentada':    '/videos/panturrilha-sentada.mp4',
  'Panturrilha em Pé':      '/videos/panturrilha-pe.mp4',
  // Adicione mais exercícios aqui seguindo o mesmo padrão
}

// ─── ExerciseLogger ───────────────────────────────────────────────────────────
function ExerciseLogger({ ex, dayColor, onChange, data, lastSession }) {
  const sets = data?.sets || []

  function addSet() {
    // pré-preenche com o último peso/reps se existir
    const last = lastSession?.sets?.[sets.length] || {}
    onChange({ ...data, sets: [...sets, { reps: last.reps || '', weight: last.weight || '', type: 'Normal', note: '' }] })
  }
  function updateSet(i, patch) {
    onChange({ ...data, sets: sets.map((s, idx) => idx === i ? { ...s, ...patch } : s) })
  }
  function removeSet(i) {
    onChange({ ...data, sets: sets.filter((_,idx) => idx !== i) })
  }

  return (
    <div>
      {/* Header das colunas */}
      {sets.length > 0 && (
        <div style={{ marginBottom:4 }}>
          <div style={{ display:'flex', gap:6, alignItems:'center', paddingLeft:30 }}>
            <div style={{ flex:1, color:'#333', fontSize:9, letterSpacing:1, textAlign:'center' }}>REPS</div>
            <div style={{ flex:1, color:'#333', fontSize:9, letterSpacing:1, textAlign:'center' }}>KG</div>
            <div style={{ width:22 }} />
          </div>
        </div>
      )}

      {sets.map((s, i) => {
        const lastSet = lastSession?.sets?.[i]
        return (
          <div key={i} style={{ marginBottom:8 }}>
            {/* Linha 1: número + REPS + KG + ✕ */}
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
              <div style={{ color:dayColor, fontSize:10, minWidth:24, textAlign:'center', fontWeight:700, fontFamily:'monospace' }}>{i+1}</div>

              <div style={{ position:'relative', flex:1 }}>
                <input value={s.reps} onChange={e => updateSet(i,{reps:e.target.value})} placeholder="—"
                  className="input" style={{ width:'100%', padding:'7px 8px', fontSize:13, borderColor:`${dayColor}30`, color:dayColor, fontWeight:700, textAlign:'center' }} />
                {lastSet?.reps && !s.reps && (
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#333', fontSize:11, pointerEvents:'none' }}>{lastSet.reps}</div>
                )}
              </div>

              <div style={{ position:'relative', flex:1 }}>
                <input value={s.weight} onChange={e => updateSet(i,{weight:e.target.value})} placeholder="—"
                  className="input" style={{ width:'100%', padding:'7px 8px', fontSize:13, borderColor:`${dayColor}30`, color:dayColor, fontWeight:700, textAlign:'center' }} />
                {lastSet?.weight && !s.weight && (
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#333', fontSize:11, pointerEvents:'none' }}>{lastSet.weight}</div>
                )}
              </div>

              <button onClick={() => removeSet(i)} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:16, padding:'0 4px', lineHeight:1, width:22 }}>✕</button>
            </div>

            {/* Linha 2: TIPO + NOTA (indentada) */}
            <div style={{ display:'flex', gap:6, alignItems:'center', paddingLeft:30 }}>
              <select value={s.type} onChange={e => updateSet(i,{type:e.target.value})}
                className="select" style={{ flex:1, padding:'5px 8px', fontSize:11, borderColor:`${dayColor}20`, color:dayColor, background:'#0a0a0c' }}>
                {SET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>

              <input value={s.note} onChange={e => updateSet(i,{note:e.target.value})} placeholder="nota..."
                className="input" style={{ flex:1, padding:'5px 8px', fontSize:11, borderColor:`${dayColor}15`, color:'#666' }} />
            </div>
          </div>
        )
      })}

      <button onClick={addSet}
        style={{ background:'none', border:`1px dashed ${dayColor}30`, color:`${dayColor}80`, fontFamily:'monospace', fontSize:10, letterSpacing:2, padding:'7px 14px', borderRadius:4, cursor:'pointer', width:'100%', marginTop:4, transition:'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=`${dayColor}60`; e.currentTarget.style.color=dayColor }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=`${dayColor}30`; e.currentTarget.style.color=`${dayColor}80` }}>
        + SÉRIE
      </button>
    </div>
  )
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────
function ExerciseCard({ ex, idx, dayColor, dayId, completed, onToggle, logData, onLogChange, lastSession, userId, isCustom, onDelete }) {
  const key    = `${dayId}-${idx}`
  const done   = !!completed[key]
  const [showDetail, setShowDetail] = useState(false)
  const [history, setHistory]       = useState([])
  const [histLoaded, setHistLoaded] = useState(false)
  const [showVideo, setShowVideo]   = useState(false)
  const videoRef = useRef(null)
  const videoSrc = ex.video || EXERCISE_VIDEOS[ex.name]

  async function loadHistory() {
    if (histLoaded) return
    const h = await getExerciseHistory(userId, ex.name)
    setHistory(h)
    setHistLoaded(true)
  }

  // Dados para gráfico — melhor peso por sessão
  const chartData = history.map(h => {
    const best = h.sets.reduce((max, s) => {
      const w = parseFloat(s.weight) || 0
      return w > max ? w : max
    }, 0)
    return { date: h.date?.slice(5), peso: best || null }
  }).filter(d => d.peso).reverse()

  return (
    <>
      <NeonCard color={dayColor} style={{ padding:'16px 18px', opacity: done?0.6:1, borderColor:`${done ? dayColor+'35' : dayColor+'12'}`, background: done?`${dayColor}04`:'rgba(0,0,0,0.6)', transition:'all 0.2s' }}>

        {/* Header do exercício */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          {/* Checkbox */}
          <div onClick={() => onToggle(key)} style={{ width:24, height:24, borderRadius:5, flexShrink:0, border:`1.5px solid ${done?dayColor:'#2a2a2a'}`, background:done?`${dayColor}25`:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:dayColor, fontSize:13, marginTop:2, cursor:'pointer', transition:'all 0.2s' }}>
            {done && '✓'}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
              <span style={{ color:done?'#444':'#e0e0e0', fontSize:15, fontWeight:700, textDecoration:done?'line-through':'none' }}>{ex.name}</span>
              {isCustom && <Tag color="#6366f1">CUSTOM</Tag>}
              {ex.optional && <Tag color="#555">OPCIONAL</Tag>}
              <Tag color={dayColor}>{ex.muscle}</Tag>
            </div>

            {/* Parâmetros */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {[
                { l:'SÉRIES',   v:ex.sets },
                { l:'REPS',     v:ex.reps },
                { l:'DESCANSO', v:ex.rest },
                { l:'RIR',      v:ex.rir },
                { l:'EQUIP.',   v:ex.equipment },
              ].filter(p => p.v).map(p => (
                <div key={p.l} style={{ padding:'3px 8px', borderRadius:4, background:`${dayColor}07`, border:`1px solid ${dayColor}12` }}>
                  <div style={{ color:'#333', fontSize:7, letterSpacing:1.5 }}>{p.l}</div>
                  <div style={{ color:dayColor, fontSize:10, fontWeight:700, marginTop:1 }}>{p.v}</div>
                </div>
              ))}
            </div>

            {/* Botões de ação */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              <button onClick={() => { setShowDetail(d => !d); if (!histLoaded) loadHistory() }}
                style={{ background:`${dayColor}0a`, border:`1px solid ${dayColor}20`, color:showDetail?dayColor:S, fontSize:10, padding:'5px 10px', borderRadius:4, cursor:'pointer', fontFamily:'monospace', letterSpacing:1 }}>
                {showDetail ? '▲ FECHAR' : '📊 HISTÓRICO & DETALHES'}
              </button>
              {videoSrc && (
                <button onClick={() => setShowVideo(true)}
                  style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', color:'#818cf8', fontSize:10, padding:'5px 10px', borderRadius:4, cursor:'pointer', fontFamily:'monospace', letterSpacing:1 }}>
                  ▶ VER VÍDEO
                </button>
              )}
              {isCustom && onDelete && (
                <button onClick={() => onDelete(ex.id)}
                  style={{ background:'rgba(255,0,0,0.05)', border:'1px solid rgba(255,0,0,0.15)', color:'#ff6b6b', fontSize:10, padding:'5px 10px', borderRadius:4, cursor:'pointer', fontFamily:'monospace', letterSpacing:1 }}>
                  🗑 REMOVER
                </button>
              )}
            </div>

            {/* Detalhes expandidos */}
            {showDetail && (
              <div style={{ marginBottom:12, padding:14, borderRadius:8, background:'rgba(0,0,0,0.3)', border:`1px solid ${dayColor}10` }}>
                {/* Nota */}
                {ex.note && (
                  <div style={{ color:'#666', fontSize:11, lineHeight:1.6, marginBottom:12, padding:'8px 12px', borderRadius:6, background:'rgba(255,255,255,0.02)', borderLeft:`2px solid ${dayColor}30` }}>
                    📋 {ex.note}
                  </div>
                )}

                {/* Gráfico de progresso */}
                {!histLoaded ? (
                  <div style={{ color:'#444', fontSize:11, padding:8 }}>Carregando histórico...</div>
                ) : chartData.length >= 2 ? (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginBottom:8 }}>EVOLUÇÃO DE CARGA (KG)</div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tick={{ fill:'#444', fontSize:8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:'#444', fontSize:8 }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip contentStyle={{ background:'#0a0a0c', border:`1px solid ${dayColor}25`, borderRadius:4, fontFamily:'monospace', fontSize:10 }} formatter={v => [`${v}kg`]} />
                        <Line type="monotone" dataKey="peso" stroke={dayColor} strokeWidth={2} dot={{ r:3, fill:dayColor }} name="Melhor peso" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : history.length > 0 ? (
                  <div style={{ color:'#555', fontSize:11, marginBottom:12 }}>Registre mais sessões para ver o gráfico de evolução.</div>
                ) : (
                  <div style={{ color:'#444', fontSize:11, marginBottom:12 }}>Nenhum histórico ainda. Registre suas séries abaixo!</div>
                )}

                {/* Histórico de sessões */}
                {history.length > 0 && (
                  <div>
                    <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginBottom:8 }}>ÚLTIMAS SESSÕES</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {history.slice(0,5).map((h, i) => {
                        const bestSet = h.sets.reduce((best, s) => {
                          const w = parseFloat(s.weight) || 0
                          return w > (parseFloat(best.weight) || 0) ? s : best
                        }, {})
                        return (
                          <div key={i} style={{ padding:'8px 12px', borderRadius:6, background:'rgba(255,255,255,0.02)', border:`1px solid ${dayColor}10` }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                              <span style={{ color:'#666', fontSize:11 }}>{h.date}</span>
                              {bestSet.weight && <span style={{ color:dayColor, fontSize:12, fontWeight:700 }}>Melhor: {bestSet.weight}kg × {bestSet.reps}</span>}
                            </div>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              {h.sets.map((s, si) => s.weight || s.reps ? (
                                <span key={si} style={{ padding:'2px 8px', borderRadius:3, background:`${dayColor}10`, color:dayColor, fontSize:10, fontFamily:'monospace' }}>
                                  {s.reps || '?'} × {s.weight || '?'}kg {s.type !== 'Normal' ? `(${s.type})` : ''}
                                </span>
                              ) : null)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logger de séries */}
            <div style={{ borderTop:`1px solid ${dayColor}10`, paddingTop:10 }}>
              <div style={{ color:'#333', fontSize:9, letterSpacing:2, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                REGISTRAR SÉRIES
                {history[0] && <span style={{ color:'#333', fontSize:9 }}>· última: {history[0].date}</span>}
              </div>
              <ExerciseLogger ex={ex} dayColor={dayColor}
                data={logData[key]}
                onChange={d => onLogChange(key, d)}
                lastSession={history[0]} />
            </div>
          </div>

          {/* Número */}
          <div style={{ width:26, height:26, borderRadius:'50%', background:`${dayColor}10`, border:`1px solid ${dayColor}18`, display:'flex', alignItems:'center', justifyContent:'center', color:dayColor, fontSize:11, fontWeight:700, flexShrink:0 }}>
            {idx+1}
          </div>
        </div>
      </NeonCard>

      {/* Modal de vídeo */}
      {showVideo && videoSrc && (
        <Modal title={`${ex.name} — COMO EXECUTAR`} color={dayColor} onClose={() => { setShowVideo(false); videoRef.current?.pause() }}>
          <video ref={videoRef} src={videoSrc} controls autoPlay playsInline
            style={{ width:'100%', borderRadius:8, background:'#000', maxHeight:'60vh', outline:'none' }}
            onError={() => {}}
          />
          {ex.note && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:6, background:'rgba(255,255,255,0.02)', border:`1px solid ${dayColor}15`, color:'#666', fontSize:12, lineHeight:1.6 }}>
              📋 {ex.note}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

// ─── AddCustomExerciseModal ───────────────────────────────────────────────────
// Duas opções: Buscar na lista (com filtro de músculo) ou Digitar exercício específico
function AddCustomModal({ dayColor, onSave, onClose }) {
  const [mode, setMode] = useState('lista') // 'lista' | 'manual'
  const [muscleFilter, setMuscleFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [selectedFromList, setSelectedFromList] = useState(null) // { name, muscle, equipment, note }
  const [form, setForm] = useState({
    name:'', muscle: MUSCLE_GROUPS[0], sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', equipment:'', note:'', video:''
  })

  const filtered = searchExercises(muscleFilter || null, searchText)
  const [listParams, setListParams] = useState({ sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2' })

  function handleSaveFromList() {
    if (!selectedFromList) return
    onSave({
      ...selectedFromList,
      ...listParams,
    })
    onClose()
  }

  function handleSaveManual() {
    if (!form.name.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <Modal title="ADICIONAR EXERCÍCIO" color={dayColor} onClose={onClose}>
      {/* Tabs: Buscar na lista | Digitar específico */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        <button onClick={() => setMode('lista')} style={{ flex:1, padding:'10px', borderRadius:6, border:`1px solid ${mode==='lista'?dayColor:'#333'}`, background:mode==='lista'?`${dayColor}15`:'transparent', color:mode==='lista'?dayColor:'#555', fontSize:11, cursor:'pointer', fontFamily:'monospace' }}>
          🔍 BUSCAR NA LISTA
        </button>
        <button onClick={() => setMode('manual')} style={{ flex:1, padding:'10px', borderRadius:6, border:`1px solid ${mode==='manual'?dayColor:'#333'}`, background:mode==='manual'?`${dayColor}15`:'transparent', color:mode==='manual'?dayColor:'#555', fontSize:11, cursor:'pointer', fontFamily:'monospace' }}>
          ✏️ DIGITAR EXERCÍCIO ESPECÍFICO
        </button>
      </div>

      {mode === 'lista' ? (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)}
              className="select" style={{ flex:1, minWidth:140, borderColor:`${dayColor}30` }}>
              <option value="">Todos os músculos</option>
              {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Buscar exercício..."
              className="input" style={{ flex:1, minWidth:140, borderColor:`${dayColor}20` }} />
          </div>
          <div style={{ maxHeight:240, overflowY:'auto', border:`1px solid ${dayColor}15`, borderRadius:6, marginBottom:12 }}>
            {filtered.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:'#444', fontSize:12 }}>Nenhum exercício encontrado. Use "Digitar exercício específico" para adicionar.</div>
            ) : (
              filtered.map((ex, i) => (
                <div key={i} onClick={() => setSelectedFromList(prev => prev?.name === ex.name ? null : ex)}
                  style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background:selectedFromList?.name === ex.name ? `${dayColor}15` : 'transparent', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:600 }}>{ex.name}</div>
                    <div style={{ color:'#555', fontSize:10, marginTop:2 }}>{ex.muscle} · {ex.equipment}</div>
                  </div>
                  {selectedFromList?.name === ex.name && <span style={{ color:dayColor, fontSize:14 }}>✓</span>}
                </div>
              ))
            )}
          </div>
          {selectedFromList && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {['sets','reps','rest','rir'].map(k => (
                <div key={k}>
                  <label className="label">{k.toUpperCase()}</label>
                  <input value={listParams[k]} onChange={e => setListParams(p=>({...p,[k]:e.target.value}))}
                    placeholder={k==='sets'?'3':k==='reps'?'10–12':k==='rest'?'90s':'RIR 2'} className="input" style={{ fontSize:11 }} />
                </div>
              ))}
            </div>
          )}
          <button className="btn" onClick={handleSaveFromList} disabled={!selectedFromList}
            style={{ width:'100%', background:`${dayColor}15`, borderColor:dayColor, color:dayColor, padding:12, fontSize:12, opacity:selectedFromList?1:0.5 }}>
            ➕ ADICIONAR {selectedFromList ? `"${selectedFromList.name}"` : ''}
          </button>
        </>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">NOME DO EXERCÍCIO *</label>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="ex: Remada Cavalinho"
                className="input" style={{ borderColor:`${dayColor}30`, color:'#d0d0d0' }} />
            </div>
            <div>
              <label className="label">GRUPO MUSCULAR</label>
              <select value={form.muscle} onChange={e => setForm(f=>({...f,muscle:e.target.value}))} className="select">
                {MUSCLE_GROUPS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">EQUIPAMENTO</label>
              <input value={form.equipment} onChange={e => setForm(f=>({...f,equipment:e.target.value}))} placeholder="ex: Halter, Barra..." className="input" />
            </div>
            {['sets','reps','rest','rir'].map(f => (
              <div key={f}>
                <label className="label">{f.toUpperCase()}</label>
                <input value={form[f]} onChange={e => setForm(v=>({...v,[f]:e.target.value}))} placeholder={f==='sets'?'3':f==='reps'?'10–12':f==='rest'?'90s':'RIR 2'} className="input" />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">OBSERVAÇÕES / EXECUÇÃO</label>
              <textarea value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="Dicas de execução, séries, tipo..."
                className="input" style={{ height:60, resize:'vertical' }} />
            </div>
          </div>
          <button className="btn" onClick={handleSaveManual}
            style={{ width:'100%', marginTop:14, background:`${dayColor}15`, borderColor:dayColor, color:dayColor === R ? R2 : dayColor, padding:13, fontSize:13 }}>
            ➕ ADICIONAR AO TREINO
          </button>
        </>
      )}
    </Modal>
  )
}

// Estrutura padrão para ficha própria
const DEFAULT_CUSTOM_SHEET = {
  name: 'Minha Ficha',
  days: [{ id: 1, name: 'Dia A', focus: 'Personalize', tag: 'DIA A', color: '#dc2626', exercises: [] }]
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkoutProgram({ user, userId, onUpdateUser }) {
  const programKey = user.program || 'upperLower5'
  const isCustom   = programKey === 'custom'
  const program    = isCustom ? null : PROGRAMS[programKey]

  const [customSheet, setCustomSheet]     = useState(null)
  const [customSheetLoaded, setCustomSheetLoaded] = useState(false)
  const [tab, setTab]             = useState('treino')
  const [selectedDay, setSelectedDay] = useState(0)
  const [completed,   setCompleted]   = useState({})
  const [logData,     setLogData]     = useState({})
  const [saved,       setSaved]       = useState(false)
  const [factIdx,     setFactIdx]     = useState(0)
  const [customExs,   setCustomExs]   = useState({})
  const [customLoaded,setCustomLoaded]= useState(false)
  const [addModal,    setAddModal]    = useState(false)
  const [historyEx,   setHistoryEx]   = useState(null)

  // Programa efetivo: pre-made ou ficha própria
  const activeProgram = isCustom ? (customSheet && { name: customSheet.name, days: customSheet.days }) : program
  const day = activeProgram?.days?.[selectedDay]
  const dayCustom = customExs[day?.id] || []
  const allExs = day ? [...(day.exercises || []), ...dayCustom] : []

  const facts = FUN_FACTS.filter(f => f.category === 'Treino')
  const fact  = facts[factIdx % Math.max(facts.length, 1)]

  // Carrega ficha própria (quando programa é custom)
  useEffect(() => {
    if (isCustom && !customSheetLoaded && userId) {
      getCustomWorkoutSheet(userId).then(async sheet => {
        const s = sheet || DEFAULT_CUSTOM_SHEET
        setCustomSheet(s)
        if (!sheet) await saveCustomWorkoutSheet(userId, s)
        setCustomSheetLoaded(true)
      }).catch(() => { setCustomSheet(DEFAULT_CUSTOM_SHEET); setCustomSheetLoaded(true) })
    } else if (!isCustom) {
      setCustomSheetLoaded(true)
    }
  }, [isCustom, userId, customSheetLoaded])

  // Carrega exercícios customizados
  useEffect(() => {
    if (!customLoaded && userId) {
      getCustomExercises(userId).then(data => {
        const grouped = {}
        data.forEach(ex => {
          const d = ex.day_id
          if (!grouped[d]) grouped[d] = []
          grouped[d].push(ex)
        })
        setCustomExs(grouped)
        setCustomLoaded(true)
      }).catch(() => setCustomLoaded(true))
    }
  }, [userId, customLoaded])

  function toggleEx(key) {
    setCompleted(c => ({ ...c, [key]: !c[key] }))
  }

  const dayCompletedCount = allExs.filter((_,i) => completed[`${day.id}-${i}`]).length
  const allDone = dayCompletedCount === allExs.length && allExs.length > 0

  async function finishWorkout() {
    const logEntry = {
      date: today(),
      day_id: day.id,
      day_name: day.name,
      program_name: activeProgram?.name || 'Minha Ficha',
      exercises: allExs.map((ex, i) => ({
        name: ex.name,
        completed: !!completed[`${day.id}-${i}`],
        sets: logData[`${day.id}-${i}`]?.sets || [],
      })),
      completed: allDone,
    }
    try {
      await saveWorkoutLog(userId, logEntry)
      await addCalendarEntry(userId, { date: today(), type:'workout', label: day.name, note:`${dayCompletedCount}/${allExs.length} exercícios` })
    } catch(e) {
      console.error('finishWorkout error:', e)
      alert('Erro ao salvar treino: ' + (e?.message || JSON.stringify(e)))
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleAddCustom(form) {
    const ex = await saveCustomExercise(userId, { ...form, day_id: day.id })
    setCustomExs(prev => ({ ...prev, [day.id]: [...(prev[day.id]||[]), ex] }))
    setAddModal(false)
  }

  async function handleDeleteCustom(id) {
    await deleteCustomExercise(userId, id)
    setCustomExs(prev => ({ ...prev, [day.id]: (prev[day.id]||[]).filter(e => e.id !== id) }))
  }

  async function addCustomDay() {
    const nextId = Math.max(...(customSheet.days || []).map(d => d.id), 0) + 1
    const colors = ['#dc2626', '#94a3b8', '#16a34a', '#6366f1', '#eab308', '#ec4899']
    const newDay = { id: nextId, name: `Dia ${String.fromCharCode(64 + nextId)}`, focus: 'Personalize', tag: `DIA ${String.fromCharCode(64 + nextId)}`, color: colors[(nextId - 1) % colors.length], exercises: [] }
    const updated = { ...customSheet, days: [...(customSheet.days || []), newDay] }
    setCustomSheet(updated)
    await saveCustomWorkoutSheet(userId, updated)
    setSelectedDay(updated.days.length - 1)
  }

  async function removeCustomDay(dayId) {
    const newDays = (customSheet.days || []).filter(d => d.id !== dayId)
    if (newDays.length === 0) return
    const updated = { ...customSheet, days: newDays }
    setCustomSheet(updated)
    await saveCustomWorkoutSheet(userId, updated)
    setSelectedDay(Math.min(selectedDay, newDays.length - 1))
  }

  if (isCustom && !customSheetLoaded) {
    return <div style={{ padding:40, textAlign:'center', color:'#555' }}>Carregando sua ficha...</div>
  }

  if (isCustom && !activeProgram?.days?.length) {
    return (
      <div className="animate-fade">
        <div style={{ color:R, fontSize:20, letterSpacing:4, fontWeight:700, marginBottom:16 }}>MONTAR MINHA FICHA</div>
        <NeonCard color={R} style={{ padding:24, marginBottom:14 }}>
          <div style={{ color:'#d0d0d0', fontSize:14, marginBottom:12 }}>Crie seu primeiro dia de treino para começar.</div>
          <button onClick={addCustomDay} className="btn" style={{ background:`${R}15`, borderColor:R, color:R, padding:12, fontSize:12 }}>
            ➕ CRIAR PRIMEIRO DIA
          </button>
        </NeonCard>
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:18 }}>
        <div style={{ color:R, fontSize:20, letterSpacing:4, fontWeight:700 }}>PROGRAMA DE TREINO</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>{(activeProgram?.name || 'Treino').toUpperCase()} · {(activeProgram?.frequency || 'Personalizado').toUpperCase()}</div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(148,163,184,0.03)', border:'1px solid rgba(148,163,184,0.08)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:16 }}>
        <span style={{ fontSize:16 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#94a3b8', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 FATO · toque para próximo</div>
          <div style={{ color:'#555', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      {/* Tabs principais */}
      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[{id:'treino',label:'💪 Treino de Hoje'},{id:'historico',label:'📊 Histórico Geral'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn"
            style={{ flex:1, padding:'10px 0', fontSize:12, background: tab===t.id ? 'rgba(220,38,38,0.15)' : 'transparent', borderColor: tab===t.id ? R : 'rgba(255,255,255,0.08)', color: tab===t.id ? R2 : '#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: TREINO ──────────────────────────────────────────────── */}
      {tab === 'treino' && (
        <>
          {/* Seletor de dias */}
          <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
            {(activeProgram?.days || []).map((d,i) => {
              const active = i === selectedDay
              return (
                <button key={d.id} onClick={() => { setSelectedDay(i); setCompleted({}); setLogData({}) }}
                  style={{ padding:'8px 14px', borderRadius:6, border:`1px solid ${active?d.color+'60':'#ffffff08'}`, background:active?`${d.color}12`:'rgba(255,255,255,0.01)', color:active?d.color:'#444', fontFamily:'monospace', fontSize:10, letterSpacing:1.5, cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase' }}>
                  <span style={{ fontSize:9, display:'block', color:active?d.color:'#333', marginBottom:2 }}>DIA {i+1}</span>
                  {d.tag}
                </button>
              )
            })}
            {isCustom && (
              <button onClick={addCustomDay}
                style={{ padding:'8px 14px', borderRadius:6, border:'1px dashed rgba(99,102,241,0.5)', background:'rgba(99,102,241,0.06)', color:'#818cf8', fontFamily:'monospace', fontSize:10, letterSpacing:1.5, cursor:'pointer', transition:'all 0.2s' }}>
                ➕ NOVO DIA
              </button>
            )}
          </div>

          {/* Header do dia */}
          <NeonCard color={day.color} style={{ padding:'18px 22px', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Tag color={day.color}>{day.tag}</Tag>
                </div>
                <div style={{ color:'#e0e0e0', fontSize:16, fontWeight:700, marginBottom:4 }}>{day.name}</div>
                <div style={{ color:'#555', fontSize:11 }}>Foco em {day.focus}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:day.color, fontSize:26, fontWeight:700, lineHeight:1 }}>{dayCompletedCount}/{allExs.length}</div>
                <div style={{ color:'#444', fontSize:9, letterSpacing:1, marginTop:2 }}>CONCLUÍDOS</div>
              </div>
            </div>
            {/* Barra de progresso */}
            <div style={{ marginTop:12, height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${allExs.length > 0 ? (dayCompletedCount/allExs.length)*100 : 0}%`, background:day.color, borderRadius:2, transition:'width 0.4s ease' }} />
            </div>
            {day.rationale && (
              <div style={{ marginTop:10, padding:'8px 12px', borderRadius:6, background:`${day.color}06`, borderLeft:`2px solid ${day.color}25` }}>
                <span style={{ color:'#555', fontSize:11 }}>{day.rationale}</span>
              </div>
            )}
          </NeonCard>

          {/* Exercícios do programa */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {allExs.map((ex, i) => (
              <ExerciseCard key={ex.id || `${day.id}-${i}`}
                ex={ex} idx={i} dayColor={day.color} dayId={day.id}
                completed={completed} onToggle={toggleEx}
                logData={logData}
                onLogChange={(key, d) => setLogData(prev => ({ ...prev, [key]: d }))}
                lastSession={null}
                userId={userId}
                isCustom={i >= day.exercises.length}
                onDelete={i >= day.exercises.length ? handleDeleteCustom : null}
              />
            ))}
          </div>

          {/* Botão adicionar exercício */}
          <button onClick={() => setAddModal(true)} className="btn"
            style={{ width:'100%', marginTop:10, padding:12, background:'rgba(99,102,241,0.08)', borderColor:'rgba(99,102,241,0.3)', color:'#818cf8', fontSize:12 }}>
            ➕ ADICIONAR EXERCÍCIO AO {day.tag}
          </button>

          {/* Finalizar treino */}
          <div style={{ marginTop:20, display:'flex', justifyContent:'center' }}>
            <button onClick={finishWorkout} className="btn"
              style={{ padding:'13px 40px', fontSize:12, background: allDone?'rgba(220,38,38,0.2)':'rgba(220,38,38,0.06)', borderColor: allDone?R:'rgba(220,38,38,0.3)', boxShadow: allDone?`0 0 20px ${R}30`:'none', transition:'all 0.3s' }}>
              {saved ? '✓ TREINO SALVO!' : allDone ? '✓ FINALIZAR & SALVAR TREINO' : '💾 SALVAR PROGRESSO'}
            </button>
          </div>

          {allDone && (
            <div className="animate-fade" style={{ marginTop:14, padding:'14px 22px', borderRadius:8, background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', textAlign:'center', boxShadow:`0 0 24px ${R}10` }}>
              <div style={{ color:R, fontSize:15, fontWeight:700, marginBottom:3 }}>✓ TREINO CONCLUÍDO</div>
              <div style={{ color:'#555', fontSize:11 }}>Salvo no calendário. Descanse, hidrate-se e alimente-se bem!</div>
            </div>
          )}

          {addModal && (
            <AddCustomModal dayColor={day.color} onSave={handleAddCustom} onClose={() => setAddModal(false)} />
          )}
        </>
      )}

      {/* ── TAB: HISTÓRICO GERAL ─────────────────────────────────────── */}
      {tab === 'historico' && (
        <HistoricoGeral userId={userId} program={activeProgram} customExs={customExs} />
      )}
    </div>
  )
}

// ─── Histórico Geral ──────────────────────────────────────────────────────────
function HistoricoGeral({ userId, program, customExs = {} }) {
  const [selectedEx, setSelectedEx] = useState(null)
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')

  // Todos os exercícios do programa + custom
  const allExercises = (program?.days || []).flatMap(d => [
    ...(d.exercises || []).map(ex => ({ ...ex, day: d.name, dayColor: d.color })),
    ...(customExs[d.id] || []).map(ex => ({ ...ex, day: d.name, dayColor: d.color })),
  ])
  const filtered = allExercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))

  async function selectExercise(ex) {
    setSelectedEx(ex)
    setLoading(true)
    const h = await getExerciseHistory(userId, ex.name)
    setHistory(h)
    setLoading(false)
  }

  const chartData = history.map(h => {
    const best = h.sets.reduce((max, s) => {
      const w = parseFloat(s.weight) || 0; return w > max ? w : max
    }, 0)
    const totalVol = h.sets.reduce((sum, s) => sum + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0)
    return { date: h.date?.slice(5), peso: best || null, volume: totalVol || null }
  }).filter(d => d.peso || d.volume).reverse()

  const pr = chartData.length ? Math.max(...chartData.map(d => d.peso || 0)) : null

  return (
    <div>
      {/* Busca */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercício..."
        className="input" style={{ marginBottom:14, borderColor:`${R}20` }} />

      {/* Lista de exercícios */}
      {!selectedEx ? (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map((ex, i) => (
            <div key={i} onClick={() => selectExercise(ex)}
              style={{ padding:'12px 16px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${ex.dayColor}15`, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
              <div>
                <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{ex.name}</div>
                <div style={{ color:'#444', fontSize:11, marginTop:2 }}>{ex.muscle} · {ex.day}</div>
              </div>
              <div style={{ color:ex.dayColor, fontSize:18 }}>›</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <button onClick={() => setSelectedEx(null)}
            style={{ background:'none', border:`1px solid ${R}20`, color:S, fontFamily:'monospace', fontSize:10, letterSpacing:2, padding:'6px 14px', borderRadius:4, cursor:'pointer', marginBottom:14 }}>
            ← VOLTAR
          </button>

          <NeonCard color={selectedEx.dayColor} style={{ padding:'16px 20px', marginBottom:14 }}>
            <div style={{ color:'#e0e0e0', fontSize:16, fontWeight:700, marginBottom:4 }}>{selectedEx.name}</div>
            <div style={{ color:'#555', fontSize:11, marginBottom:8 }}>{selectedEx.muscle} · {selectedEx.day}</div>
            {pr && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:6, background:`${selectedEx.dayColor}10`, border:`1px solid ${selectedEx.dayColor}25` }}>
                <span style={{ fontSize:16 }}>🏆</span>
                <span style={{ color:selectedEx.dayColor, fontSize:13, fontWeight:700 }}>PR: {pr}kg</span>
              </div>
            )}
          </NeonCard>

          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#444' }}>Carregando...</div>
          ) : chartData.length >= 2 ? (
            <>
              <NeonCard color={selectedEx.dayColor} style={{ padding:18, marginBottom:14 }}>
                <SectionTitle color={selectedEx.dayColor}>EVOLUÇÃO DE CARGA (KG)</SectionTitle>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ background:'#0a0a0c', border:`1px solid ${selectedEx.dayColor}25`, borderRadius:4, fontFamily:'monospace', fontSize:10 }} formatter={v => [`${v}kg`]} />
                    <Line type="monotone" dataKey="peso" stroke={selectedEx.dayColor} strokeWidth={2} dot={{ r:4, fill:selectedEx.dayColor }} name="Melhor peso" />
                  </LineChart>
                </ResponsiveContainer>
              </NeonCard>

              <NeonCard color={S} style={{ padding:18, marginBottom:14 }}>
                <SectionTitle color={S}>VOLUME TOTAL (KG × REPS)</SectionTitle>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#555', fontSize:9 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background:'#0a0a0c', border:`1px solid ${S}25`, borderRadius:4, fontFamily:'monospace', fontSize:10 }} />
                    <Line type="monotone" dataKey="volume" stroke={S} strokeWidth={2} dot={{ r:3, fill:S }} name="Volume" />
                  </LineChart>
                </ResponsiveContainer>
              </NeonCard>
            </>
          ) : (
            <NeonCard color={selectedEx.dayColor} style={{ padding:28, textAlign:'center', marginBottom:14 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
              <div style={{ color:'#444', fontSize:13 }}>
                {history.length === 0 ? 'Nenhuma sessão registrada ainda para este exercício.' : 'Registre mais sessões para ver o gráfico de evolução.'}
              </div>
            </NeonCard>
          )}

          {/* Todas as sessões */}
          {history.length > 0 && (
            <NeonCard color={selectedEx.dayColor} style={{ padding:18 }}>
              <SectionTitle color={selectedEx.dayColor}>TODAS AS SESSÕES</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {history.map((h, i) => {
                  const bestSet = h.sets.reduce((best, s) => {
                    const w = parseFloat(s.weight) || 0; return w > (parseFloat(best.weight)||0) ? s : best
                  }, {})
                  return (
                    <div key={i} style={{ padding:'12px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${selectedEx.dayColor}10` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ color:'#d0d0d0', fontSize:13, fontWeight:700 }}>{h.date}</span>
                        {bestSet.weight && (
                          <span style={{ color:selectedEx.dayColor, fontSize:12, fontWeight:700 }}>
                            Melhor: {bestSet.weight}kg × {bestSet.reps}
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {h.sets.map((s, si) => (s.weight || s.reps) ? (
                          <span key={si} style={{ padding:'3px 10px', borderRadius:4, background:`${selectedEx.dayColor}0f`, border:`1px solid ${selectedEx.dayColor}20`, color:selectedEx.dayColor, fontSize:11, fontFamily:'monospace' }}>
                            {s.reps||'?'} × {s.weight||'?'}kg{s.type !== 'Normal' ? ` · ${s.type}` : ''}
                          </span>
                        ) : null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </NeonCard>
          )}
        </>
      )}
    </div>
  )
}
