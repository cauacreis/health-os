import { useState, useEffect, useRef } from 'react'
import { NeonCard } from '../components/UI'
import { supabase } from '../lib/supabase'
import { getSleepLog, getBioLog, getCalendar, today, getTodayWater, getTodaySteps, getFoodLog, getMealPlans, getMealLog, getProfile, upsertProfile } from '../lib/db'

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
async function getTodayUsage(userId) {
  try {
    const { data } = await supabase.from('profiles').select('ai_usage_date, ai_usage_count').eq('id', userId).single()
    if (!data || data.ai_usage_date !== today()) return 0
    return data.ai_usage_count || 0
  } catch { return 0 }
}
async function incrementUsageServer(userId) {
  try {
    const { data } = await supabase.rpc('increment_ai_usage', { uid: userId })
    return typeof data === 'number' ? data : FREE_LIMIT
  } catch { return FREE_LIMIT }
}

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
function parseFitnessProfile(content) {
  const match = content.match(/\[FITNESS_PROFILE_JSON\]([\s\S]*?)\[\/FITNESS_PROFILE_JSON\]/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}
function stripFitnessProfileJson(content) {
  return content.replace(/\[FITNESS_PROFILE_JSON\][\s\S]*?\[\/FITNESS_PROFILE_JSON\]/g, '').trim()
}

async function saveWorkoutToLog(userId, workout) {
  const exercises = (workout.exercicios || []).map(ex => ({
    id: ex.nome.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
    name: ex.nome, sets: ex.series || 3, reps: ex.reps || '8-12',
    weight: null, done: false, rir: ex.rir || '', rest: ex.descanso || '',
    tip: ex.dica || '', source: 'ia',
  }))
  const { error } = await supabase.from('workout_logs').insert({
    id: `ia_${Date.now()}`, user_id: userId, date: today(),
    day_name: workout.nome || 'Treino IA', program_name: 'Treino IA',
    exercises, completed: false,
  })
  if (error) throw error
}

function DietSaveCard({ diet, userId }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const G = '#22c55e'

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const { supabase } = await import('../lib/supabase')
      const refeicoes = diet.refeicoes || []
      for (const ref of refeicoes) {
        const { error } = await supabase.from('meal_plans').insert({
          user_id: userId, name: ref.nome || 'Refeicao',
          meal_type: ref.tipo || ref.nome || 'Refeicao', time: ref.horario || '',
          description: [ref.descricao || '', (ref.alimentos || []).length > 0 ? ref.alimentos.join(' · ') : ''].filter(Boolean).join(' — '),
          calories: String(ref.calorias || ''), protein: String(ref.proteina || ''),
          carbs: String(ref.carboidrato || ''), fat: String(ref.gordura || ''),
          frequency: 'Todos os dias', active: true,
        })
        if (error) throw error
      }
      window.dispatchEvent(new CustomEvent('diet-plan-saved'))
      setSaved(true)
    } catch (e) { setError('Erro: ' + (e?.message || JSON.stringify(e))) }
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
          {ref.alimentos?.length > 0 && <div style={{ color: '#444', fontSize: 10, marginTop: 4 }}>{ref.alimentos.join(' · ')}</div>}
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
    getTodayUsage(userId).then(setUsage)
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
      const [sleepLogs, bioLog, calendar, todayWaterVal, todayStepsVal, todayFoodLog, mealPlans, mealLog] = await Promise.all([
        getSleepLog(userId, 7).catch(() => []),
        getBioLog(userId, 1).catch(() => []),
        getCalendar(userId).catch(() => []),
        getTodayWater(userId).catch(() => 0),
        getTodaySteps(userId).catch(() => 0),
        getFoodLog(userId, today()).catch(() => []),
        getMealPlans(userId).catch(() => []),
        getMealLog(userId, today()).catch(() => []),
      ])
      const avgSleep = sleepLogs.length ? (sleepLogs.reduce((s, e) => s + (+e.hours), 0) / sleepLogs.length).toFixed(1) : null
      const lastSleepEntry = sleepLogs[0] || null
      const lastBio = bioLog[0] ? { gordura: bioLog[0].body_fat, musculo: bioLog[0].muscle_mass, visceral: bioLog[0].visceral_fat, agua: bioLog[0].water_pct } : null

      // ── Cálculos de calorias do dia ──
      const bmr = user?.sex === 'male' ? 88.36 + 13.4 * (user?.weight || 70) + 4.8 * (user?.height || 170) - 5.7 * (user?.age || 30) : 447.6 + 9.2 * (user?.weight || 70) + 3.1 * (user?.height || 170) - 4.3 * (user?.age || 30)
      const tdee = Math.round(bmr * (user?.activity || 1.55))
      const checkedMealIds = new Set(mealLog.map(l => l.meal_id))
      const mealPlanKcal = mealPlans.filter(p => p.active !== false && checkedMealIds.has(p.id)).reduce((s, p) => s + (parseInt(p.calories) || 0), 0)
      const foodKcal = todayFoodLog.reduce((s, e) => s + (e.calories || 0), 0)
      const totalKcalToday = foodKcal + mealPlanKcal
      const remainingKcal = tdee - totalKcalToday
      const waterGoal = Math.round((user?.weight || 70) * 35)

      // ── Macros do dia ──
      const todayProtein = todayFoodLog.reduce((s, e) => s + (e.protein || 0), 0)
      const todayCarbs = todayFoodLog.reduce((s, e) => s + (e.carbs || 0), 0)
      const todayFat = todayFoodLog.reduce((s, e) => s + (e.fat || 0), 0)

      // ── Treino do dia ──
      const { data: todayWorkoutLogs } = await supabase.from('workout_logs').select('day_name, completed').eq('user_id', userId).eq('date', today()).limit(5).catch(() => ({ data: [] }))
      const todayWorkoutDone = (todayWorkoutLogs || []).some(l => l.completed)
      const todayWorkoutName = (todayWorkoutLogs || [])[0]?.day_name || null

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
            if (!muscleLastTrained[group] || hoursAgo < muscleLastTrained[group]) muscleLastTrained[group] = Math.round(hoursAgo)
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

      const muscleRecoveryReport = recentAI.length === 0 ? null :
        `ANÁLISE DE RECUPERAÇÃO MUSCULAR:\n${recoveryLines.join('\n')}\n\nGRUPOS PRONTOS: ${readyGroups.join(', ') || 'nenhum'}\nGRUPOS EM RECUPERAÇÃO: ${recoverGroups.join(', ') || 'nenhum'}`

      let progressiveOverloadReport = null, plateauReport = null, autoRegulationReport = null

      try {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
        const { data: logs } = await supabase.from('workout_logs').select('date, exercises').eq('user_id', userId).gte('date', sixtyDaysAgo).order('date', { ascending: false }).limit(60)
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

          const progressLines = [], plateauLines = []
          Object.values(exerciseAllHistory).forEach(history => {
            const ex = history[0]
            const exLower = ex.name.toLowerCase()
            const belongsToReady = readyGroups.some(g => MUSCLE_GROUPS[g]?.some(k => exLower.includes(k)))
            if (!belongsToReady || !ex.weight) return
            if (history.length >= 3) {
              const last3 = history.slice(0, 3)
              if (last3.every(h => h.weight === last3[0].weight) && last3.every(h => h.reps === last3[0].reps)) {
                const TECHNIQUES = ['Rest-Pause na última série (pausa 15s, mais 3-5 reps)', 'Drop Set: após falha, reduza 20% da carga e continue', 'Troque temporariamente por um exercício similar com ângulo diferente']
                plateauLines.push(`[ALERTA DE PLATÔ] ${ex.name}: estagnado em ${ex.weight}kg x ${ex.reps} por ${last3.length} sessões. AÇÃO: ${TECHNIQUES[Math.floor(Math.random() * TECHNIQUES.length)]}.`)
                return
              }
            }
            const suggestion = ex.weight > 0 ? `tente ${(ex.weight + 2.5).toFixed(1)}kg OU ${ex.reps}+2 reps com ${ex.weight}kg` : 'registre o peso para ativar sobrecarga progressiva'
            progressLines.push(`${ex.name}: último (${ex.date}) -> ${ex.sets}x${ex.reps} com ${ex.weight}kg | SUGESTÃO: ${suggestion}`)
          })

          if (progressLines.length > 0) progressiveOverloadReport = `HISTÓRICO DE CARGA — GRUPOS PRONTOS:\n${progressLines.slice(0, 8).join('\n')}\n\nINSTRUÇÃO: Cite a carga exata. NÃO diga "escolha um peso".`
          if (plateauLines.length > 0) plateauReport = plateauLines.join('\n')
        }

        const sleepAvg = avgSleep ? parseFloat(avgSleep) : null
        const isSleepAlert = sleepAvg !== null && sleepAvg < 6.5
        const isViscAlert = lastBio?.visceral && Number(lastBio.visceral) >= 10
        if (isSleepAlert || isViscAlert) {
          const reasons = []
          if (isSleepAlert) reasons.push(`sono médio de ${sleepAvg}h`)
          if (isViscAlert) reasons.push(`gordura visceral elevada (${lastBio.visceral})`)
          autoRegulationReport = `[AUTO-REGULAÇÃO] Sinais de fadiga: ${reasons.join('; ')}. NÃO aumente cargas. RIR 3 em todos os exercícios.`
        }
      } catch (e) { console.warn('progressiveOverload/plateau:', e) }

      setProfile({
        name: user?.name, age: user?.age, sex: user?.sex, weight: user?.weight, height: user?.height,
        goal: user?.goal, activity: user?.activity, goals: user?.goals, gym_types: user?.gym_types, gym_type: user?.gym_type,
        avgSleep, lastBio, weeklyStats, recentWorkouts, muscleRecoveryReport, progressiveOverloadReport, plateauReport, autoRegulationReport,
        // ── Dados do dia para o Motor de Análise ──
        todayWater: todayWaterVal, waterGoal, todaySteps: todayStepsVal,
        todayKcal: totalKcalToday, tdee, remainingKcal,
        todayProtein, todayCarbs, todayFat,
        lastSleepHours: lastSleepEntry ? lastSleepEntry.hours : null,
        todayWorkoutDone, todayWorkoutName,
      })
    } catch (e) { console.error(e) }
    setCtxLoaded(true)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading || limitHit) return
    setInput('')

    if (detectInjury(msg)) {
      if (!isPro) { incrementUsageServer(userId).then(setUsage) }
      setMessages(m => [...m, { role: 'user', content: msg }, { role: 'assistant', content: '⚠️ Identifiquei uma menção a dor ou desconforto físico.\n\nNão vou sugerir exercícios nessa situação. Sua saúde é prioridade.\n\nPor favor, consulte um médico ou fisioterapeuta antes de continuar treinando.' }])
      return
    }

    if (!isPro) { const newCount = await incrementUsageServer(userId); setUsage(newCount) }

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
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 900, messages: [{ role: 'system', content: systemPrompt }, ...newMsgs.slice(-12)] }),
      })
      const data = await res.json()
      if (data?.error) throw new Error(data.error?.message || 'Erro da API')
      const reply = data?.choices?.[0]?.message?.content ?? 'Sem resposta.'
      const finalMsgs = [...newMsgs, { role: 'assistant', content: reply }]
      setMessages(finalMsgs)
      setSessions(prev => {
        const existing = prev.find(s => s.id === sessionId)
        const updated = existing ? prev.map(s => s.id === sessionId ? { ...s, messages: finalMsgs } : s) : [{ id: sessionId, title: sessionTitle, date: today(), messages: finalMsgs }, ...prev]
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
                  <span style={{ color: currentId === session.id ? '#bbb' : '#444', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{session.title}</span>
                  <button onClick={e => deleteSession(session.id, e)} style={{ background: 'none', border: 'none', color: '#252525', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = R} onMouseLeave={e => e.currentTarget.style.color = '#252525'}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ marginBottom: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setSidebarOpen(o => !o)} style={{ background: sidebarOpen ? 'rgba(220,38,38,0.08)' : 'transparent', border: `1px solid ${sidebarOpen ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 5, padding: '6px 10px', color: sidebarOpen ? R2 : '#444', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s', flexShrink: 0 }}>☰</button>
              <div>
                <div style={{ color: R, fontSize: 18, letterSpacing: 4, fontWeight: 700 }}>ASSISTENTE {isPro && <span style={{ fontSize: 10, background: 'rgba(220,38,38,0.12)', border: `1px solid ${R}30`, padding: '2px 7px', borderRadius: 3, letterSpacing: 2, verticalAlign: 'middle' }}>PRO</span>}</div>
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

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          {messages.map((m, i) => {
            const workout = m.role === 'assistant' ? parseWorkout(m.content) : null
            const diet = m.role === 'assistant' ? parseDiet(m.content) : null
            const fitnessProfile = m.role === 'assistant' ? parseFitnessProfile(m.content) : null
            let displayContent = m.content
            if (workout) displayContent = stripWorkoutJson(displayContent)
            if (diet) displayContent = stripDietJson(displayContent)
            if (fitnessProfile) displayContent = stripFitnessProfileJson(displayContent)
            displayContent = displayContent.trim()
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '88%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.role === 'user' ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)'}`, color: m.role === 'user' ? '#f0f0f0' : '#d0d0d0', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.role === 'assistant' && <div style={{ color: R, fontSize: 9, letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>◈ HEALTH AI</div>}
                  {displayContent}
                </div>
                {workout && <WorkoutSaveCard workout={workout} userId={userId} />}
                {diet && <DietSaveCard diet={diet} userId={userId} />}
                {fitnessProfile && <RPGUpdateCard profile={fitnessProfile} userId={userId} />}
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
            </NeonCard>
          )}

          {showSuggestions && !limitHit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <div style={{ color: '#252525', fontSize: 9, letterSpacing: 2 }}>SUGESTÕES</div>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.045)', borderRadius: 8, padding: '9px 14px', color: '#4a4a4a', fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace", transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; e.currentTarget.style.color = '#888' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.color = '#4a4a4a' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

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
          <div style={{ color: '#1a1a1a', fontSize: 9, letterSpacing: 0.5, marginTop: 6, textAlign: 'center', lineHeight: 1.6 }}>
            {isPro ? 'MENSAGENS ILIMITADAS · LLAMA 3.3 VIA GROQ' : `${Math.max(remaining, 0)} DE ${FREE_LIMIT} MENSAGENS RESTANTES HOJE`}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkoutSaveCard({ workout, userId }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const enriched = { ...workout, id: `ai_${Date.now()}`, date: today() }
    const existing = (() => { try { return JSON.parse(localStorage.getItem('healthos_ai_workouts') || '[]') } catch { return [] } })()
    localStorage.setItem('healthos_ai_workouts', JSON.stringify([enriched, ...existing].slice(0, 10)))
    window.dispatchEvent(new CustomEvent('ai-workout-ready', { detail: enriched }))
    setSaved(true); setSaving(false)
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
      <button onClick={handleSave} disabled={saving || saved}
        style={{ marginTop: 12, width: '100%', padding: '11px 0', borderRadius: 6, border: `1px solid ${saved ? '#22c55e' : R}`, background: saved ? 'rgba(34,197,94,0.07)' : 'rgba(220,38,38,0.08)', color: saved ? '#22c55e' : R2, fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: saved ? 'default' : 'pointer', transition: 'all 0.3s' }}>
        {saving ? 'SALVANDO...' : saved ? '✓ SALVO NA ABA TREINOS!' : '💾 SALVAR NA ABA TREINOS'}
      </button>
    </div>
  )
}

function RPGUpdateCard({ profile: fp, userId }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const ATTRS = [
    { key: 'forca', label: 'Força', icon: '⚔️', color: '#ef4444' },
    { key: 'cardio', label: 'Cardio', icon: '❤️', color: '#f97316' },
    { key: 'flexibilidade', label: 'Flexibilidade', icon: '🧘', color: '#a855f7' },
    { key: 'resistencia', label: 'Resistência', icon: '🛡️', color: '#3b82f6' },
    { key: 'equilibrio', label: 'Equilíbrio', icon: '⚖️', color: '#14b8a6' },
    { key: 'velocidade', label: 'Velocidade', icon: '⚡', color: '#eab308' },
  ]

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const current = await getProfile(userId)
      const patch = {}
      ATTRS.forEach(a => {
        const currentVal = current?.[`rpg_${a.key}`] ?? 50
        const delta = fp[a.key] || 0
        patch[`rpg_${a.key}`] = Math.max(0, Math.min(100, currentVal + delta))
      })
      await upsertProfile(userId, patch)
      setSaved(true)
    } catch (e) { setError('Erro ao salvar: ' + (e?.message || 'tente novamente')) }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '88%', marginTop: 8, background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '16px 18px', alignSelf: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>🎮</span>
        <div style={{ color: '#a855f7', fontSize: 9, letterSpacing: 2, fontWeight: 700 }}>ATUALIZAÇÃO DE STATUS RPG</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {ATTRS.map(a => {
          const delta = fp[a.key] || 0
          const isPositive = delta > 0, isNegative = delta < 0
          return (
            <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: `1px solid ${isPositive ? 'rgba(34,197,94,0.2)' : isNegative ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#999', fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>{a.label.toUpperCase()}</div>
                <div style={{ color: isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#555', fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>
                  {isPositive ? '+' : ''}{delta}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {fp.feedback && (
        <div style={{ color: '#b0b0b0', fontSize: 11, lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, borderLeft: '3px solid rgba(139,92,246,0.4)' }}>
          💬 {fp.feedback}
        </div>
      )}

      {error && <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 8 }}>{error}</div>}

      <button onClick={handleSave} disabled={saving || saved}
        style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: `1px solid ${saved ? '#22c55e' : 'rgba(139,92,246,0.4)'}`, background: saved ? 'rgba(34,197,94,0.08)' : 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.08) 100%)', color: saved ? '#22c55e' : '#a855f7', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: saved ? 'default' : 'pointer', transition: 'all 0.3s', fontWeight: 700 }}>
        {saving ? 'SALVANDO...' : saved ? '✓ STATUS ATUALIZADO!' : '⚔️ SALVAR STATUS'}
      </button>
    </div>
  )
}

// ── Prompt helpers (mantidos do original) ─────────────────────────────────────
function parseGoals(user) {
  try {
    if (Array.isArray(user?.goals)) return user.goals
    if (typeof user?.goals === 'string' && user.goals.startsWith('[')) return JSON.parse(user.goals)
    return [user?.goal].filter(Boolean)
  } catch { return [user?.goal].filter(Boolean) }
}
function parseGymTypes(user) {
  try {
    if (Array.isArray(user?.gym_types)) return user.gym_types
    if (typeof user?.gym_types === 'string' && user.gym_types.startsWith('[')) return JSON.parse(user.gym_types)
    return [user?.gym_type].filter(Boolean)
  } catch { return [user?.gym_type].filter(Boolean) }
}
const GOAL_LABELS = { muscleGain: 'Hipertrofia', weightLoss: 'Perda de Peso', endurance: 'Resistência', maintenance: 'Manutenção', recomposition: 'Recomposição', calisthenics: 'Calistenia', crossfit: 'CrossFit', flexibility: 'Mobilidade' }
const GYM_LABELS = { full: 'Academia Completa', basic: 'Academia Básica', home: 'Em Casa', outdoor: 'Ao Ar Livre', crossfit: 'CrossFit Box' }
const GYM_EQUIPMENT = { full: 'TODOS os equipamentos: barras, máquinas, cabos, halteres.', basic: 'Halteres, barra, banco. SEM máquinas.', home: 'APENAS peso corporal, halteres leves e elásticos.', outdoor: 'Peso corporal e barras de parque.', crossfit: 'Kettlebell, barbell, box, movimentos olímpicos.' }
const ACTIVITY_DAYS = { '1.2': '2 dias/semana', '1.375': '3 dias/semana', '1.55': '4–5 dias/semana', '1.725': '6 dias/semana', '1.9': 'treino diário' }
const GOAL_PROTOCOL = { muscleGain: 'RIR 1–3 | 10–20 séries/semana/grupo | descanso 2–4 min', weightLoss: 'Déficit calórico | cardio Z2–Z3 | força para preservar músculo', endurance: 'Base aeróbica Z2 | progressão de volume semanal', maintenance: 'Volume moderado | equilíbrio cardio + força | RIR 2–4' }

function buildProfileBlock(p) {
  const goals = parseGoals(p), gymTypes = parseGymTypes(p)
  const bmr = p.sex === 'male' ? 88.36 + 13.4 * (p.weight || 70) + 4.8 * (p.height || 170) - 5.7 * (p.age || 30) : 447.6 + 9.2 * (p.weight || 70) + 3.1 * (p.height || 170) - 4.3 * (p.age || 30)
  const tdee = Math.round(bmr * (p.activity || 1.55))
  return `══════════════════════════════════════════
  PERFIL DO ATLETA
══════════════════════════════════════════
Nome: ${p.name || '—'} | Idade: ${p.age || '—'}a | Sexo: ${p.sex === 'male' ? 'M' : 'F'}
Peso: ${p.weight || '—'}kg | Altura: ${p.height || '—'}cm
TMB: ~${Math.round(bmr)} kcal | TDEE: ~${tdee} kcal
Frequência: ${ACTIVITY_DAYS[String(p.activity || '1.55')] || '4–5 dias/semana'}

OBJETIVOS: ${goals.map(id => GOAL_LABELS[id] || id).join(' + ') || 'não informado'}
LOCAIS: ${gymTypes.map(id => GYM_LABELS[id] || id).join(' | ') || 'não informado'}
EQUIPAMENTOS: ${gymTypes.map(id => GYM_EQUIPMENT[id] || id).join(' | ') || 'não informado'}
══════════════════════════════════════════`
}

const ABSOLUTE_RULES = `REGRAS ABSOLUTAS:
1. Nunca sugira mais dias que a frequência declarada
2. Use APENAS equipamentos disponíveis nos locais declarados
3. Todo planejamento termina com disclaimer legal`

const JSON_RULE = `REGRA JSON — TREINO:
Gere [TREINO_JSON] apenas quando o planejamento estiver completo.
[TREINO_JSON]{"nome":"Push A","duracao":"55-70 min","foco":"Peito, Ombro, Tríceps","exercicios":[{"nome":"Supino Reto","series":4,"reps":"6-10","rir":"RIR 2","descanso":"2-3 min","dica":"Cotovelos a 45°"}],"observacoes":"⚠️ Consulte um profissional CREF."}[/TREINO_JSON]

REGRA JSON — DIETA:
[DIETA_JSON]{"objetivo":"Ganho","calorias_totais":2800,"proteina_total":180,"carboidrato_total":320,"gordura_total":80,"refeicoes":[{"nome":"Café da Manhã","horario":"07:00","calorias":600,"proteina":35,"carboidrato":75,"gordura":15,"alimentos":["3 ovos","2 fatias pão integral"]}],"observacoes":"⚠️ Consulte um nutricionista."}[/DIETA_JSON]`

function buildFreePrompt() {
  return `Você é o Health Coach AI do Health OS. Responda SEMPRE em português brasileiro. Direto e motivador.
Antes de montar um planejamento, pergunte: local de treino, músculo do dia, frequência semanal — em UMA única mensagem.
${ABSOLUTE_RULES}
${JSON_RULE}
Todo planejamento termina com: "⚠️ Consulte um profissional CREF antes de iniciar."`
}

function buildDailyDataBlock(p) {
  const lines = ['══════════════════════════════════════════', '  DADOS ATUAIS DO DIA', '══════════════════════════════════════════']
  // Água
  if (p.todayWater != null && p.waterGoal) lines.push(`💧 Água: ${p.todayWater}ml / ${p.waterGoal}ml (${Math.round((p.todayWater / p.waterGoal) * 100)}%)`)
  else lines.push('💧 Água: NÃO REGISTRADA HOJE')
  // Calorias
  if (p.todayKcal != null && p.tdee) lines.push(`🔥 Calorias: ${p.todayKcal} consumidas / ${p.tdee} TDEE | Saldo: ${p.remainingKcal > 0 ? p.remainingKcal + ' kcal restantes' : Math.abs(p.remainingKcal) + ' kcal ACIMA do TDEE'}`)
  else lines.push('🔥 Calorias: NÃO REGISTRADAS HOJE')
  // Macros
  if (p.todayProtein || p.todayCarbs || p.todayFat) lines.push(`🥩 Macros: P ${p.todayProtein || 0}g | C ${p.todayCarbs || 0}g | G ${p.todayFat || 0}g`)
  // Sono
  if (p.lastSleepHours) lines.push(`🛌 Sono (última noite): ${p.lastSleepHours}h`)
  else lines.push('🛌 Sono: NÃO REGISTRADO')
  // Passos
  if (p.todaySteps != null) lines.push(`👟 Passos: ${p.todaySteps} / 10.000 (${Math.round((p.todaySteps / 10000) * 100)}%)`)
  else lines.push('👟 Passos: NÃO REGISTRADOS')
  // Treino
  if (p.todayWorkoutDone) lines.push(`💪 Treino de hoje: ✅ FEITO${p.todayWorkoutName ? ` (${p.todayWorkoutName})` : ''}`)
  else if (p.todayWorkoutName) lines.push(`💪 Treino de hoje: ⏳ PENDENTE (${p.todayWorkoutName})`)
  else lines.push('💪 Treino de hoje: NÃO REGISTRADO')
  lines.push('══════════════════════════════════════════')
  return lines.join('\n')
}

const MOTOR_ANALISE = `══════════════════════════════════════════
 MOTOR DE ANÁLISE DE DADOS PESSOAIS
══════════════════════════════════════════
Você tem acesso em tempo real aos dados de saúde do usuário. SEMPRE que ele fizer uma pergunta sobre si mesmo, seu progresso, se pode comer algo, se deve treinar, ou relatar cansaço, siga este fluxo:

1. LEIA O CONTEXTO: Analise os dados injetados (Água, Calorias/Saldo, Sono, Passos, Treinos, Bioimpedância).
2. RESPOSTA BASEADA EM FATOS: NUNCA dê resposta genérica se você tem o dado exato. Cite os NÚMEROS dele.
3. CRUZAMENTO DE MÉTRICAS (Efeito Dominó):
   - DIETA/DOCE/FOME → Olhe Calorias (Saldo) e Macros. Se houver saldo, diga que pode encaixar. Se não, sugira alternativa.
   - FADIGA/CANSAÇO → Olhe Sono, Frequência de Treinos (overtraining) e Hidratação.
   - EVOLUÇÃO → Olhe Bioimpedância (Gordura vs Massa Muscular) e IMC.
4. DADOS AUSENTES: Se a métrica está zerada ou não informada, NÃO INVENTE. Diga: "Você ainda não registrou [Métrica] hoje no Health OS. Vá na aba de [Nome da Aba] e registre."
══════════════════════════════════════════`

const REGRAS_MOBILE = `FORMATO DE RESPOSTA (PWA MOBILE):
- NUNCA envie blocos de texto gigantes.
- Parágrafos de no máximo 2 a 3 linhas.
- Use emojis com moderação para quebrar o visual (💧, ⚡, 🥩, 🛌).
- Vá direto ao ponto. Seja como um treinador de elite segurando a prancheta.`

const REGRA_RPG = `SISTEMA DE RPG (PERFIL DE FITNESS):
O usuário possui 6 atributos: Força, Cardio, Flexibilidade, Resistência, Equilíbrio, Velocidade.
Quando o usuário pedir check-in, relatar treino, ou perguntar da evolução, avalie e gere pontos de XP:
- Treino de hipertrofia intenso/bateu PR? +Força, +Resistência.
- Bateu meta de passos ou fez corrida? +Cardio, +Velocidade.
- Fez yoga/mobilidade? +Flexibilidade, +Equilíbrio.
- Não dormiu bem ou furou dieta? -Resistência, -Força.

Sempre que fizer sentido atualizar atributos (final do dia, após relato de treino, check-in), gere ESTE bloco JSON:

[FITNESS_PROFILE_JSON]
{"forca":2,"cardio":1,"flexibilidade":-1,"resistencia":1,"equilibrio":0,"velocidade":0,"feedback":"Texto curto explicando os pontos."}
[/FITNESS_PROFILE_JSON]

IMPORTANTE: Gere o bloco APENAS quando fizer sentido (check-in, relato de treino, evolução). NÃO gere em perguntas genéricas.`

function buildProPrompt(p, lastMessage) {
  const ctx = buildProfileBlock(p)
  const dailyData = buildDailyDataBlock(p)
  const extras = [
    p.weeklyStats ? `ESTA SEMANA: ${p.weeklyStats}` : '',
    p.muscleRecoveryReport ? `\n[RECUPERAÇÃO]\n${p.muscleRecoveryReport}` : '',
    p.progressiveOverloadReport ? `\n[SOBRECARGA]\n${p.progressiveOverloadReport}` : '',
    p.plateauReport ? `\n${p.plateauReport}` : '',
    p.autoRegulationReport ? `\n${p.autoRegulationReport}` : '',
    p.avgSleep ? `Sono médio (7d): ${p.avgSleep}h` : '',
    p.lastBio ? `Bioimpedância: gordura ${p.lastBio.gordura || '?'}%, músculo ${p.lastBio.musculo || '?'}%` : '',
  ].filter(Boolean).join('\n')
  return `Você é o Health Coach AI PRO do Health OS. Responda SEMPRE em português brasileiro. Totalmente personalizado para ${p.name || 'seu atleta'}.
${ctx}
${dailyData}
${MOTOR_ANALISE}
${REGRAS_MOBILE}
${extras}
${ABSOLUTE_RULES}
${JSON_RULE}
${REGRA_RPG}
NÃO faça perguntas básicas — os dados do perfil já estão disponíveis. Use diretamente.`
}