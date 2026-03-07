import { useState, useEffect, useRef } from 'react'
import { NeonCard } from '../components/UI'
import { supabase } from '../lib/supabase'
import { getSleepLog, getBioLog, getCalendar, today } from '../lib/db'

const GROQ_KEY   = import.meta.env.VITE_GROQ_KEY
const R          = '#dc2626'
const R2         = '#ef4444'
const S          = '#94a3b8'
const FREE_LIMIT = 5

function storageKey(userId) { return `chat_sessions_${userId}` }
function loadSessions(userId) {
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]') } catch { return [] }
}
function saveSessions(userId, sessions) {
  localStorage.setItem(storageKey(userId), JSON.stringify(sessions.slice(0, 30)))
}
function getTodayUsage() { return parseInt(localStorage.getItem(`chat_usage_${today()}`) || '0', 10) }
function incrementUsage() { localStorage.setItem(`chat_usage_${today()}`, String(getTodayUsage() + 1)) }

function groupByDate(sessions) {
  const groups = {}
  sessions.forEach(s => { const d = s.date || today(); if (!groups[d]) groups[d] = []; groups[d].push(s) })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00'), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function parseWorkout(content) {
  const match = content.match(/\[TREINO_JSON\]([\s\S]*?)\[\/TREINO_JSON\]/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}
function stripWorkoutJson(content) {
  return content.replace(/\[TREINO_JSON\][\s\S]*?\[\/TREINO_JSON\]/g, '').trim()
}

async function saveWorkoutToLog(userId, workout) {
  const exercises = (workout.exercicios || []).map(ex => ({
    id:     ex.nome.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
    name:   ex.nome,
    sets:   ex.series || 3,
    reps:   ex.reps   || '8-12',
    weight: null,
    done:   false,
    rir:    ex.rir    || '',
    rest:   ex.descanso || '',
    tip:    ex.dica   || '',
    source: 'ia',
  }))
  const { error } = await supabase.from('workout_logs').insert({
    id:           `ia_${Date.now()}`,
    user_id:      userId,
    date:         today(),
    day_name:     workout.nome || 'Treino IA',
    program_name: 'Treino IA',
    exercises,
    completed:    false,
  })
  if (error) throw error
}

const SUGGESTIONS_FREE = [
  '💪 Quero montar um treino de hoje',
  'Quanto tempo descansar entre séries?',
  'O que é déficit calórico?',
  'Quantas proteínas devo comer por dia?',
]
const SUGGESTIONS_PRO = [
  '💪 Quero montar um treino de hoje',
  'Como tá minha evolução recente?',
  'O que minha bioimpedância indica?',
  'Faz um checkin da minha semana',
]

export default function Chat({ user, userId }) {
  const isPro     = user?.isPro || false
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const [sessions,    setSessions]    = useState([])
  const [currentId,   setCurrentId]   = useState(null)
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [usage,       setUsage]       = useState(0)
  const [profile,     setProfile]     = useState(null)
  const [ctxLoaded,   setCtxLoaded]   = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const remaining = FREE_LIMIT - usage
  const limitHit  = !isPro && usage >= FREE_LIMIT

  useEffect(() => {
    if (!userId) return
    setUsage(getTodayUsage())
    const saved = loadSessions(userId)
    setSessions(saved)
    openWelcome()
  }, [userId])

  useEffect(() => {
    if (isPro && userId && !ctxLoaded) loadContext()
  }, [isPro, userId])

  function openWelcome() {
    setCurrentId(null)
    setMessages([{
      role: 'assistant',
      content: isPro
        ? `Olá, ${user?.name || 'atleta'}! 💪 Sou seu assistente PRO. Tenho acesso aos seus dados e posso te ajudar com treinos, dieta e análise do progresso.`
        : `Olá! 👋 Sou o Health Assistant. Posso responder dúvidas sobre treino, nutrição e saúde.\n\n💡 Plano FREE: ${FREE_LIMIT} mensagens por dia. Assine o PRO para ilimitado + análise dos seus dados.`,
    }])
    setSidebarOpen(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  function loadSession(session) {
    setCurrentId(session.id)
    setMessages(session.messages?.length ? session.messages : [{ role: 'assistant', content: 'Conversa vazia.' }])
    setSidebarOpen(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function deleteSession(id, e) {
    e.stopPropagation()
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    saveSessions(userId, updated)
    if (currentId === id) openWelcome()
  }

  async function loadContext() {
    try {
      const [sleepLogs, bioLog, calendar] = await Promise.all([
        getSleepLog(userId, 7).catch(() => []),
        getBioLog(userId, 1).catch(() => []),
        getCalendar(userId).catch(() => []),
      ])
      const avgSleep = sleepLogs.length ? (sleepLogs.reduce((s, e) => s + +e.hours, 0) / sleepLogs.length).toFixed(1) : null
      const lastBio  = bioLog[0] ? { gordura: bioLog[0].body_fat, musculo: bioLog[0].muscle_mass, visceral: bioLog[0].visceral_fat, agua: bioLog[0].water_pct } : null
      const now = new Date()
      const thisWeek = calendar.filter(e => (now - new Date(e.date)) / 86400000 <= 7)
      const weeklyStats    = `${thisWeek.filter(e=>e.type==='workout').length} treinos, ${thisWeek.filter(e=>e.type==='cardio').length} cardios, ${thisWeek.filter(e=>e.type==='sleep').length} noites`
      const recentWorkouts = calendar.filter(e=>e.type==='workout'||e.type==='cardio').slice(0,5).map(e=>`${e.date}: ${e.type}${e.note?` (${e.note})`:''}`).join(' | ') || null

      // Músculos já treinados essa semana (via treinos IA no localStorage)
      const aiWorkouts = (() => { try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] } })()
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const weekMuscles = aiWorkouts
        .filter(w => w.date >= sevenDaysAgo)
        .map(w => `${w.date}: ${w.nome} (${w.foco || w.exercicios?.map(e=>e.nome).join(', ')})`)
        .join(' | ') || null

      setProfile({ name:user?.name, age:user?.age, sex:user?.sex, weight:user?.weight, height:user?.height, goal:user?.goal, activity:user?.activity, avgSleep, lastBio, weeklyStats, recentWorkouts, weekMuscles })
    } catch(e) { console.error(e) }
    setCtxLoaded(true)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading || limitHit) return
    setInput('')
    if (!isPro) { incrementUsage(); setUsage(getTodayUsage()) }

    let sessionId = currentId
    const sessionTitle = msg.slice(0, 35) + (msg.length > 35 ? '...' : '')
    if (!sessionId) { sessionId = Date.now().toString(); setCurrentId(sessionId) }

    const newMsgs = [...messages, { role: 'user', content: msg }]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const systemPrompt = isPro && profile ? buildProPrompt(profile, msg) : buildFreePrompt()
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 900,
          messages: [{ role: 'system', content: systemPrompt }, ...newMsgs.slice(-12)],
        }),
      })
      const data = await res.json()
      if (data?.error) throw new Error(data.error?.message || 'Erro da API')
      const reply     = data?.choices?.[0]?.message?.content ?? 'Sem resposta.'
      const finalMsgs = [...newMsgs, { role: 'assistant', content: reply }]
      setMessages(finalMsgs)

      setSessions(prev => {
        const existing = prev.find(s => s.id === sessionId)
        const updated  = existing
          ? prev.map(s => s.id === sessionId ? { ...s, messages: finalMsgs } : s)
          : [{ id: sessionId, title: sessionTitle, date: today(), messages: finalMsgs }, ...prev]
        saveSessions(userId, updated)
        return updated
      })
    } catch(e) {
      console.error(e)
      setMessages(m => [...m, { role: 'assistant', content: `❌ ${e.message || 'Erro de conexão.'}` }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const suggestions     = isPro ? SUGGESTIONS_PRO : SUGGESTIONS_FREE
  const showSuggestions = messages.length <= 1

  return (
    <div className="animate-fade" style={{ display:'flex', height:'calc(100dvh - 120px)', overflow:'hidden' }}>

      {/* SIDEBAR */}
      <div style={{ width:sidebarOpen?210:0, minWidth:sidebarOpen?210:0, transition:'all 0.25s ease', overflow:'hidden', background:'#060606', borderRight:sidebarOpen?'1px solid rgba(220,38,38,0.08)':'none', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'10px 8px', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
          <button onClick={openWelcome} style={{ width:'100%', padding:'8px 0', background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:5, color:R2, fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, cursor:'pointer' }}>
            + NOVO CHAT
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'6px 5px' }}>
          {sessions.length === 0 && <div style={{ color:'#222', fontSize:10, textAlign:'center', padding:20 }}>Sem histórico ainda</div>}
          {groupByDate(sessions).map(([date, group]) => (
            <div key={date}>
              <div style={{ color:'#252525', fontSize:8, letterSpacing:2, padding:'8px 6px 3px', textTransform:'uppercase' }}>{formatDateLabel(date)}</div>
              {group.map(session => (
                <div key={session.id} onClick={() => loadSession(session)}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 7px', borderRadius:5, marginBottom:2, cursor:'pointer', background:currentId===session.id?'rgba(220,38,38,0.08)':'transparent', border:`1px solid ${currentId===session.id?'rgba(220,38,38,0.18)':'transparent'}`, transition:'all 0.15s' }}
                  onMouseEnter={e=>{ if(currentId!==session.id) e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
                  onMouseLeave={e=>{ if(currentId!==session.id) e.currentTarget.style.background='transparent' }}>
                  <span style={{ color:currentId===session.id?'#bbb':'#444', fontSize:11, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.4 }}>
                    {session.title}
                  </span>
                  <button onClick={e => deleteSession(session.id, e)}
                    style={{ background:'none', border:'none', color:'#252525', cursor:'pointer', fontSize:14, padding:0, lineHeight:1, flexShrink:0 }}
                    onMouseEnter={e=>e.currentTarget.style.color=R}
                    onMouseLeave={e=>e.currentTarget.style.color='#252525'}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

        {/* Header */}
        <div style={{ marginBottom:14, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={() => setSidebarOpen(o=>!o)}
                style={{ background:sidebarOpen?'rgba(220,38,38,0.08)':'transparent', border:`1px solid ${sidebarOpen?'rgba(220,38,38,0.25)':'rgba(255,255,255,0.06)'}`, borderRadius:5, padding:'6px 10px', color:sidebarOpen?R2:'#444', cursor:'pointer', fontSize:14, transition:'all 0.15s', flexShrink:0 }}>
                ☰
              </button>
              <div>
                <div style={{ color:R, fontSize:18, letterSpacing:4, fontWeight:700 }}>
                  ASSISTENTE {isPro && <span style={{ fontSize:10, background:'rgba(220,38,38,0.12)', border:`1px solid ${R}30`, padding:'2px 7px', borderRadius:3, letterSpacing:2, verticalAlign:'middle' }}>PRO</span>}
                </div>
                <div style={{ color:'#282828', fontSize:9, letterSpacing:2, marginTop:2 }}>HEALTH AI · LLAMA 3.3 VIA GROQ</div>
              </div>
            </div>
            {!isPro && (
              <div style={{ textAlign:'right' }}>
                <div style={{ color:remaining>0?S:R2, fontSize:18, fontWeight:700 }}>{Math.max(remaining,0)}</div>
                <div style={{ color:'#2a2a2a', fontSize:9, letterSpacing:1 }}>MSG/DIA</div>
              </div>
            )}
          </div>
          {!isPro && (
            <div style={{ height:3, background:'#0d0d0d', borderRadius:2, marginTop:10, overflow:'hidden' }}>
              <div style={{ width:`${(usage/FREE_LIMIT)*100}%`, height:'100%', background:remaining>1?R:R2, borderRadius:2, transition:'width 0.4s' }} />
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, paddingBottom:8 }}>
          {messages.map((m, i) => {
            const workout        = m.role==='assistant' ? parseWorkout(m.content) : null
            const displayContent = workout ? stripWorkoutJson(m.content) : m.content
            return (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'88%', padding:'10px 14px', borderRadius:m.role==='user'?'12px 12px 2px 12px':'12px 12px 12px 2px', background:m.role==='user'?'rgba(220,38,38,0.1)':'rgba(255,255,255,0.02)', border:`1px solid ${m.role==='user'?'rgba(220,38,38,0.2)':'rgba(255,255,255,0.04)'}`, color:m.role==='user'?'#f0f0f0':'#d0d0d0', fontSize:13, lineHeight:1.75, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {m.role==='assistant' && <div style={{ color:R, fontSize:9, letterSpacing:2, marginBottom:5, fontWeight:700 }}>◈ HEALTH AI</div>}
                  {displayContent}
                </div>
                {workout && <WorkoutSaveCard workout={workout} userId={userId} />}
              </div>
            )
          })}

          {loading && (
            <div style={{ display:'flex', justifyContent:'flex-start' }}>
              <div style={{ padding:'10px 16px', borderRadius:'12px 12px 12px 2px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display:'flex', gap:5 }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:R, opacity:0.7, animation:`ping 1s ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}

          {limitHit && (
            <NeonCard color={R} style={{ padding:'16px 20px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:8 }}>🔒</div>
              <div style={{ color:'#d0d0d0', fontSize:13, fontWeight:700, marginBottom:4 }}>Limite diário atingido</div>
              <div style={{ color:'#555', fontSize:11, marginBottom:14 }}>Assine o PRO para mensagens ilimitadas + análise dos seus dados.</div>
              <button className="btn" onClick={()=>window.dispatchEvent(new CustomEvent('goto-tab',{detail:'subscription'}))}
                style={{ background:'rgba(220,38,38,0.15)', borderColor:R, color:R2, padding:'10px 24px', fontSize:11, letterSpacing:2 }}>
                VER PLANOS →
              </button>
            </NeonCard>
          )}

          {showSuggestions && !limitHit && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
              <div style={{ color:'#252525', fontSize:9, letterSpacing:2 }}>SUGESTÕES</div>
              {suggestions.map((s,i) => (
                <button key={i} onClick={()=>send(s)}
                  style={{ textAlign:'left', background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.045)', borderRadius:8, padding:'9px 14px', color:'#4a4a4a', fontSize:12, cursor:'pointer', fontFamily:"'Space Mono',monospace", transition:'all 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,38,38,0.07)';e.currentTarget.style.color='#888'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.015)';e.currentTarget.style.color='#4a4a4a'}}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ flexShrink:0, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display:'flex', gap:8 }}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
              placeholder={limitHit?'Limite diário atingido...':'Escreva sua pergunta...'}
              disabled={limitHit||loading} className="input"
              style={{ flex:1, fontSize:13, borderColor:input?'rgba(220,38,38,0.3)':undefined, opacity:limitHit?0.4:1 }} />
            <button onClick={()=>send()} disabled={!input.trim()||loading||limitHit}
              style={{ background:input.trim()&&!limitHit?'rgba(220,38,38,0.18)':'transparent', border:`1px solid ${input.trim()&&!limitHit?R:'#181818'}`, color:input.trim()&&!limitHit?R2:'#1e1e1e', borderRadius:6, padding:'0 16px', cursor:'pointer', fontSize:16, transition:'all 0.15s', flexShrink:0 }}>
              ➤
            </button>
          </div>
          <div style={{ color:'#1e1e1e', fontSize:9, letterSpacing:1, marginTop:6, textAlign:'center' }}>
            {isPro?'MENSAGENS ILIMITADAS · LLAMA 3.3 VIA GROQ':`${Math.max(remaining,0)} DE ${FREE_LIMIT} MENSAGENS RESTANTES HOJE`}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkoutSaveCard({ workout, userId }) {
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSave() {
    setSaving(true); setError('')

    // 1. Salva no localStorage (principal — AIWorkoutBanner usa só isso)
    const enriched = { ...workout, id: `ai_${Date.now()}`, date: today() }
    const existing = (() => { try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] } })()
    localStorage.setItem('healthos_ai_workouts', JSON.stringify([enriched, ...existing].slice(0, 10)))

    // 2. Dispara evento para o banner aparecer em tempo real
    window.dispatchEvent(new CustomEvent('ai-workout-ready', { detail: enriched }))

    setSaved(true)
    setSaving(false)

    // 3. Tenta salvar no Supabase em segundo plano (não bloqueia)
    saveWorkoutToLog(userId, workout).catch(e => console.warn('Supabase workout log:', e))
  }

  return (
    <div style={{ maxWidth:'88%', marginTop:8, padding:'14px 16px', borderRadius:10, background:'rgba(220,38,38,0.04)', border:'1px solid rgba(220,38,38,0.15)' }}>
      <div style={{ color:R, fontSize:9, letterSpacing:2, fontWeight:700, marginBottom:10 }}>💪 TREINO GERADO PELA IA</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ color:'#d0d0d0', fontSize:14, fontWeight:700 }}>{workout.nome}</div>
          {workout.foco && <div style={{ color:'#444', fontSize:11, marginTop:2 }}>🎯 {workout.foco}</div>}
        </div>
        {workout.duracao && <div style={{ color:R2, fontSize:11, fontWeight:700, flexShrink:0 }}>⏱ {workout.duracao}</div>}
      </div>
      {workout.exercicios?.map((ex, i) => (
        <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
            <div style={{ color:'#bbb', fontSize:12, fontWeight:700, flex:1 }}>{ex.nome}</div>
            <div style={{ color:R2, fontSize:11, fontWeight:700, flexShrink:0 }}>{ex.series}×{ex.reps}</div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:3 }}>
            {ex.rir      && <span style={{ color:'#383838', fontSize:10 }}>📊 {ex.rir}</span>}
            {ex.descanso && <span style={{ color:'#383838', fontSize:10 }}>⏸ {ex.descanso}</span>}
          </div>
          {ex.dica && <div style={{ color:'#303030', fontSize:10, marginTop:3, fontStyle:'italic' }}>💡 {ex.dica}</div>}
        </div>
      ))}
      {workout.observacoes && <div style={{ color:'#2e2e2e', fontSize:11, marginTop:10, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.04)' }}>📝 {workout.observacoes}</div>}
      {error && <div style={{ color:R2, fontSize:11, marginTop:8 }}>{error}</div>}
      <button onClick={handleSave} disabled={saving||saved}
        style={{ marginTop:12, width:'100%', padding:'11px 0', borderRadius:6, border:`1px solid ${saved?'#22c55e':R}`, background:saved?'rgba(34,197,94,0.07)':'rgba(220,38,38,0.08)', color:saved?'#22c55e':R2, fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, cursor:saved?'default':'pointer', transition:'all 0.3s' }}>
        {saving?'SALVANDO...':saved?'✓ SALVO NA ABA TREINOS!':'💾 SALVAR NA ABA TREINOS'}
      </button>
    </div>
  )
}

// ── Context router: inject only what's relevant ──────────────────────────────
function routeContext(message, p) {
  const m = (message||'').toLowerCase()
  const isW = /treino|exerc|musculo|serie|supino|agach|pull|push|leg|peito|costas|ombro|bra.o|perna|panturrilha|b.ceps|tr.ceps/.test(m)
  const isD = /dieta|caloria|prote.na|carboidrato|refei..o|comer|card.pio|nutri|emagrec/.test(m)
  const isC = /checkin|check.in|evolu..o|progresso|semana|bioimpedância|sono|an.lise/.test(m)
  const base = `- Nome: ${p.name||'—'} | Objetivo: ${p.goal||'—'}`
  const bmr  = p.sex==='male' ? 88.36+13.4*(p.weight||70)+4.8*(p.height||170)-5.7*(p.age||30) : 447.6+9.2*(p.weight||70)+3.1*(p.height||170)-4.3*(p.age||30)
  const tdee = Math.round(bmr*(p.activity||1.55))
  if (isW) return [base,
    `- Peso: ${p.weight||'—'}kg | Altura: ${p.height||'—'}cm`,
    p.weeklyStats    ? `- Esta semana: ${p.weeklyStats}` : '',
    p.recentWorkouts ? `- Treinos recentes: ${p.recentWorkouts}` : '',
    p.weekMuscles    ? `- Treinos IA esta semana: ${p.weekMuscles}` : '',
  ].filter(Boolean).join('\n')
  if (isD) return [base,
    `- Peso: ${p.weight||'—'}kg | TMB: ~${Math.round(bmr)} kcal | TDEE: ~${tdee} kcal`,
    p.lastBio ? `- Bioimpedância: gordura ${p.lastBio.gordura||'?'}%, músculo ${p.lastBio.musculo||'?'}%` : '',
  ].filter(Boolean).join('\n')
  if (isC) return [base,
    `- Peso: ${p.weight||'—'}kg | TMB: ~${Math.round(bmr)} kcal | TDEE: ~${tdee} kcal`,
    p.avgSleep       ? `- Sono médio (7d): ${p.avgSleep}h` : '',
    p.lastBio        ? `- Bioimpedância: gordura ${p.lastBio.gordura||'?'}%, músculo ${p.lastBio.musculo||'?'}%, visceral ${p.lastBio.visceral||'?'}, água ${p.lastBio.agua||'?'}%` : '',
    p.weeklyStats    ? `- Esta semana: ${p.weeklyStats}` : '',
    p.weekMuscles    ? `- Treinos IA esta semana: ${p.weekMuscles}` : '',
  ].filter(Boolean).join('\n')
  return base
}

const SCIENCE_BASE = `FUNDAMENTOS CIENTÍFICOS DE HIPERTROFIA:
1. SOBRECARGA PROGRESSIVA — progrida em carga, reps ou execução toda semana.
2. PROXIMIDADE DA FALHA (RIR 1-3) — pare a 1-3 reps da falha. Falha total só na última série.
3. VOLUME — 10-20 séries/semana por grupo. 2x/semana = 5-6 séries/sessão. 1x = 8-12/sessão.
4. ROM COMPLETO — ponto de maior alongamento = maior estímulo anabólico.
5. EXERCÍCIOS — composto livre (base) + máquinas/cabos (isolamento estável).
6. DESCANSO — compostos 2-4 min | isoladores 90s-2 min.`

const JSON_RULE = `REGRA DO JSON:
- Gere [TREINO_JSON] SOMENTE quando o treino estiver 100% definido.
- Durante perguntas ou sugestão de divisão: responda APENAS em texto, sem JSON.
- O bloco deve ser completo e válido do início ao fim:
[TREINO_JSON]
{"nome":"Push A — Peito, Ombro, Tríceps","duracao":"55-70 min","foco":"Peito, Ombro, Tríceps","exercicios":[{"nome":"Supino Reto com Barra","series":4,"reps":"6-10","rir":"RIR 2","descanso":"2-3 min","dica":"Desça até alongamento total, cotovelos a 45°"},{"nome":"Crucifixo no Cabo","series":3,"reps":"12-15","rir":"RIR 1","descanso":"90s","dica":"Abertura máxima = maior ponto de crescimento"}],"observacoes":"Volume para 2x/semana. Progrida toda semana."}
[/TREINO_JSON]`

function buildFreePrompt() {
  return `Você é o Health Assistant do Health OS, app brasileiro de saúde e fitness.
Responda SEMPRE em português brasileiro. Direto e prático.
Respostas conversacionais: máximo 3 parágrafos. Ao gerar treino: sem limite de tamanho, gere completo.

${SCIENCE_BASE}

PROTOCOLO PARA TREINOS — faça estas 3 perguntas em uma única mensagem antes de montar:
"Para montar o melhor treino pra você, preciso de 3 informações:
1️⃣ Divisão: A) Push/Pull/Legs  B) Upper/Lower  C) Full Body  D) ABC  E) Me sugira uma
2️⃣ Músculo(s) de hoje: Ex: Peito+Tríceps | Costas+Bíceps | Pernas | Ombros
3️⃣ Frequência: vai treinar esses músculos mais alguma vez essa semana?"

Se o usuário escolher "E) Me sugira": sugira a divisão em texto, confirme com ele e SÓ ENTÃO monte com JSON.
Só gere o treino após ter as 3 respostas confirmadas.

${JSON_RULE}

Quando relevante, mencione que o PRO oferece análise personalizada baseada nos dados reais do usuário.`
}

function buildProPrompt(p, lastMessage) {
  const ctx = routeContext(lastMessage || '', p)
  const isW = /treino|exerc|musculo|serie|supino|agach|pull|push|leg|peito|costas|ombro|perna/.test((lastMessage||'').toLowerCase())

  return `Você é o Health Assistant PRO do Health OS — personal trainer e nutricionista virtual de ${p.name||'seu atleta'}.
Responda SEMPRE em português brasileiro. Direto, prático e personalizado.
Respostas conversacionais: conciso. Ao gerar treino: sem limite, gere completo.

CONTEXTO RELEVANTE PARA ESTA RESPOSTA:
${ctx}

${SCIENCE_BASE}

${isW ? `MODO TREINO PRO:
Você tem acesso ao histórico acima. NÃO faça as 3 perguntas básicas — o usuário espera que você já saiba.
Fluxo:
1. Analise os treinos recentes e identifique quais grupos musculares já foram trabalhados e há quantos dias.
2. Sugira proativamente o treino de hoje com base no descanso ideal de cada grupo muscular.
3. Justifique a escolha em 1-2 frases ("Seus últimos treinos foram X, então hoje o foco ideal é Y porque Z descansou N dias").
4. Se precisar de uma preferência específica (ex: equipamento disponível), faça MÁXIMO 1 pergunta direta.
5. Com informação suficiente, monte o treino completo com JSON.` : ''}

${JSON_RULE}

Não invente dados ausentes. Use apenas o contexto injetado acima.`
}