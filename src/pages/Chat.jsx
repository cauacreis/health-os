import { useState, useEffect, useRef } from 'react'
import { NeonCard } from '../components/UI'
import { getSleepLog, getBioLog, getCalendar, addCalendarEntry, today } from '../lib/db'

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY
const R  = '#dc2626'
const R2 = '#ef4444'
const S  = '#94a3b8'

const FREE_LIMIT = 5

const SUGGESTIONS_FREE = [
  'Quanto tempo descansar entre séries?',
  'O que é déficit calórico?',
  'Quantas proteínas devo comer por dia?',
  'Como melhorar minha qualidade de sono?',
]

const SUGGESTIONS_PRO = [
  'Monta um treino de hipertrofia pra hoje baseado em ciência',
  'Como tá minha evolução recente?',
  'O que minha bioimpedância indica?',
  'Faz um checkin da minha semana',
  'Monta um cardápio com minha meta calórica',
]

function parseWorkout(content) {
  const match = content.match(/\[TREINO_JSON\]([\s\S]*?)\[\/TREINO_JSON\]/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}

function stripWorkoutJson(content) {
  return content.replace(/\[TREINO_JSON\][\s\S]*?\[\/TREINO_JSON\]/g, '').trim()
}

function getTodayUsage() {
  return parseInt(localStorage.getItem(`chat_${today()}`) || '0', 10)
}
function incrementUsage() {
  localStorage.setItem(`chat_${today()}`, String(getTodayUsage() + 1))
}

export default function Chat({ user, userId }) {
  const isPro     = user?.isPro || false
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [usage,     setUsage]     = useState(0)
  const [profile,   setProfile]   = useState(null)
  const [ctxLoaded, setCtxLoaded] = useState(false)

  const remaining = FREE_LIMIT - usage
  const limitHit  = !isPro && usage >= FREE_LIMIT

  // Boas-vindas
  useEffect(() => {
    setUsage(getTodayUsage())
    setMessages([{
      role: 'assistant',
      content: isPro
        ? `Olá, ${user?.name || 'atleta'}! 💪 Sou seu assistente PRO. Tenho acesso aos seus dados e posso te ajudar com treinos, dieta e análise do seu progresso. O que quer saber?`
        : `Olá! 👋 Sou o Health Assistant. Posso responder dúvidas sobre treino, nutrição e saúde.\n\n💡 Plano FREE: ${FREE_LIMIT} mensagens por dia. Assine o PRO para ilimitado + análise personalizada dos seus dados.`,
    }])
  }, [isPro])

  // Carrega contexto PRO
  useEffect(() => {
    if (isPro && userId && !ctxLoaded) loadContext()
  }, [isPro, userId])

  async function loadContext() {
    try {
      const [sleepLogs, bioLog, calendar] = await Promise.all([
        getSleepLog(userId, 7).catch(() => []),
        getBioLog(userId, 1).catch(() => []),
        getCalendar(userId).catch(() => []),
      ])

      const avgSleep = sleepLogs.length
        ? (sleepLogs.reduce((s, e) => s + +e.hours, 0) / sleepLogs.length).toFixed(1)
        : null

      const lastBio = bioLog[0] ? {
        gordura:  bioLog[0].body_fat,
        musculo:  bioLog[0].muscle_mass,
        visceral: bioLog[0].visceral_fat,
        agua:     bioLog[0].water_pct,
      } : null

      const now      = new Date()
      const thisWeek = calendar.filter(e => (now - new Date(e.date)) / 86400000 <= 7)
      const weeklyStats = `${thisWeek.filter(e => e.type === 'workout').length} treinos, ${thisWeek.filter(e => e.type === 'cardio').length} cardios, ${thisWeek.filter(e => e.type === 'sleep').length} noites registradas`
      const recentWorkouts = calendar
        .filter(e => e.type === 'workout' || e.type === 'cardio')
        .slice(0, 5)
        .map(e => `${e.date}: ${e.type}${e.note ? ` (${e.note})` : ''}`)
        .join(' | ') || null

      setProfile({
        name: user?.name, age: user?.age, sex: user?.sex,
        weight: user?.weight, height: user?.height,
        goal: user?.goal, activity: user?.activity,
        avgSleep, lastBio, weeklyStats, recentWorkouts,
      })
    } catch (e) { console.error('loadContext:', e) }
    setCtxLoaded(true)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading || limitHit) return
    setInput('')

    if (!isPro) { incrementUsage(); setUsage(getTodayUsage()) }

    const history = [...messages, { role: 'user', content: msg }]
    setMessages(history)
    setLoading(true)

    try {
      const systemPrompt = isPro && profile ? buildProPrompt(profile) : buildFreePrompt()
      const trimmed = history.slice(-10)

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model:      'llama-3.1-8b-instant',
          max_tokens: 800,
          messages: [
            { role: 'system', content: systemPrompt },
            ...trimmed,
          ],
        }),
      })

      const data = await res.json()
      console.log('Groq response:', JSON.stringify(data))
      if (data?.error) {
        setMessages(m => [...m, { role: 'assistant', content: '❌ Erro: ' + (data.error?.message || JSON.stringify(data.error)) }])
      } else {
        const reply = data?.choices?.[0]?.message?.content ?? 'Sem resposta.'
        setMessages(m => [...m, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      console.error(e)
      setMessages(m => [...m, { role: 'assistant', content: '❌ Erro de conexão. Verifique sua internet e tente novamente.' }])
    }

    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const suggestions     = isPro ? SUGGESTIONS_PRO : SUGGESTIONS_FREE
  const showSuggestions = messages.length <= 1

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 120px)', maxHeight: 700 }}>

      {/* Header */}
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: R, fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>
              ASSISTENTE {isPro && <span style={{ fontSize: 11, background: 'rgba(220,38,38,0.15)', border: `1px solid ${R}40`, padding: '2px 8px', borderRadius: 3, letterSpacing: 2, verticalAlign: 'middle' }}>PRO</span>}
            </div>
            <div style={{ color: '#555', fontSize: 10, letterSpacing: 2, marginTop: 4 }}>HEALTH AI · POWERED BY GROQ</div>
          </div>
          {!isPro && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: remaining > 0 ? S : R2, fontSize: 18, fontWeight: 700 }}>{Math.max(remaining, 0)}</div>
              <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>MSG RESTANTES</div>
            </div>
          )}
        </div>

        {/* Barra de uso free */}
        {!isPro && (
          <div style={{ height: 3, background: '#111', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: `${(usage / FREE_LIMIT) * 100}%`, height: '100%', background: remaining > 1 ? R : R2, borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>

        {messages.map((m, i) => {
          const workout = m.role === 'assistant' ? parseWorkout(m.content) : null
          const displayContent = workout ? stripWorkoutJson(m.content) : m.content
          return (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${m.role === 'user' ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: m.role === 'user' ? '#f0f0f0' : '#d0d0d0',
                fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {m.role === 'assistant' && (
                  <div style={{ color: R, fontSize: 9, letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>◈ HEALTH AI</div>
                )}
                {displayContent}
              </div>
              {workout && (
                <WorkoutSaveCard workout={workout} userId={userId} />
              )}
            </div>
          )
        })}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '12px 12px 12px 2px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: R, opacity: 0.7, animation: `ping 1s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Limite atingido */}
        {limitHit && (
          <NeonCard color={R} style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
            <div style={{ color: '#d0d0d0', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Limite diário atingido</div>
            <div style={{ color: '#555', fontSize: 11, marginBottom: 14 }}>Assine o PRO para mensagens ilimitadas + análise personalizada dos seus dados.</div>
            <button className="btn" onClick={() => window.dispatchEvent(new CustomEvent('goto-tab', { detail: 'subscription' }))}
              style={{ background: 'rgba(220,38,38,0.15)', borderColor: R, color: R2, padding: '10px 24px', fontSize: 11, letterSpacing: 2 }}>
              VER PLANOS →
            </button>
          </NeonCard>
        )}

        {/* Sugestões */}
        {showSuggestions && !limitHit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <div style={{ color: '#333', fontSize: 9, letterSpacing: 2 }}>SUGESTÕES</div>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)}
                style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 14px', color: '#666', fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace", transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#999' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#666' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={limitHit ? 'Limite diário atingido...' : 'Escreva sua pergunta...'}
            disabled={limitHit || loading}
            className="input"
            style={{ flex: 1, fontSize: 13, borderColor: input ? 'rgba(220,38,38,0.3)' : undefined, opacity: limitHit ? 0.4 : 1 }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading || limitHit}
            style={{ background: input.trim() && !limitHit ? 'rgba(220,38,38,0.2)' : 'transparent', border: `1px solid ${input.trim() && !limitHit ? R : '#222'}`, color: input.trim() && !limitHit ? R2 : '#333', borderRadius: 6, padding: '0 16px', cursor: 'pointer', fontSize: 16, transition: 'all 0.15s', flexShrink: 0 }}>
            ➤
          </button>
        </div>
        <div style={{ color: '#333', fontSize: 9, letterSpacing: 1, marginTop: 6, textAlign: 'center' }}>
          {isPro ? 'MENSAGENS ILIMITADAS · LLAMA 3.1 VIA GROQ' : `${Math.max(remaining, 0)} DE ${FREE_LIMIT} MENSAGENS RESTANTES HOJE`}
        </div>
      </div>
    </div>
  )
}

// ── WorkoutSaveCard ───────────────────────────────────────────
function WorkoutSaveCard({ workout, userId }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const note = workout.exercicios
        ? workout.exercicios.map(e => `${e.nome} ${e.series}x${e.reps}`).join(' · ')
        : workout.nome
      await addCalendarEntry(userId, {
        date: today(),
        type: 'workout',
        label: 'Treino',
        note: `${workout.nome || 'Treino IA'}: ${note}`.slice(0, 200),
      })
      setSaved(true)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '85%', marginTop: 8, padding: '14px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
      <div style={{ color: R, fontSize: 9, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>💪 TREINO GERADO PELA IA</div>
      <div style={{ color: '#d0d0d0', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{workout.nome}</div>
      {workout.exercicios?.map((ex, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
          <span style={{ color: '#aaa' }}>{ex.nome}</span>
          <span style={{ color: R2, fontWeight: 700 }}>{ex.series}x{ex.reps} · {ex.descanso}</span>
        </div>
      ))}
      {workout.observacoes && (
        <div style={{ color: '#555', fontSize: 11, marginTop: 8 }}>📝 {workout.observacoes}</div>
      )}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{ marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 6, border: `1px solid ${saved ? '#22c55e' : R}`, background: saved ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.12)', color: saved ? '#22c55e' : R2, fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2, cursor: saved ? 'default' : 'pointer', transition: 'all 0.3s' }}>
        {saving ? 'SALVANDO...' : saved ? '✓ SALVO NA AGENDA!' : '📅 SALVAR NA AGENDA'}
      </button>
    </div>
  )
}

// ── System prompts ────────────────────────────────────────────

const HYPERTROPHY_SCIENCE = `
FUNDAMENTOS CIENTÍFICOS DE HIPERTROFIA (use em TODOS os treinos gerados):

1. SOBRECARGA PROGRESSIVA: O músculo só cresce com estímulo maior que o habitual. Oriente sempre a progredir por carga, repetições ou qualidade de execução.

2. PROXIMIDADE DA FALHA (RIR): Séries efetivas ficam a 1-3 repetições da falha (RIR 1-3). Falha total apenas na última série, para não prejudicar o volume total.

3. VOLUME SEMANAL: 10-20 séries semanais por grupo muscular é o sweet spot. Divida em 2x/semana por músculo (Push/Pull/Legs ou Upper/Lower) para maximizar síntese proteica.

4. AMPLITUDE DE MOVIMENTO (ROM): Sempre amplitude completa. A hipertrofia mediada por alongamento (posição de maior stretch) é potentíssima — enfatize o alongamento no movimento.

5. SELEÇÃO DE EXERCÍCIOS: Prefira máquinas e cabos para maior estabilidade e isolamento. Exercícios compostos livres para base de força. Combine os dois.

6. DESCANSO ENTRE SÉRIES: 90 segundos a 3 minutos entre séries (não 30-45s como o mito da "queimação"). Exercícios compostos pesados: até 3-4 min.

FORMATO OBRIGATÓRIO AO GERAR TREINO:
Após a explicação textual, inclua SEMPRE um bloco JSON no seguinte formato EXATO:
[TREINO_JSON]
{
  "nome": "Nome do treino (ex: Push A - Empurrar)",
  "duracao": "45-60 min",
  "foco": "Peito, Ombro, Tríceps",
  "exercicios": [
    { "nome": "Supino Reto", "series": 4, "reps": "8-12", "rir": "RIR 2", "descanso": "2-3 min", "dica": "Desça até o alongamento total do peitoral" },
    { "nome": "Crucifixo no Cabo", "series": 3, "reps": "12-15", "rir": "RIR 1", "descanso": "90s", "dica": "Enfatize a posição de maior abertura" }
  ],
  "observacoes": "Foco em amplitude total. Progrida em carga ou reps a cada semana."
}
[/TREINO_JSON]
`

function buildFreePrompt() {
  return `Você é o Health Assistant do Health OS, um app brasileiro de saúde e fitness.
Responda SEMPRE em português brasileiro, de forma direta e prática.
Foque em dúvidas gerais sobre treino, nutrição, saúde e bem-estar.
Seja conciso — máximo 3 parágrafos por resposta.
Não invente dados científicos. Se não souber, diga claramente.
Quando gerar treinos, aplique os princípios científicos de hipertrofia:
${HYPERTROPHY_SCIENCE}
Quando relevante, mencione que o plano PRO oferece análise personalizada dos dados do usuário.`
}

function buildProPrompt(p) {
  const sexLabel  = p.sex === 'male' ? 'masculino' : p.sex === 'female' ? 'feminino' : 'não informado'
  const goalLabel = p.goal === 'lose' ? 'perder peso' : p.goal === 'gain' ? 'ganhar massa' : p.goal === 'maintain' ? 'manter peso' : p.goal ?? 'não informado'
  const bmr  = p.sex === 'male'
    ? 88.36 + 13.4 * (p.weight||70) + 4.8 * (p.height||170) - 5.7 * (p.age||30)
    : 447.6  + 9.2  * (p.weight||70) + 3.1 * (p.height||170) - 4.3 * (p.age||30)
  const tdee = Math.round(bmr * (p.activity||1.55))

  return `Você é o Health Assistant PRO do Health OS, personal trainer e nutricionista virtual de ${p.name ?? 'seu usuário'}.
Responda SEMPRE em português brasileiro. Seja direto, prático e personalizado.

DADOS DO USUÁRIO:
- Nome: ${p.name ?? '—'} | Idade: ${p.age ?? '—'} anos | Sexo: ${sexLabel}
- Peso: ${p.weight ?? '—'}kg | Altura: ${p.height ?? '—'}cm
- Objetivo: ${goalLabel}
- TMB: ~${Math.round(bmr)} kcal | TDEE: ~${tdee} kcal
${p.avgSleep     ? `- Média de sono (7 dias): ${p.avgSleep}h` : ''}
${p.lastBio      ? `- Última bioimpedância: gordura ${p.lastBio.gordura ?? '?'}%, músculo ${p.lastBio.musculo ?? '?'}%, visceral ${p.lastBio.visceral ?? '?'}, água ${p.lastBio.agua ?? '?'}%` : ''}
${p.weeklyStats  ? `- Esta semana: ${p.weeklyStats}` : ''}
${p.recentWorkouts ? `- Treinos recentes: ${p.recentWorkouts}` : ''}

CIÊNCIA DE HIPERTROFIA:
${HYPERTROPHY_SCIENCE}

INSTRUÇÕES GERAIS:
- Use os dados acima para respostas específicas e personalizadas, nunca genéricas.
- Máximo 4 parágrafos + bloco JSON quando gerar treino.
- Trate o usuário pelo nome quando fizer sentido.
- Não invente dados. Se algo não estiver nos dados, diga que não tem a informação.
- Ao gerar treino, SEMPRE inclua o bloco [TREINO_JSON]...[/TREINO_JSON] no final.`
}