import { useState, useEffect, useRef } from 'react'
import { NeonCard } from '../components/UI'
import { supabase } from '../lib/supabase'
import { getSleepLog, getBioLog, getCalendar, today } from '../lib/db'

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY
const R = '#dc2626'
const R2 = '#ef4444'
const S = '#94a3b8'
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

// ── Detecta menção de dor ou lesão na mensagem do usuário ────────────────────
function detectInjury(msg) {
  const m = msg.toLowerCase()
  return /\bdor\b|doendo|machuc|lesão|lesao|lesionei|torci|torceu|distensão|distensao|inflamou|inflamação|inflam|fratura|luxação|luxacao|joelho ruim|costas ruins|ombro ruim|hérnia|hernia|tendinite|tendinit|bursite|fascite/.test(m)
}

function parseWorkout(content) {
  const match = content.match(/\[TREINO_JSON\]([\s\S]*?)\[\/TREINO_JSON\]/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}
function stripWorkoutJson(content) {
  return content.replace(/\[TREINO_JSON\][\s\S]*?\[\/TREINO_JSON\]/g, '').trim()
}
function parseDiet(content) {
  const match = content.match(/\[DIETA_JSON\]([\s\S]*?)\[\/DIETA_JSON\]/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}
function stripDietJson(content) {
  return content.replace(/\[DIETA_JSON\][\s\S]*?\[\/DIETA_JSON\]/g, '').trim()
}

async function saveWorkoutToLog(userId, workout) {
  const exercises = (workout.exercicios || []).map(ex => ({
    id: ex.nome.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
    name: ex.nome,
    sets: ex.series || 3,
    reps: ex.reps || '8-12',
    weight: null,
    done: false,
    rir: ex.rir || '',
    rest: ex.descanso || '',
    tip: ex.dica || '',
    source: 'ia',
  }))
  const { error } = await supabase.from('workout_logs').insert({
    id: `ia_${Date.now()}`,
    user_id: userId,
    date: today(),
    day_name: workout.nome || 'Treino IA',
    program_name: 'Treino IA',
    exercises,
    completed: false,
  })
  if (error) throw error
}

// ── DietSaveCard ─────────────────────────────────────────────────────────────
function DietSaveCard({ diet, userId }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const G = '#22c55e'

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const { supabase } = await import('../lib/supabase')

      const refeicoes = diet.refeicoes || []
      for (const ref of refeicoes) {
        const { error } = await supabase.from('meal_plans').insert({
          user_id: userId,
          name: ref.nome || 'Refeicao',
          meal_type: ref.tipo || ref.nome || 'Refeicao',
          time: ref.horario || '',
          description: [
            ref.descricao || '',
            (ref.alimentos || []).length > 0 ? (ref.alimentos).join(' · ') : '',
          ].filter(Boolean).join(' — '),
          calories: String(ref.calorias || ''),
          protein: String(ref.proteina || ''),
          carbs: String(ref.carboidrato || ''),
          fat: String(ref.gordura || ''),
          frequency: 'Todos os dias',
          active: true,
        })
        if (error) {
          console.error('meal_plan insert error:', JSON.stringify(error))
          throw error
        }
      }

      window.dispatchEvent(new CustomEvent('diet-plan-saved'))
      setSaved(true)
    } catch (e) {
      setError('Erro: ' + (e?.message || JSON.stringify(e)))
      console.error('DietSave catch:', e)
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '88%', marginTop: 8, background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 10, padding: '14px 16px', alignSelf: 'flex-start' }}>
      <div style={{ color: G, fontSize: 9, letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>🥗 SUGESTÃO ALIMENTAR GERADA</div>

      {(diet.calorias_totais || diet.proteina_total) && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {diet.calorias_totais && <div style={{ textAlign: 'center' }}><div style={{ color: '#22c55e', fontSize: 16, fontWeight: 700 }}>{diet.calorias_totais}</div><div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>KCAL</div></div>}
          {diet.proteina_total && <div style={{ textAlign: 'center' }}><div style={{ color: '#60a5fa', fontSize: 16, fontWeight: 700 }}>{diet.proteina_total}g</div><div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>PROTEÍNA</div></div>}
          {diet.carboidrato_total && <div style={{ textAlign: 'center' }}><div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>{diet.carboidrato_total}g</div><div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>CARBS</div></div>}
          {diet.gordura_total && <div style={{ textAlign: 'center' }}><div style={{ color: '#fb923c', fontSize: 16, fontWeight: 700 }}>{diet.gordura_total}g</div><div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>GORDURA</div></div>}
        </div>
      )}

      {(diet.refeicoes || []).map((ref, i) => (
        <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#d0d0d0', fontSize: 12, fontWeight: 700 }}>{ref.nome}</div>
              {ref.horario && <div style={{ color: '#22c55e', fontSize: 10 }}>{ref.horario}</div>}
            </div>
            {ref.calorias && <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>{ref.calorias} kcal</div>}
          </div>
          {ref.descricao && <div style={{ color: '#555', fontSize: 11, marginTop: 3 }}>{ref.descricao}</div>}
          {ref.alimentos && ref.alimentos.length > 0 && (
            <div style={{ color: '#444', fontSize: 10, marginTop: 4 }}>{ref.alimentos.join(' · ')}</div>
          )}
          {(ref.proteina || ref.carboidrato || ref.gordura) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {ref.proteina && <span style={{ color: '#60a5fa', fontSize: 10 }}>P: {ref.proteina}g</span>}
              {ref.carboidrato && <span style={{ color: '#f59e0b', fontSize: 10 }}>C: {ref.carboidrato}g</span>}
              {ref.gordura && <span style={{ color: '#fb923c', fontSize: 10 }}>G: {ref.gordura}g</span>}
            </div>
          )}
        </div>
      ))}

      {diet.observacoes && <div style={{ color: '#444', fontSize: 11, marginBottom: 10, fontStyle: 'italic' }}>📝 {diet.observacoes}</div>}
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 8 }}>{error}</div>}

      <button onClick={handleSave} disabled={saving || saved}
        style={{ width: '100%', padding: '11px 0', borderRadius: 6, border: `1px solid ${saved ? G : 'rgba(34,197,94,0.3)'}`, background: saved ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.05)', color: saved ? G : '#22c55e', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: saved ? 'default' : 'pointer', transition: 'all 0.3s' }}>
        {saving ? 'SALVANDO...' : saved ? '✓ SALVO EM CALORIAS!' : '💾 SALVAR NA ABA CALORIAS'}
      </button>
    </div>
  )
}

const SUGGESTIONS_FREE = [
  '💪 Quero um exemplo de treino para hoje',
  '🥗 Quero uma sugestão de cardápio',
  'Quanto tempo descansar entre séries?',
  'O que é déficit calórico?',
  'Quantas proteínas devo comer por dia?',
]
const SUGGESTIONS_PRO = [
  '💪 Quero um exemplo de treino para hoje',
  '🥗 Monta uma sugestão de cardápio pra mim',
  'Como tá minha evolução recente?',
  'O que minha bioimpedância indica?',
  'Faz um checkin da minha semana',
]

export default function Chat({ user, userId }) {
  const isPro = user?.isPro || false
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const [sessions, setSessions] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState(0)
  const [profile, setProfile] = useState(null)
  const [ctxLoaded, setCtxLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const remaining = FREE_LIMIT - usage
  const limitHit = !isPro && usage >= FREE_LIMIT

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
        ? `Olá, ${user?.name || 'atleta'}! 💪 Sou seu assistente PRO. Tenho acesso aos seus dados e posso te ajudar com organização de treinos, sugestões alimentares e análise do progresso.\n\n⚠️ As sugestões têm caráter informativo e não substituem orientação de profissional CREF ou nutricionista.`
        : `Olá! 👋 Sou o Health Assistant. Posso te ajudar com dúvidas sobre treino, nutrição e saúde.\n\n💡 Plano FREE: ${FREE_LIMIT} mensagens por dia. Assine o PRO para ilimitado + análise dos seus dados.\n\n⚠️ As sugestões têm caráter informativo e não substituem orientação profissional.`,
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
      const lastBio = bioLog[0] ? { gordura: bioLog[0].body_fat, musculo: bioLog[0].muscle_mass, visceral: bioLog[0].visceral_fat, agua: bioLog[0].water_pct } : null
      const now = new Date()
      const thisWeek = calendar.filter(e => (now - new Date(e.date)) / 86400000 <= 7)
      const weeklyStats = `${thisWeek.filter(e => e.type === 'workout').length} treinos, ${thisWeek.filter(e => e.type === 'cardio').length} cardios, ${thisWeek.filter(e => e.type === 'sleep').length} noites`
      const recentWorkouts = calendar.filter(e => e.type === 'workout' || e.type === 'cardio').slice(0, 5).map(e => `${e.date}: ${e.type}${e.note ? ` (${e.note})` : ''}`).join(' | ') || null

      const aiWorkouts = (() => { try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] } })()
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const recentAI = aiWorkouts.filter(w => w.date >= sevenDaysAgo)

      const MUSCLE_GROUPS = {
        peito: ['peito', 'peitoral', 'chest', 'push', 'supino', 'crucifixo'],
        costas: ['costas', 'back', 'pull', 'remada', 'barra', 'serrátil'],
        pernas: ['perna', 'leg', 'quadríceps', 'quad', 'femoral', 'agachamento', 'leg press', 'cadeira'],
        ombros: ['ombro', 'shoulder', 'deltóide', 'elevação', 'desenvolvimento'],
        biceps: ['bíceps', 'bicep', 'rosca'],
        triceps: ['tríceps', 'tricep', 'pulley', 'extensão'],
        gluteos: ['glúteo', 'glute', 'hip thrust'],
        panturrilha: ['panturrilha', 'calf', 'gêmeo'],
      }

      const muscleLastTrained = {}
      recentAI.forEach(w => {
        const focoStr = (w.foco || w.nome || '').toLowerCase()
        const hoursAgo = (Date.now() - new Date(w.date + 'T12:00:00').getTime()) / 3600000
        Object.entries(MUSCLE_GROUPS).forEach(([group, keywords]) => {
          if (keywords.some(k => focoStr.includes(k))) {
            if (!muscleLastTrained[group] || hoursAgo < muscleLastTrained[group]) {
              muscleLastTrained[group] = Math.round(hoursAgo)
            }
          }
        })
      })

      const ALL_GROUPS = Object.keys(MUSCLE_GROUPS)
      const recoveryLines = ALL_GROUPS.map(g => {
        const h = muscleLastTrained[g]
        if (!h) return `${g}: não treinado esta semana (PRONTO)`
        if (h < 48) return `${g}: treinado há ${h}h (RECUPERANDO — não treinar)`
        if (h < 72) return `${g}: treinado há ${h}h (RECUPERAÇÃO PARCIAL — ok se necessário)`
        return `${g}: treinado há ${h}h (PRONTO para novo estímulo)`
      })

      const readyGroups = ALL_GROUPS.filter(g => !muscleLastTrained[g] || muscleLastTrained[g] >= 72)
      const recoverGroups = ALL_GROUPS.filter(g => muscleLastTrained[g] && muscleLastTrained[g] < 48)

      const muscleRecoveryReport = recentAI.length === 0
        ? null
        : `ANÁLISE DE RECUPERAÇÃO MUSCULAR (calculada pelo sistema):\n${recoveryLines.join('\n')}\n\nGRUPOS PRONTOS: ${readyGroups.join(', ') || 'nenhum'}\nGRUPOS EM RECUPERAÇÃO: ${recoverGroups.join(', ') || 'nenhum'}\nAÇÃO RECOMENDADA: priorize os grupos PRONTOS no treino de hoje.`

      let progressiveOverloadReport = null
      let plateauReport = null
      let autoRegulationReport = null
      try {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('date, exercises')
          .eq('user_id', userId)
          .gte('date', sixtyDaysAgo)
          .order('date', { ascending: false })
          .limit(60)

        if (logs?.length) {
          const exerciseAllHistory = {}
          logs.forEach(log => {
            ; (log.exercises || []).forEach(ex => {
              if (!ex.name || !ex.weight) return
              const key = ex.name.toLowerCase().trim()
              if (!exerciseAllHistory[key]) exerciseAllHistory[key] = []
              exerciseAllHistory[key].push({ name: ex.name, date: log.date, sets: Number(ex.sets) || 0, reps: String(ex.reps || ''), weight: parseFloat(ex.weight) || 0 })
            })
          })

          const progressLines = []
          const plateauLines = []

          Object.values(exerciseAllHistory).forEach(history => {
            const ex = history[0]
            const exLower = ex.name.toLowerCase()
            const belongsToReady = readyGroups.some(g => MUSCLE_GROUPS[g]?.some(k => exLower.includes(k)))
            if (!belongsToReady || !ex.weight) return

            if (history.length >= 3) {
              const last3 = history.slice(0, 3)
              const sameWeight = last3.every(h => h.weight === last3[0].weight)
              const sameReps = last3.every(h => h.reps === last3[0].reps)
              if (sameWeight && sameReps) {
                const PLATEAU_TECHNIQUES = [
                  'Rest-Pause na última série (pausa 15s, mais 3-5 reps)',
                  'Drop Set: após falha, reduza 20% da carga e continue',
                  'Série Descendente: 4 cargas diferentes no mesmo exercício',
                  'Troque temporariamente por um exercício similar com ângulo diferente',
                  'Aumente o TUT (tempo sob tensão): 3s excêntrico, 1s isométrico',
                ]
                const technique = PLATEAU_TECHNIQUES[Math.floor(Math.random() * PLATEAU_TECHNIQUES.length)]
                plateauLines.push(
                  `[ALERTA DE PLATÔ] ${ex.name}: estagnado em ${ex.weight}kg x ${ex.reps} por ${last3.length} sessões (${last3[last3.length - 1].date} a ${last3[0].date}). ` +
                  `NÃO sugira aumento de carga. AÇÃO: ${technique}.`
                )
                return
              }
            }

            const suggestion = ex.weight > 0
              ? `tente ${(ex.weight + 2.5).toFixed(1)}kg OU ${ex.reps}+2 reps com ${ex.weight}kg`
              : 'registre o peso para ativar sobrecarga progressiva'
            progressLines.push(
              `${ex.name}: último (${ex.date}) -> ${ex.sets}x${ex.reps} com ${ex.weight}kg | SUGESTÃO: ${suggestion}`
            )
          })

          if (progressLines.length > 0) {
            progressiveOverloadReport =
              `HISTÓRICO DE CARGA — GRUPOS PRONTOS (calculado pelo sistema):\n` +
              progressLines.slice(0, 8).join('\n') +
              `\n\nINSTRUÇÃO: Cite a carga exata em cada exercício. NÃO diga "escolha um peso" — dê o número.`
          }
          if (plateauLines.length > 0) {
            plateauReport = plateauLines.join('\n')
          }
        }

        const sleepAvg = avgSleep ? parseFloat(avgSleep) : null
        const isSleepAlert = sleepAvg !== null && sleepAvg < 6.5
        const isViscAlert = lastBio?.visceral && Number(lastBio.visceral) >= 10

        if (isSleepAlert || isViscAlert) {
          const reasons = []
          if (isSleepAlert) reasons.push(`sono médio de ${sleepAvg}h (abaixo de 6.5h — SNC comprometido)`)
          if (isViscAlert) reasons.push(`gordura visceral elevada (${lastBio.visceral}) — indicador de estresse sistêmico`)
          autoRegulationReport =
            `[AUTO-REGULAÇÃO] Sinais de fadiga detectados: ${reasons.join('; ')}. ` +
            `AÇÃO OBRIGATÓRIA: (1) NÃO aumente cargas hoje. ` +
            `(2) Mantenha os pesos do último treino. ` +
            `(3) Exija RIR 3 em todos os exercícios (3 reps de reserva) para poupar o SNC. ` +
            `(4) Mencione brevemente ao usuário que o corpo está em modo de recuperação e que manter a carga hoje é a decisão inteligente.`
        }
      } catch (e) { console.warn('progressiveOverload/plateau:', e) }

      setProfile({ name: user?.name, age: user?.age, sex: user?.sex, weight: user?.weight, height: user?.height, goal: user?.goal, activity: user?.activity, avgSleep, lastBio, weeklyStats, recentWorkouts, muscleRecoveryReport, progressiveOverloadReport, plateauReport, autoRegulationReport })
    } catch (e) { console.error(e) }
    setCtxLoaded(true)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading || limitHit) return
    setInput('')

    // ── Detecção de dor/lesão — interrompe sugestões de exercício ────────────
    if (detectInjury(msg)) {
      if (!isPro) { incrementUsage(); setUsage(getTodayUsage()) }
      const injuryMsg = {
        role: 'assistant',
        content: '⚠️ Identifiquei uma menção a dor ou desconforto físico.\n\nNão vou sugerir exercícios nessa situação. Sua saúde é prioridade.\n\nPor favor, consulte um médico ou fisioterapeuta antes de continuar treinando. Eles são os profissionais habilitados para avaliar sua condição e indicar o tratamento adequado.',
      }
      const newMsgs = [...messages, { role: 'user', content: msg }, injuryMsg]
      setMessages(newMsgs)
      return
    }

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
      const reply = data?.choices?.[0]?.message?.content ?? 'Sem resposta.'
      const finalMsgs = [...newMsgs, { role: 'assistant', content: reply }]
      setMessages(finalMsgs)

      setSessions(prev => {
        const existing = prev.find(s => s.id === sessionId)
        const updated = existing
          ? prev.map(s => s.id === sessionId ? { ...s, messages: finalMsgs } : s)
          : [{ id: sessionId, title: sessionTitle, date: today(), messages: finalMsgs }, ...prev]
        saveSessions(userId, updated)
        return updated
      })
    } catch (e) {
      console.error(e)
      setMessages(m => [...m, { role: 'assistant', content: `❌ ${e.message || 'Erro de conexão.'}` }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const suggestions = isPro ? SUGGESTIONS_PRO : SUGGESTIONS_FREE
  const showSuggestions = messages.length <= 1

  return (
    <div className="animate-fade" style={{ display: 'flex', height: 'calc(100dvh - 120px)', overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <div style={{ width: sidebarOpen ? 210 : 0, minWidth: sidebarOpen ? 210 : 0, transition: 'all 0.25s ease', overflow: 'hidden', background: '#060606', borderRight: sidebarOpen ? '1px solid rgba(220,38,38,0.08)' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <button onClick={openWelcome} style={{ width: '100%', padding: '8px 0', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 5, color: R2, fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>
            + NOVO CHAT
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 5px' }}>
          {sessions.length === 0 && <div style={{ color: '#222', fontSize: 10, textAlign: 'center', padding: 20 }}>Sem histórico ainda</div>}
          {groupByDate(sessions).map(([date, group]) => (
            <div key={date}>
              <div style={{ color: '#252525', fontSize: 8, letterSpacing: 2, padding: '8px 6px 3px', textTransform: 'uppercase' }}>{formatDateLabel(date)}</div>
              {group.map(session => (
                <div key={session.id} onClick={() => loadSession(session)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 7px', borderRadius: 5, marginBottom: 2, cursor: 'pointer', background: currentId === session.id ? 'rgba(220,38,38,0.08)' : 'transparent', border: `1px solid ${currentId === session.id ? 'rgba(220,38,38,0.18)' : 'transparent'}`, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (currentId !== session.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={e => { if (currentId !== session.id) e.currentTarget.style.background = 'transparent' }}>
                  <span style={{ color: currentId === session.id ? '#bbb' : '#444', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    {session.title}
                  </span>
                  <button onClick={e => deleteSession(session.id, e)}
                    style={{ background: 'none', border: 'none', color: '#252525', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = R}
                    onMouseLeave={e => e.currentTarget.style.color = '#252525'}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ marginBottom: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setSidebarOpen(o => !o)}
                style={{ background: sidebarOpen ? 'rgba(220,38,38,0.08)' : 'transparent', border: `1px solid ${sidebarOpen ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 5, padding: '6px 10px', color: sidebarOpen ? R2 : '#444', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s', flexShrink: 0 }}>
                ☰
              </button>
              <div>
                <div style={{ color: R, fontSize: 18, letterSpacing: 4, fontWeight: 700 }}>
                  ASSISTENTE {isPro && <span style={{ fontSize: 10, background: 'rgba(220,38,38,0.12)', border: `1px solid ${R}30`, padding: '2px 7px', borderRadius: 3, letterSpacing: 2, verticalAlign: 'middle' }}>PRO</span>}
                </div>
                <div style={{ color: '#282828', fontSize: 9, letterSpacing: 2, marginTop: 2 }}>HEALTH AI · LLAMA 3.3 VIA GROQ</div>
              </div>
            </div>
            {!isPro && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: remaining > 0 ? S : R2, fontSize: 18, fontWeight: 700 }}>{Math.max(remaining, 0)}</div>
                <div style={{ color: '#2a2a2a', fontSize: 9, letterSpacing: 1 }}>MSG/DIA</div>
              </div>
            )}
          </div>
          {!isPro && (
            <div style={{ height: 3, background: '#0d0d0d', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${(usage / FREE_LIMIT) * 100}%`, height: '100%', background: remaining > 1 ? R : R2, borderRadius: 2, transition: 'width 0.4s' }} />
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          {messages.map((m, i) => {
            const workout = m.role === 'assistant' ? parseWorkout(m.content) : null
            const diet = m.role === 'assistant' ? parseDiet(m.content) : null
            const displayContent = workout ? stripWorkoutJson(m.content) : diet ? stripDietJson(m.content) : m.content
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '88%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.role === 'user' ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)'}`, color: m.role === 'user' ? '#f0f0f0' : '#d0d0d0', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.role === 'assistant' && <div style={{ color: R, fontSize: 9, letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>◈ HEALTH AI</div>}
                  {displayContent}
                </div>
                {workout && <WorkoutSaveCard workout={workout} userId={userId} />}
                {diet && <DietSaveCard diet={diet} userId={userId} />}
              </div>
            )
          })}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 16px', borderRadius: '12px 12px 12px 2px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: R, opacity: 0.7, animation: `ping 1s ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}

          {limitHit && (
            <NeonCard color={R} style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
              <div style={{ color: '#d0d0d0', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Limite diário atingido</div>
              <div style={{ color: '#555', fontSize: 11, marginBottom: 14 }}>Assine o PRO para mensagens ilimitadas + análise dos seus dados.</div>
              <button className="btn" onClick={() => window.dispatchEvent(new CustomEvent('goto-tab', { detail: 'subscription' }))}
                style={{ background: 'rgba(220,38,38,0.15)', borderColor: R, color: R2, padding: '10px 24px', fontSize: 11, letterSpacing: 2 }}>
                VER PLANOS →
              </button>
            </NeonCard>
          )}

          {showSuggestions && !limitHit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <div style={{ color: '#252525', fontSize: 9, letterSpacing: 2 }}>SUGESTÕES</div>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ textAlign: 'left', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.045)', borderRadius: 8, padding: '9px 14px', color: '#4a4a4a', fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace", transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; e.currentTarget.style.color = '#888' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.color = '#4a4a4a' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={limitHit ? 'Limite diário atingido...' : 'Escreva sua pergunta...'}
              disabled={limitHit || loading} className="input"
              style={{ flex: 1, fontSize: 13, borderColor: input ? 'rgba(220,38,38,0.3)' : undefined, opacity: limitHit ? 0.4 : 1 }} />
            <button onClick={() => send()} disabled={!input.trim() || loading || limitHit}
              style={{ background: input.trim() && !limitHit ? 'rgba(220,38,38,0.18)' : 'transparent', border: `1px solid ${input.trim() && !limitHit ? R : '#181818'}`, color: input.trim() && !limitHit ? R2 : '#1e1e1e', borderRadius: 6, padding: '0 16px', cursor: 'pointer', fontSize: 16, transition: 'all 0.15s', flexShrink: 0 }}>
              ➤
            </button>
          </div>
          {/* ── Rodapé legal ── */}
          <div style={{ color: '#1a1a1a', fontSize: 9, letterSpacing: 0.5, marginTop: 6, textAlign: 'center', lineHeight: 1.6 }}>
            {isPro
              ? 'MENSAGENS ILIMITADAS · LLAMA 3.3 VIA GROQ'
              : `${Math.max(remaining, 0)} DE ${FREE_LIMIT} MENSAGENS RESTANTES HOJE`
            }
            <br />
            <span style={{ color: '#141414' }}>
              Sugestões de caráter informativo · Não substituem profissional CREF/CRN
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkoutSaveCard({ workout, userId }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true); setError('')

    const enriched = { ...workout, id: `ai_${Date.now()}`, date: today() }
    const existing = (() => { try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] } })()
    localStorage.setItem('healthos_ai_workouts', JSON.stringify([enriched, ...existing].slice(0, 10)))

    window.dispatchEvent(new CustomEvent('ai-workout-ready', { detail: enriched }))

    setSaved(true)
    setSaving(false)

    window.dispatchEvent(new CustomEvent('workout-exercises-updated'))

    saveWorkoutToLog(userId, workout).catch(e => console.warn('Supabase workout log:', e))
  }

  return (
    <div style={{ maxWidth: '88%', marginTop: 8, padding: '14px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)' }}>
      <div style={{ color: R, fontSize: 9, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>💪 PLANEJAMENTO SUGERIDO PELA IA</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#d0d0d0', fontSize: 14, fontWeight: 700 }}>{workout.nome}</div>
          {workout.foco && <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>🎯 {workout.foco}</div>}
        </div>
        {workout.duracao && <div style={{ color: R2, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>⏱ {workout.duracao}</div>}
      </div>
      {workout.exercicios?.map((ex, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ color: '#bbb', fontSize: 12, fontWeight: 700, flex: 1 }}>{ex.nome}</div>
            <div style={{ color: R2, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ex.series}×{ex.reps}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
            {ex.rir && <span style={{ color: '#383838', fontSize: 10 }}>📊 {ex.rir}</span>}
            {ex.descanso && <span style={{ color: '#383838', fontSize: 10 }}>⏸ {ex.descanso}</span>}
          </div>
          {ex.dica && <div style={{ color: '#303030', fontSize: 10, marginTop: 3, fontStyle: 'italic' }}>💡 {ex.dica}</div>}
        </div>
      ))}
      {workout.observacoes && <div style={{ color: '#2e2e2e', fontSize: 11, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>📝 {workout.observacoes}</div>}
      {error && <div style={{ color: R2, fontSize: 11, marginTop: 8 }}>{error}</div>}
      <button onClick={handleSave} disabled={saving || saved}
        style={{ marginTop: 12, width: '100%', padding: '11px 0', borderRadius: 6, border: `1px solid ${saved ? '#22c55e' : R}`, background: saved ? 'rgba(34,197,94,0.07)' : 'rgba(220,38,38,0.08)', color: saved ? '#22c55e' : R2, fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: saved ? 'default' : 'pointer', transition: 'all 0.3s' }}>
        {saving ? 'SALVANDO...' : saved ? '✓ SALVO NA ABA TREINOS!' : '💾 SALVAR NA ABA TREINOS'}
      </button>
    </div>
  )
}

// ── Context router ────────────────────────────────────────────────────────────
function routeContext(message, p) {
  const m = (message || '').toLowerCase()
  const isW = /treino|exerc|musculo|serie|supino|agach|pull|push|leg|peito|costas|ombro|bra.o|perna|panturrilha|b.ceps|tr.ceps/.test(m)
  const isD = /dieta|caloria|prote.na|carboidrato|refei..o|comer|card.pio|nutri|emagrec/.test(m)
  const isC = /checkin|check.in|evolu..o|progresso|semana|bioimpedância|sono|an.lise/.test(m)
  const base = `- Nome: ${p.name || '—'} | Objetivo: ${p.goal || '—'}`
  const bmr = p.sex === 'male' ? 88.36 + 13.4 * (p.weight || 70) + 4.8 * (p.height || 170) - 5.7 * (p.age || 30) : 447.6 + 9.2 * (p.weight || 70) + 3.1 * (p.height || 170) - 4.3 * (p.age || 30)
  const tdee = Math.round(bmr * (p.activity || 1.55))
  if (isW) return [base,
    `- Peso: ${p.weight || '—'}kg | Altura: ${p.height || '—'}cm`,
    p.weeklyStats ? `- Esta semana: ${p.weeklyStats}` : '',
    p.recentWorkouts ? `- Treinos recentes: ${p.recentWorkouts}` : '',
    p.muscleRecoveryReport ? `\n[DADOS DO SISTEMA]\n${p.muscleRecoveryReport}` : '',
    p.progressiveOverloadReport ? `\n[SOBRECARGA PROGRESSIVA]\n${p.progressiveOverloadReport}` : '',
    p.plateauReport ? `\n${p.plateauReport}` : '',
    p.autoRegulationReport ? `\n${p.autoRegulationReport}` : '',
  ].filter(Boolean).join('\n')
  if (isD) return [base,
    `- Peso: ${p.weight || '—'}kg | TMB: ~${Math.round(bmr)} kcal | TDEE: ~${tdee} kcal`,
    p.lastBio ? `- Bioimpedância: gordura ${p.lastBio.gordura || '?'}%, músculo ${p.lastBio.musculo || '?'}%` : '',
  ].filter(Boolean).join('\n')
  if (isC) return [base,
    `- Peso: ${p.weight || '—'}kg | TMB: ~${Math.round(bmr)} kcal | TDEE: ~${tdee} kcal`,
    p.avgSleep ? `- Sono médio (7d): ${p.avgSleep}h` : '',
    p.lastBio ? `- Bioimpedância: gordura ${p.lastBio.gordura || '?'}%, músculo ${p.lastBio.musculo || '?'}%, visceral ${p.lastBio.visceral || '?'}, água ${p.lastBio.agua || '?'}%` : '',
    p.weeklyStats ? `- Esta semana: ${p.weeklyStats}` : '',
    p.muscleRecoveryReport ? `\n[DADOS DO SISTEMA]\n${p.muscleRecoveryReport}` : '',
  ].filter(Boolean).join('\n')
  return base
}

// ── Legal disclaimer injetado em todos os prompts ─────────────────────────────
const LEGAL_DISCLAIMER = `
DIRETRIZES LEGAIS OBRIGATÓRIAS — SIGA SEMPRE SEM EXCEÇÃO:

1. IDENTIDADE: Você é um Assistente de Organização e Educação em Fitness. NÃO é personal trainer, nutricionista nem profissional de saúde habilitado.

2. LINGUAGEM PROIBIDA: Nunca use "você deve fazer", "seu treino é", "eu prescrevo", "eu recomendo que você faça", "faça este exercício". Use sempre: "uma divisão comum na literatura é", "muitos praticantes utilizam", "um exemplo de planejamento seria", "com base em dados gerais, uma sugestão seria".

3. DISCLAIMER OBRIGATÓRIO: Todo planejamento de treino ou sugestão alimentar DEVE terminar com esta frase exata:
"⚠️ Este é um planejamento sugerido com base em dados gerais. Consulte um profissional de Educação Física (CREF) e/ou nutricionista antes de iniciar qualquer rotina."

4. DOR OU LESÃO: Se o usuário mencionar dor, lesão, desconforto físico ou sintomas médicos, PARE imediatamente qualquer sugestão de exercício e responda APENAS: "Não vou sugerir exercícios em caso de dor ou desconforto. Por favor, consulte um médico ou fisioterapeuta antes de continuar treinando."

5. TERMINOLOGIA: Refira-se a treinos como "Planejamento Sugerido" ou "Exemplo de Divisão". Refira-se a dietas como "Sugestão Alimentar" ou "Exemplo de Cardápio".
`

const SCIENCE_BASE = `FUNDAMENTOS CIENTÍFICOS DE HIPERTROFIA:
1. SOBRECARGA PROGRESSIVA — progrida em carga, reps ou execução toda semana.
2. PROXIMIDADE DA FALHA (RIR 1-3) — pare a 1-3 reps da falha. Falha total só na última série.
3. VOLUME — 10-20 séries/semana por grupo. 2x/semana = 5-6 séries/sessão. 1x = 8-12/sessão.
4. ROM COMPLETO — ponto de maior alongamento = maior estímulo anabólico.
5. EXERCÍCIOS — composto livre (base) + máquinas/cabos (isolamento estável).
6. DESCANSO — compostos 2-4 min | isoladores 90s-2 min.`

const JSON_RULE = `REGRA DO JSON — TREINOS:
- Gere [TREINO_JSON] SOMENTE quando o treino estiver 100% definido.
- Durante perguntas ou sugestão de divisão: responda APENAS em texto, sem JSON.
- O bloco deve ser completo e válido:
[TREINO_JSON]
{"nome":"Push A — Peito, Ombro, Tríceps","duracao":"55-70 min","foco":"Peito, Ombro, Tríceps","exercicios":[{"nome":"Supino Reto com Barra","series":4,"reps":"6-10","rir":"RIR 2","descanso":"2-3 min","dica":"Desça até alongamento total, cotovelos a 45°"},{"nome":"Crucifixo no Cabo","series":3,"reps":"12-15","rir":"RIR 1","descanso":"90s","dica":"Abertura máxima = maior ponto de crescimento"}],"observacoes":"Volume para 2x/semana. Progrida toda semana. ⚠️ Planejamento sugerido — consulte um profissional CREF antes de iniciar."}
[/TREINO_JSON]

REGRA DO JSON — DIETAS:
- Gere [DIETA_JSON] ao montar um plano alimentar completo.
- Só gere quando tiver objetivo, calorias alvo e pelo menos 3 refeições definidas.
- O bloco deve ser completo e válido:
[DIETA_JSON]
{"objetivo":"Ganho de massa","calorias_totais":2800,"proteina_total":180,"carboidrato_total":320,"gordura_total":80,"refeicoes":[{"nome":"Café da Manhã","tipo":"Café da manhã","horario":"07:00","calorias":600,"proteina":35,"carboidrato":75,"gordura":15,"alimentos":["Ovos mexidos (3 ovos)","Pão integral (2 fatias)","Banana","Whey com leite"],"descricao":"Refeição anabólica para iniciar o dia com energia"},{"nome":"Almoço","tipo":"Almoço","horario":"12:00","calorias":900,"proteina":60,"carboidrato":100,"gordura":25,"alimentos":["Frango grelhado 200g","Arroz integral 1 xícara","Feijão 1 concha","Salada verde","Azeite 1 fio"],"descricao":"Maior refeição do dia, rica em proteína e carboidrato complexo"},{"nome":"Lanche Pré-treino","tipo":"Lanche","horario":"16:00","calorias":400,"proteina":25,"carboidrato":55,"gordura":8,"alimentos":["Batata-doce 150g","Peito de frango 100g"],"descricao":"Carboidrato de absorção lenta para energia no treino"},{"nome":"Jantar","tipo":"Jantar","horario":"20:00","calorias":700,"proteina":50,"carboidrato":70,"gordura":20,"alimentos":["Salmão 180g","Arroz integral","Brócolis refogado","Azeite"],"descricao":"Proteína de alta qualidade e gordura boa para recuperação noturna"}],"observacoes":"Adapte as porções conforme seu apetite. Hidrate-se com 35ml/kg de peso ao dia. ⚠️ Sugestão alimentar — consulte um nutricionista antes de adotar qualquer dieta."}
[/DIETA_JSON]`

const DIET_PROTOCOL = `PROTOCOLO PARA SUGESTÕES ALIMENTARES:
Quando o usuário pedir uma dieta, cardápio ou plano alimentar:
1. Faça estas perguntas em UMA única mensagem (só se não souber):
   "Para montar uma sugestão alimentar, preciso de 3 informações:
   1️⃣ Objetivo: A) Emagrecer  B) Ganhar massa  C) Manter peso
   2️⃣ Peso atual: ___kg
   3️⃣ Restrições: alguma alergia, intolerância ou alimento que não come?"
2. Com as respostas: TDEE estimado = peso × 33. Ajuste: emagrecer -300 kcal | ganhar massa +300 kcal.
3. Monte 4-6 refeições com alimentos brasileiros acessíveis e horários práticos.
4. Macros: ganho (P:30%, C:50%, G:20%) | emagrecer (P:35%, C:40%, G:25%) | manter (P:25%, C:50%, G:25%).
5. Só gere [DIETA_JSON] após ter objetivo + peso confirmados — nunca antes.
6. Sempre inclua o disclaimer legal no campo "observacoes" do JSON.
7. Mencione que o PRO calcula TDEE exato com dados reais (bioimpedância, sono, nível de atividade).`

function buildFreePrompt() {
  return `${LEGAL_DISCLAIMER}

Você é o Health Assistant do Health OS, app brasileiro de saúde e fitness.
Responda SEMPRE em português brasileiro. Direto e prático.
Respostas conversacionais: máximo 3 parágrafos. Ao gerar treino: sem limite de tamanho, gere completo.

${SCIENCE_BASE}

PROTOCOLO PARA PLANEJAMENTOS DE TREINO — faça estas 3 perguntas em uma única mensagem antes de montar:
"Para montar o melhor planejamento pra você, preciso de 3 informações:
1️⃣ Divisão: A) Push/Pull/Legs  B) Upper/Lower  C) Full Body  D) ABC  E) Me sugira uma
2️⃣ Músculo(s) de hoje: Ex: Peito+Tríceps | Costas+Bíceps | Pernas | Ombros
3️⃣ Frequência: vai treinar esses músculos mais alguma vez essa semana?"

Se o usuário escolher "E) Me sugira": sugira a divisão em texto, confirme com ele e SÓ ENTÃO monte com JSON.
Só gere o planejamento após ter as 3 respostas confirmadas.

${JSON_RULE}

Quando relevante, mencione que o PRO oferece análise personalizada baseada nos dados reais do usuário.

${DIET_PROTOCOL}`
}

function buildProPrompt(p, lastMessage) {
  const ctx = routeContext(lastMessage || '', p)
  const m = (lastMessage || '').toLowerCase()
  const isW = /treino|exerc|musculo|serie|supino|agach|pull|push|leg|peito|costas|ombro|perna/.test(m)
  const isD = /dieta|cardapio|card.pio|plano alimentar|refeicao|refei..o|comer|caloria|nutri|emagrec|cut|bulk/.test(m)

  return `${LEGAL_DISCLAIMER}

Você é o Health Assistant PRO do Health OS — assistente de organização de treinos e nutrição de ${p.name || 'seu atleta'}.
Responda SEMPRE em português brasileiro. Direto, prático e personalizado.
Respostas conversacionais: conciso. Ao gerar planejamento: sem limite, gere completo.

CONTEXTO RELEVANTE PARA ESTA RESPOSTA:
${ctx}

${SCIENCE_BASE}

${isW ? `MODO PLANEJAMENTO PRO:
Os dados abaixo foram PRÉ-CALCULADOS pelo sistema — não recalcule, use diretamente.
NÃO faça as 3 perguntas básicas — o usuário PRO espera que você já saiba o que ele deve treinar.
Fluxo obrigatório:
1. Leia [DADOS DO SISTEMA]: quais músculos estão PRONTOS vs RECUPERANDO.
2. Escolha o foco do planejamento de hoje pelos grupos PRONTOS. Justifique em 1 frase com os dados reais.
3. Leia [SOBRECARGA PROGRESSIVA]: para cada exercício com histórico, diga: "Da última vez você fez Xx de Yreps com Zkg — hoje tente Wkg." Dê o número exato.
4. Leia [ALERTA DE PLATÔ]: se um exercício estiver nessa lista, NÃO sugira aumento. Aplique a técnica avançada indicada e explique ao usuário o porquê em 1 frase.
5. Leia [AUTO-REGULAÇÃO]: se presente, congele todas as cargas no nível anterior, force RIR 3 em todos os exercícios e explique brevemente que hoje é dia de treino inteligente, não de bater recorde.
6. Se não houver [DADOS DO SISTEMA]: pergunte apenas "Qual grupo muscular você quer focar hoje?"
7. Se não houver [SOBRECARGA PROGRESSIVA]: sugira cargas baseadas no peso corporal (${p.weight || '—'}kg) e perfil intermediário.
8. Monte o planejamento completo com JSON. No campo "dica" de cada exercício, inclua a carga sugerida com base nos dados acima.` : ''}

${JSON_RULE}

${isD ? `MODO SUGESTÃO ALIMENTAR PRO ATIVO:` : `${DIET_PROTOCOL}`}
${isD ? `Quando detectar pedido de dieta/cardápio/plano alimentar:
1. NUNCA peça peso ou objetivo — eles estão no contexto. Use-os diretamente.
2. Calcule o alvo calórico usando o TDEE do contexto:
   - objetivo=perder peso: TDEE - 300 kcal
   - objetivo=ganhar massa: TDEE + 300 kcal
   - objetivo=manter: TDEE
3. Se houver bioimpedância: cite o % de gordura e explique como a sugestão vai impactar a composição corporal.
4. Se sono médio < 6.5h: inclua carboidratos na janta (batata-doce, arroz) para reduzir cortisol e melhorar recuperação.
5. Pergunte APENAS sobre restrições alimentares (alergia, intolerância) — máximo 1 pergunta direta.
6. Monte 5-6 refeições com horários práticos e alimentos brasileiros acessíveis.
7. Gere o [DIETA_JSON] completo na mesma resposta, sem esperar confirmação.
8. Sempre inclua o disclaimer legal no campo "observacoes" do JSON.` : ''}

Não invente dados ausentes. Use apenas o contexto injetado acima.`
}