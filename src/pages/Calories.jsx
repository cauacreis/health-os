import { useState, useEffect } from 'react'
import { NeonCard, SectionTitle, Modal } from '../components/UI'
import { getFoodLog, addFoodEntry, deleteFoodEntry, today } from '../lib/db'
import { getMealPlans, saveMealPlan, deleteMealPlan, getMealLog, toggleMealLog } from '../lib/db'
import { FUN_FACTS } from '../data/funfacts'

const R   = '#dc2626'
const R2  = '#ef4444'
const S   = '#94a3b8'
const G   = '#22c55e'
const DIM = 'rgba(220,38,38,0.08)'

const MEALS = [
  { id:'breakfast', label:'Café da Manhã', icon:'🌅', color:'#f97316' },
  { id:'lunch',     label:'Almoço',        icon:'☀️', color:'#eab308' },
  { id:'dinner',    label:'Jantar',        icon:'🌙', color:'#94a3b8' },
  { id:'snack',     label:'Lanche',        icon:'🍎', color:'#ef4444' },
]

const MEAL_TYPES = ['Café da manhã','Lanche manhã','Almoço','Lanche tarde','Jantar','Ceia']
const FREQ_OPTS  = ['Todos os dias','Segunda a sexta','Fins de semana','Seg/Qua/Sex','Ter/Qui','Personalizado']
const EMPTY_PLAN = { name:'', meal_type:'Café da manhã', time:'', description:'', calories:'', protein:'', carbs:'', fat:'', frequency:'Todos os dias', active:true, id:undefined }

const COMMON_FOODS = [
  { name:'Arroz cozido (100g)',    kcal:128 }, { name:'Feijão cozido (100g)', kcal:77  },
  { name:'Frango grelhado (100g)', kcal:165 }, { name:'Ovo cozido',           kcal:77  },
  { name:'Batata doce (100g)',     kcal:86  }, { name:'Aveia (40g)',           kcal:148 },
  { name:'Banana média',           kcal:89  }, { name:'Maçã média',            kcal:72  },
  { name:'Pão integral (fatia)',   kcal:69  }, { name:'Whey protein (30g)',    kcal:120 },
  { name:'Azeite (colher sopa)',   kcal:119 }, { name:'Leite integral (200ml)',kcal:122 },
]

export default function Calories({ user, userId, onUpdate }) {
  const uid = userId || user?.id
  const todayStr = today()

  // ─── Calorias (food log) ───
  const [foodLog, setFoodLog] = useState([])
  const [modalFood, setModalFood] = useState(false)
  const [formFood, setFormFood] = useState({ name:'', calories:'', meal:'breakfast', note:'' })

  // ─── Planos de refeição ───
  const [plans, setPlans] = useState([])
  const [plansLoaded, setPlansLoaded] = useState(false)
  const [checkedMap, setCheckedMap] = useState({})
  const [logLoaded, setLogLoaded] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [formPlan, setFormPlan] = useState(EMPTY_PLAN)
  const [savingPlan, setSavingPlan] = useState(false)
  const [savedPlan, setSavedPlan] = useState(false)

  const [tab, setTab] = useState('hoje')
  const [factIdx, setFactIdx] = useState(0)

  const bmr = user?.sex==='male' ? 88.36+13.4*(user.weight||70)+4.8*(user.height||170)-5.7*(user.age||30) : 447.6+9.2*(user.weight||70)+3.1*(user.height||170)-4.3*(user.age||30)
  const tdee = Math.round(bmr * (user?.activity||1.55))
  const fact = FUN_FACTS.filter(f=>f.category==='Nutrição')[factIdx % Math.max(FUN_FACTS.filter(f=>f.category==='Nutrição').length, 1)]

  // Load food log
  function refreshFood() { getFoodLog(uid, todayStr).then(setFoodLog).catch(()=>setFoodLog([])) }

  useEffect(() => {
    if (uid) getFoodLog(uid, todayStr).then(setFoodLog).catch(() => setFoodLog([]))
  }, [uid, todayStr])

  // Load plans & log
  useEffect(() => {
    if (!plansLoaded && uid) getMealPlans(uid).then(d => { setPlans(d); setPlansLoaded(true) })
  }, [plansLoaded, uid])

  useEffect(() => {
    if (!logLoaded && plansLoaded && uid) {
      getMealLog(uid, todayStr).then(logs => {
        const map = {}; logs.forEach(l => { map[l.meal_id] = true }); setCheckedMap(map); setLogLoaded(true)
      })
    }
  }, [logLoaded, plansLoaded, uid, todayStr])

  async function handleToggle(plan) {
    const next = !checkedMap[plan.id]
    setCheckedMap(m => ({ ...m, [plan.id]: next }))
    setSavingId(plan.id)
    try { await toggleMealLog(uid, todayStr, plan.id, plan.name, next) }
    catch(e) { console.error(e); setCheckedMap(m => ({ ...m, [plan.id]: !next })) }
    setSavingId(null)
  }

  async function handleSavePlan() {
    if (!formPlan.name.trim()) return
    setSavingPlan(true)
    try {
      const saved = await saveMealPlan(uid, formPlan)
      setPlans(p => formPlan.id ? p.map(x => x.id===formPlan.id ? saved : x) : [...p, saved])
      setFormPlan(EMPTY_PLAN)
      setSavedPlan(true); setTimeout(() => setSavedPlan(false), 2000)
      setTab('hoje')
    } catch(e) { console.error(e) }
    setSavingPlan(false)
  }

  async function handleDeletePlan(id) {
    if (!confirm('Deletar esta refeição?')) return
    await deleteMealPlan(uid, id)
    setPlans(p => p.filter(x => x.id !== id))
    setCheckedMap(m => { const n={...m}; delete n[id]; return n })
  }

  async function handleAddFood() {
    if (!formFood.name || !formFood.calories) return
    try {
      await addFoodEntry(uid, { name:formFood.name, calories:+formFood.calories, meal:formFood.meal, note:formFood.note })
      refreshFood()
      setFormFood({ name:'', calories:'', meal:'breakfast', note:'' })
      setModalFood(false)
    } catch (e) {
      console.error(e)
      alert(`Erro ao adicionar: ${e?.message || 'erro desconhecido'}`)
    }
  }

  async function handleDeleteFood(id) {
    try {
      await deleteFoodEntry(uid, id)
      refreshFood()
    } catch (e) {
      console.error(e)
    }
  }

  const totalKcal = foodLog.reduce((s,e) => s+e.calories, 0)
  const byMeal = MEALS.map(m => ({
    ...m,
    entries: foodLog.filter(e=>e.meal===m.id),
    total: foodLog.filter(e=>e.meal===m.id).reduce((s,e)=>s+e.calories,0),
  }))
  const mealsWithFood = byMeal.filter(m=>m.entries.length>0).length

  const todayPlans = plans.filter(p => {
    if (!p.active) return false
    if (p.frequency === 'Segunda a sexta') { const d=new Date().getDay(); return d>=1&&d<=5 }
    if (p.frequency === 'Fins de semana')  { const d=new Date().getDay(); return d===0||d===6 }
    return true
  })
  const doneCount = todayPlans.filter(p => checkedMap[p.id]).length
  const totalCount = todayPlans.length

  const pct = tdee ? Math.min((totalKcal/tdee)*100, 110) : 0
  const pctColor = pct < 80 ? S : pct < 100 ? R : pct < 110 ? R2 : '#ff6b6b'

  const f = k => e => setFormPlan(v => ({...v, [k]: e.target.value}))

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ color:R, fontSize:22, letterSpacing:4, fontWeight:700 }}>CALORIAS & REFEIÇÕES</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>CONTROLE ALIMENTAR DIÁRIO</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:18 }}>
        {[{id:'hoje',label:'📋 Hoje'},{id:'planos',label:'🍽 Planos'},{id:'adicionar',label:'+ Nova'}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if(t.id==='adicionar') setFormPlan(EMPTY_PLAN) }} className="btn"
            style={{ padding:'10px 0', fontSize:11, background:tab===t.id?DIM:'transparent', borderColor:tab===t.id?R:'rgba(255,255,255,0.08)', color:tab===t.id?R2:'#555' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB HOJE ── */}
      {tab === 'hoje' && (
        <>
          {/* Fun fact */}
          <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(148,163,184,0.04)', border:'1px solid rgba(148,163,184,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
            <span style={{ fontSize:18 }}>{fact?.icon}</span>
            <div>
              <div style={{ color:S, fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 NUTRIÇÃO · clique para próximo</div>
              <div style={{ color:'#888', fontSize:11 }}>{fact?.fact}</div>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
            {[
              { l:'CONSUMIDO', v:totalKcal, c:pctColor, suf:'kcal' },
              { l:'META (TDEE)', v:tdee, c:R, suf:'kcal' },
              { l:'SALDO', v:tdee-totalKcal, c: tdee-totalKcal>=0?S:'#ff6b6b', suf:'kcal' },
              { l:'REFEIÇÕES', v:mealsWithFood, c:R2, suf:`/ ${MEALS.length}` },
            ].map(s => (
              <NeonCard key={s.l} color={s.c} style={{ padding:'16px', textAlign:'center' }}>
                <div style={{ color:s.c, fontSize:22, fontWeight:700 }}>{s.v>0&&s.l==='SALDO'?'+':''}{s.v.toLocaleString('pt-BR')}<span style={{ fontSize:10, color:'#555' }}> {s.suf}</span></div>
                <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginTop:6 }}>{s.l}</div>
              </NeonCard>
            ))}
          </div>

          {/* Progress bar */}
          <NeonCard color={pctColor} style={{ padding:'16px 20px', marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontFamily:'monospace', fontSize:11 }}>
              <span style={{ color:'#888' }}>Consumo vs Meta</span>
              <span style={{ color:pctColor }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ height:8, background:'#111', borderRadius:4, overflow:'hidden' }}>
              <div style={{ width:`${Math.min(pct,100)}%`, height:8, background:`linear-gradient(90deg,${pctColor}70,${pctColor})`, boxShadow:`0 0 10px ${pctColor}50`, transition:'width 0.8s ease', borderRadius:4 }} />
            </div>
            {pct > 100 && <div style={{ color:R2, fontSize:10, marginTop:6 }}>⚠ Meta calórica excedida em {totalKcal-tdee} kcal</div>}
          </NeonCard>

          {/* Checklist de planos do dia */}
          {totalCount > 0 && (
            <NeonCard color={R} style={{ padding:'16px 20px', marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div>
                  <div style={{ color:'#d0d0d0', fontSize:15, fontWeight:700 }}>Plano do dia</div>
                  <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:doneCount===totalCount?G:R2, fontSize:28, fontWeight:700, lineHeight:1 }}>{doneCount}/{totalCount}</div>
                  <div style={{ color:'#444', fontSize:9, letterSpacing:1 }}>CONCLUÍDAS</div>
                </div>
              </div>
              <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:3 }}>
                <div style={{ width:`${(doneCount/totalCount)*100}%`, height:'100%', background:doneCount===totalCount?G:R, borderRadius:3, transition:'width 0.4s' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                {todayPlans.map(plan => {
                  const done = !!checkedMap[plan.id]
                  const saving = savingId === plan.id
                  return (
                    <div key={plan.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <div onClick={() => !saving && handleToggle(plan)}
                        style={{ width:28, height:28, borderRadius:7, flexShrink:0, border:`2px solid ${done?G:R+'40'}`, background:done?`${G}20`:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:saving?'wait':'pointer', transition:'all 0.2s', fontSize:15 }}>
                        {saving ? '…' : done ? '✓' : ''}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div>
                            <div style={{ color:done?G:'#e0e0e0', fontSize:14, fontWeight:700, textDecoration:done?'line-through':'none' }}>{plan.name}</div>
                            <div style={{ display:'flex', gap:8, marginTop:2 }}>
                              {plan.meal_type && <span style={{ color:'#555', fontSize:11 }}>🕐 {plan.meal_type}</span>}
                              {plan.time && <span style={{ color:R2, fontSize:11, fontWeight:700 }}>{plan.time}</span>}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={(e)=>{e.stopPropagation(); setFormPlan({...plan}); setTab('adicionar')}} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:14, padding:'0 4px' }}>✎</button>
                            <button onClick={(e)=>{e.stopPropagation(); handleDeletePlan(plan.id)}} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:14, padding:'0 4px' }}>🗑</button>
                          </div>
                        </div>
                        {plan.description && <div style={{ color:'#666', fontSize:11, marginTop:4 }}>{plan.description}</div>}
                        {(plan.calories||plan.protein||plan.carbs||plan.fat) && (
                          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                            {[{l:'Kcal',v:plan.calories,c:R2},{l:'Prot',v:plan.protein?`${plan.protein}g`:null,c:'#818cf8'},{l:'Carbs',v:plan.carbs?`${plan.carbs}g`:null,c:'#f59e0b'},{l:'Gord',v:plan.fat?`${plan.fat}g`:null,c:S}].filter(m=>m.v).map(m=>(
                              <span key={m.l} style={{ padding:'2px 8px', borderRadius:4, background:`${m.c}0f`, border:`1px solid ${m.c}20`, color:m.c, fontSize:10, fontFamily:'monospace' }}>{m.l}: {m.v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </NeonCard>
          )}

          {/* Meal cards (alimentos por refeição) */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:18 }}>
            {byMeal.map(m => (
              <NeonCard key={m.id} color={m.color} style={{ padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div>
                    <span style={{ fontSize:16, marginRight:8 }}>{m.icon}</span>
                    <span style={{ color:m.color, fontSize:13, fontWeight:700 }}>{m.label}</span>
                  </div>
                  <span style={{ color:m.color, fontSize:14, fontWeight:700 }}>{m.total} kcal</span>
                </div>
                {m.entries.length === 0
                  ? <div style={{ color:'#333', fontSize:10 }}>Nenhum alimento registrado</div>
                  : m.entries.map(e => (
                    <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ color:'#aaa', fontSize:12 }}>{e.name}</div>
                        {e.note && <div style={{ color:'#444', fontSize:10 }}>{e.note}</div>}
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ color:m.color, fontSize:12, fontWeight:700 }}>{e.calories} kcal</span>
                        <button onClick={() => handleDeleteFood(e.id)} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:12 }}>✕</button>
                      </div>
                    </div>
                  ))
                }
              </NeonCard>
            ))}
          </div>

          <div style={{ textAlign:'center' }}>
            <button className="btn" onClick={() => setModalFood(true)} style={{ padding:'12px 36px', background:'rgba(220,38,38,0.12)', borderColor:R }}>
              + ADICIONAR ALIMENTO
            </button>
          </div>
        </>
      )}

      {/* ── TAB PLANOS ── */}
      {tab === 'planos' && (
        <>
          <div style={{ color:'#555', fontSize:11, marginBottom:14, lineHeight:1.6 }}>
            Sua dieta configurada. Refeições ativas aparecem no checklist diário.
          </div>
          {!plansLoaded ? (
            <div style={{ padding:40, textAlign:'center', color:'#444' }}>Carregando...</div>
          ) : plans.length === 0 ? (
            <NeonCard color={R} style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🍽</div>
              <div style={{ color:'#555', fontSize:13, marginBottom:16 }}>Nenhuma refeição cadastrada.</div>
              <button className="btn" onClick={() => setTab('adicionar')} style={{ background:DIM, borderColor:R, color:R2 }}>+ CRIAR PRIMEIRA REFEIÇÃO</button>
            </NeonCard>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {plans.map(plan => (
                <NeonCard key={plan.id} color={plan.active!==false?R:S} style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ color:'#d0d0d0', fontSize:14, fontWeight:700 }}>{plan.name}</span>
                        {plan.meal_type && <span style={{ color:'#444', fontSize:10 }}>{plan.meal_type}</span>}
                        {plan.time && <span style={{ color:R2, fontSize:11, fontWeight:700 }}>{plan.time}</span>}
                        {plan.active===false && <span style={{ color:'#444', fontSize:9, border:'1px solid #333', padding:'1px 6px', borderRadius:3 }}>INATIVA</span>}
                      </div>
                      {plan.description && <div style={{ color:'#555', fontSize:11, lineHeight:1.5, marginBottom:6 }}>{plan.description}</div>}
                      {(plan.calories||plan.protein||plan.carbs||plan.fat) && (
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                          {plan.calories && <span style={{ color:R2, fontSize:10 }}>{plan.calories} kcal</span>}
                          {plan.protein && <span style={{ color:'#818cf8', fontSize:10 }}>{plan.protein}g prot</span>}
                          {plan.carbs && <span style={{ color:'#f59e0b', fontSize:10 }}>{plan.carbs}g carbs</span>}
                          {plan.fat && <span style={{ color:S, fontSize:10 }}>{plan.fat}g gord</span>}
                        </div>
                      )}
                      <div style={{ color:'#444', fontSize:10 }}>📅 {plan.frequency||'Todos os dias'}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:10 }}>
                      <button onClick={() => { setFormPlan({...plan}); setTab('adicionar') }}
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#666', fontSize:12, padding:'6px 10px', borderRadius:4, cursor:'pointer' }}>✎</button>
                      <button onClick={() => handleDeletePlan(plan.id)}
                        style={{ background:`${R}08`, border:`1px solid ${R}25`, color:R, fontSize:12, padding:'6px 10px', borderRadius:4, cursor:'pointer' }}>🗑</button>
                    </div>
                  </div>
                </NeonCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB ADICIONAR (nova refeição / plano) ── */}
      {tab === 'adicionar' && (
        <NeonCard color={R} style={{ padding:22 }}>
          <SectionTitle color={R}>{formPlan.id ? 'EDITAR REFEIÇÃO' : 'NOVA REFEIÇÃO'}</SectionTitle>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">NOME *</label>
              <input value={formPlan.name} onChange={f('name')} placeholder="ex: Café da manhã pré-treino"
                className="input" style={{ borderColor:`${R}35`, color:'#d0d0d0' }} />
            </div>
            <div>
              <label className="label">TIPO</label>
              <select value={formPlan.meal_type} onChange={f('meal_type')} className="select">
                {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">HORÁRIO</label>
              <input type="time" value={formPlan.time} onChange={f('time')} className="input" style={{ color:R2 }} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">ALIMENTOS / DESCRIÇÃO</label>
              <textarea value={formPlan.description} onChange={f('description')}
                placeholder="ex: 3 ovos, 2 fatias pão integral, 1 banana, café sem açúcar"
                className="input" style={{ height:80, resize:'vertical', lineHeight:1.6 }} />
            </div>

            <div style={{ gridColumn:'1/-1' }}>
              <label className="label" style={{ marginBottom:4 }}>MACROS (OPCIONAL)</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[{k:'calories',l:'KCAL',p:'450'},{k:'protein',l:'PROT (g)',p:'30'},{k:'carbs',l:'CARBS (g)',p:'50'},{k:'fat',l:'GORD (g)',p:'15'}].map(fld => (
                  <div key={fld.k}>
                    <label className="label" style={{ fontSize:9 }}>{fld.l}</label>
                    <input type="number" value={formPlan[fld.k]} onChange={f(fld.k)} placeholder={fld.p} className="input" style={{ padding:'7px 8px' }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label">FREQUÊNCIA</label>
              <select value={formPlan.frequency} onChange={f('frequency')} className="select">
                {FREQ_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'end', paddingBottom:2 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={formPlan.active} onChange={e=>setFormPlan(v=>({...v,active:e.target.checked}))} style={{ accentColor:R, width:16, height:16 }} />
                <span style={{ color:'#666', fontSize:12 }}>Refeição ativa</span>
              </label>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn" onClick={handleSavePlan} disabled={savingPlan}
              style={{ flex:1, background:DIM, borderColor:R, color:R2, padding:13, fontSize:13 }}>
              {savingPlan ? 'Salvando...' : savedPlan ? '✓ Salvo!' : formPlan.id ? '💾 SALVAR EDIÇÃO' : '➕ CRIAR REFEIÇÃO'}
            </button>
            {formPlan.id && (
              <button className="btn" onClick={() => setFormPlan(EMPTY_PLAN)}
                style={{ background:'transparent', borderColor:'rgba(255,255,255,0.1)', color:'#555', padding:'13px 18px' }}>
                Nova
              </button>
            )}
          </div>
        </NeonCard>
      )}

      {/* Modal Adicionar Alimento */}
      {modalFood && (
        <Modal title="ADICIONAR ALIMENTO" color={R} onClose={() => setModalFood(false)}>
          <div style={{ marginBottom:14 }}>
            <label className="label">REFEIÇÃO</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {MEALS.map(m => (
                <button key={m.id} onClick={() => setFormFood(f=>({...f,meal:m.id}))}
                  className="btn" style={{ flex:1, padding:'8px 0', fontSize:10, color:formFood.meal===m.id?m.color:undefined, borderColor:formFood.meal===m.id?`${m.color}60`:undefined, background:formFood.meal===m.id?`${m.color}10`:undefined }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label className="label">ALIMENTO</label>
            <input value={formFood.name} onChange={e=>setFormFood(f=>({...f,name:e.target.value}))} placeholder="Nome do alimento..." className="input" />
          </div>

          <div style={{ marginBottom:12 }}>
            <label className="label">CALORIAS (kcal)</label>
            <input type="number" value={formFood.calories} onChange={e=>setFormFood(f=>({...f,calories:e.target.value}))} placeholder="ex: 250" className="input" />
            <div style={{ color:'#444', fontSize:10, marginTop:4 }}>Consulte a embalagem ou use a tabela abaixo</div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginBottom:8 }}>ALIMENTOS COMUNS · CLIQUE</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, maxHeight:160, overflow:'auto' }}>
              {COMMON_FOODS.map(f => (
                <div key={f.name} onClick={() => setFormFood(fm=>({...fm, name:f.name, calories:f.kcal}))}
                  style={{ padding:'6px 10px', borderRadius:5, border:'1px solid #ffffff08', background:'rgba(255,255,255,0.02)', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,0.08)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
                  <div style={{ color:'#aaa', fontSize:11 }}>{f.name}</div>
                  <div style={{ color:R, fontSize:11, fontWeight:700 }}>{f.kcal} kcal</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label className="label">OBSERVAÇÕES (opcional)</label>
            <input value={formFood.note} onChange={e=>setFormFood(f=>({...f,note:e.target.value}))} placeholder="ex: 2 fatias, com manteiga..." className="input" />
          </div>

          <button className="btn" onClick={handleAddFood} style={{ width:'100%', background:'rgba(220,38,38,0.15)', borderColor:R }}>
            ADICIONAR
          </button>
        </Modal>
      )}
    </div>
  )
}
