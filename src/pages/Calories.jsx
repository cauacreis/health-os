import { useState } from 'react'
import { NeonCard, SectionTitle, Modal } from '../components/UI'
import { getFoodLog, addFoodEntry, deleteFoodEntry, today, updateUser } from '../lib/storage'
import { FUN_FACTS } from '../data/funfacts'

const MEALS = [
  { id:'breakfast', label:'Café da Manhã', icon:'🌅', color:'#94a3b8' },
  { id:'lunch',     label:'Almoço',        icon:'☀️', color:'#dc2626' },
  { id:'dinner',    label:'Jantar',        icon:'🌙', color:'#94a3b8' },
  { id:'snack',     label:'Lanche',        icon:'🍎', color:'#ef4444' },
]

const COMMON_FOODS = [
  { name:'Arroz cozido (100g)',    kcal:128 }, { name:'Feijão cozido (100g)', kcal:77  },
  { name:'Frango grelhado (100g)', kcal:165 }, { name:'Ovo cozido',           kcal:77  },
  { name:'Batata doce (100g)',     kcal:86  }, { name:'Aveia (40g)',           kcal:148 },
  { name:'Banana média',           kcal:89  }, { name:'Maçã média',            kcal:72  },
  { name:'Pão integral (fatia)',   kcal:69  }, { name:'Whey protein (30g)',    kcal:120 },
  { name:'Azeite (colher sopa)',   kcal:119 }, { name:'Leite integral (200ml)',kcal:122 },
]

export default function Calories({ user, onUpdate }) {
  const [foodLog, setFoodLog] = useState(() => getFoodLog(user.id, today()))
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', calories:'', meal:'breakfast', note:'' })
  const [mealFilter, setMealFilter] = useState('all')
  const [factIdx, setFactIdx] = useState(0)

  const bmr = user.sex==='male' ? 88.36+13.4*user.weight+4.8*user.height-5.7*user.age : 447.6+9.2*user.weight+3.1*user.height-4.3*user.age
  const tdee = Math.round(bmr * (user.activity||1.55))
  const fact = FUN_FACTS.filter(f=>f.category==='Nutrição')[factIdx % FUN_FACTS.filter(f=>f.category==='Nutrição').length]

  function refresh() { setFoodLog(getFoodLog(user.id, today())) }

  function handleAdd() {
    if (!form.name || !form.calories) return
    addFoodEntry(user.id, { name:form.name, calories:+form.calories, meal:form.meal, note:form.note })
    refresh()
    setForm({ name:'', calories:'', meal:'breakfast', note:'' })
    setModal(false)
  }

  function handleDelete(id) {
    deleteFoodEntry(user.id, id)
    refresh()
  }

  const totalKcal = foodLog.reduce((s,e) => s+e.calories, 0)
  const filtered = mealFilter==='all' ? foodLog : foodLog.filter(e=>e.meal===mealFilter)

  const byMeal = MEALS.map(m => ({
    ...m,
    entries: foodLog.filter(e=>e.meal===m.id),
    total: foodLog.filter(e=>e.meal===m.id).reduce((s,e)=>s+e.calories,0),
  }))

  const pct = Math.min((totalKcal/tdee)*100, 110)
  const pctColor = pct < 80 ? '#94a3b8' : pct < 100 ? '#dc2626' : pct < 110 ? '#ef4444' : '#ff6b6b'

  return (
    <div className="animate-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#dc2626', fontSize:22, letterSpacing:4, fontWeight:700 }}>CALORIAS & NUTRIÇÃO</div>
        <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginTop:4 }}>CONTROLE ALIMENTAR DIÁRIO</div>
      </div>

      {/* Fun fact */}
      <div onClick={() => setFactIdx(i=>i+1)} style={{ padding:'10px 14px', borderRadius:8, background:'rgba(148,163,184,0.04)', border:'1px solid rgba(148,163,184,0.1)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>{fact.icon}</span>
        <div>
          <div style={{ color:'#94a3b8', fontSize:9, letterSpacing:2, marginBottom:2 }}>💡 NUTRIÇÃO · clique para próximo</div>
          <div style={{ color:'#888', fontSize:11 }}>{fact.fact}</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { l:'CONSUMIDO', v:totalKcal, c:pctColor, suf:'kcal' },
          { l:'META (TDEE)', v:tdee, c:'#dc2626', suf:'kcal' },
          { l:'SALDO', v:tdee-totalKcal, c: tdee-totalKcal>=0?'#94a3b8':'#ff6b6b', suf:'kcal' },
          { l:'REFEIÇÕES', v:byMeal.filter(m=>m.entries.length>0).length, c:'#ef4444', suf:`/ ${MEALS.length}` },
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
        {pct > 100 && <div style={{ color:'#ef4444', fontSize:10, marginTop:6 }}>⚠ Meta calórica excedida em {totalKcal-tdee} kcal</div>}
      </NeonCard>

      {/* Meal cards */}
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
                    <button onClick={() => handleDelete(e.id)} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:12 }}>✕</button>
                  </div>
                </div>
              ))
            }
          </NeonCard>
        ))}
      </div>

      <div style={{ textAlign:'center' }}>
        <button className="btn" onClick={() => setModal(true)} style={{ padding:'12px 36px', background:'rgba(220,38,38,0.12)', borderColor:'#dc2626' }}>
          + ADICIONAR ALIMENTO
        </button>
      </div>

      {modal && (
        <Modal title="ADICIONAR ALIMENTO" color="#dc2626" onClose={() => setModal(false)}>
          <div style={{ marginBottom:14 }}>
            <label className="label">REFEIÇÃO</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {MEALS.map(m => (
                <button key={m.id} onClick={() => setForm(f=>({...f,meal:m.id}))}
                  className="btn" style={{ flex:1, padding:'8px 0', fontSize:10, color:form.meal===m.id?m.color:undefined, borderColor:form.meal===m.id?`${m.color}60`:undefined, background:form.meal===m.id?`${m.color}10`:undefined }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label className="label">ALIMENTO</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nome do alimento..." className="input" />
          </div>

          <div style={{ marginBottom:12 }}>
            <label className="label">CALORIAS (kcal)</label>
            <input type="number" value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))} placeholder="ex: 250" className="input" />
            <div style={{ color:'#444', fontSize:10, marginTop:4 }}>Consulte a embalagem ou use a tabela abaixo como referência</div>
          </div>

          {/* Quick picks */}
          <div style={{ marginBottom:14 }}>
            <div style={{ color:'#444', fontSize:9, letterSpacing:2, marginBottom:8 }}>ALIMENTOS COMUNS — CLIQUE PARA PREENCHER</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, maxHeight:160, overflow:'auto' }}>
              {COMMON_FOODS.map(f => (
                <div key={f.name} onClick={() => setForm(fm=>({...fm, name:f.name, calories:f.kcal}))}
                  style={{ padding:'6px 10px', borderRadius:5, border:'1px solid #ffffff08', background:'rgba(255,255,255,0.02)', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,0.08)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
                  <div style={{ color:'#aaa', fontSize:11 }}>{f.name}</div>
                  <div style={{ color:'#dc2626', fontSize:11, fontWeight:700 }}>{f.kcal} kcal</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label className="label">OBSERVAÇÕES (opcional)</label>
            <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="ex: 2 fatias, com manteiga..." className="input" />
          </div>

          <button className="btn" onClick={handleAdd} style={{ width:'100%', background:'rgba(220,38,38,0.15)', borderColor:'#dc2626' }}>
            ADICIONAR
          </button>
        </Modal>
      )}
    </div>
  )
}
