import { useState, useEffect } from 'react'
import { NeonCard } from '../components/UI'
import { getFoodLog, getSleepLog, getTodaySteps, getTodayWater, getWorkoutLogs, today } from '../lib/db'
import { PROGRAMS } from '../data/workouts'

const R = '#dc2626'
const R2 = '#ef4444'
const S = '#94a3b8'
const G = '#22c55e'
const SL = '#6366f1'

// Map weekday (Mon=0...Sun=6) to a program day
function getTodayProgramDay(program) {
  if (!program?.days?.length) return null
  const dow = (new Date().getDay() + 6) % 7   // 0=Mon … 6=Sun
  if (dow >= program.days.length) return null  // rest day
  return program.days[dow]
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 769)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 769)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// Ring SVG for calories progress
function ProgressRing({ pct, color, size = 64, stroke = 5 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  )
}

export default function Dashboard({ user, userId, onNavigate }) {
  const [foodLog, setFoodLog] = useState([])
  const [sleepLog, setSleepLog] = useState([])
  const [todaySteps, setTodaySteps] = useState(0)
  const [todayWater, setTodayWater] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  const programKey = user.program || 'upperLower5'
  const program = PROGRAMS[programKey]
  const todayDay = getTodayProgramDay(program)
  const isRestDay = !todayDay

  const bmr = user.sex === 'male'
    ? 88.36 + 13.4 * user.weight + 4.8 * user.height - 5.7 * user.age
    : 447.6 + 9.2 * user.weight + 3.1 * user.height - 4.3 * user.age
  const tdee = Math.round(bmr * (user.activity || 1.55))
  const waterGoal = Math.round(user.weight * 35)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getFoodLog(userId, today()).catch(() => []),
      getSleepLog(userId, 1).catch(() => []),
      getTodaySteps(userId).catch(() => 0),
      getTodayWater(userId).catch(() => 0),
      getWorkoutLogs(userId, 60).catch(() => []),
    ]).then(([food, sleep, steps, water, logs]) => {
      setFoodLog(food)
      setSleepLog(sleep)
      setTodaySteps(steps ?? 0)
      setTodayWater(water ?? 0)
      // calc streak
      const trainDays = new Set(logs.filter(l => l.completed).map(l => l.date))
      let s = 0, d = new Date()
      for (let i = 0; i < 60; i++) {
        const ds = d.toISOString().split('T')[0]
        if (!trainDays.has(ds)) { if (i > 0) break }
        else s++
        d.setDate(d.getDate() - 1)
      }
      setStreak(s)
      setLoading(false)
    })
  }, [userId])

  const totalKcal = foodLog.reduce((s, e) => s + e.calories, 0)
  const lastSleep = sleepLog[0]
  const bmi = (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
  const calPct = tdee ? Math.min((totalKcal / tdee) * 100, 100) : 0
  const waterPct = waterGoal ? Math.min((todayWater / waterGoal) * 100, 100) : 0
  const stepsPct = Math.min((todaySteps / 10000) * 100, 100)
  const waterCups = Math.round(waterGoal / 250)

  const weekday = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div className="animate-fade" style={{ maxWidth: 620 }}>

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: '#333', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 5 }}>
          {weekday.toUpperCase()}
        </div>
        <div style={{ color: '#d0d0d0', fontSize: isMobile ? 20 : 24, fontWeight: 700 }}>
          Olá, {user.name?.split(' ')[0]} 👋
        </div>
      </div>

      {/* ── HERO: Treino do dia ───────────────────────────────────── */}
      {!isRestDay ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(220,38,38,0.14) 0%, rgba(220,38,38,0.04) 100%)',
            border: '1px solid rgba(220,38,38,0.28)',
            borderRadius: 12,
            padding: '20px 22px',
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(220,38,38,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 40, width: 60, height: 60, borderRadius: '50%', background: 'rgba(220,38,38,0.04)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: R, color: '#fff', fontSize: 9, letterSpacing: 2, padding: '3px 8px', borderRadius: 3, fontFamily: 'monospace' }}>
              TREINO DO DIA
            </span>
            <span style={{ background: `${todayDay.color}18`, color: todayDay.color, fontSize: 9, letterSpacing: 2, padding: '3px 8px', borderRadius: 3, fontFamily: 'monospace', border: `1px solid ${todayDay.color}30` }}>
              {todayDay.tag}
            </span>
          </div>

          <div style={{ color: '#e0e0e0', fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 4 }}>
            {todayDay.name}
          </div>
          <div style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>
            {program?.name} · Foco em {todayDay.focus}
          </div>

          {/* Exercise chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {todayDay.exercises?.slice(0, isMobile ? 3 : 5).map((ex, i) => (
              <div key={i} style={{
                padding: '3px 10px', background: 'rgba(220,38,38,0.09)',
                border: '1px solid rgba(220,38,38,0.18)', borderRadius: 4,
                color: '#777', fontSize: 10, whiteSpace: 'nowrap',
              }}>
                {ex.name}
              </div>
            ))}
            {todayDay.exercises?.length > (isMobile ? 3 : 5) && (
              <div style={{ padding: '3px 10px', color: '#444', fontSize: 10 }}>
                +{todayDay.exercises.length - (isMobile ? 3 : 5)} exercícios
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate?.('workout')}
            style={{
              width: '100%', padding: '14px 0',
              background: R, border: 'none', borderRadius: 8,
              color: '#fff', fontFamily: "'Space Mono',monospace",
              fontSize: 13, fontWeight: 700, letterSpacing: 3,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, transition: 'all 0.2s',
              boxShadow: `0 4px 20px rgba(220,38,38,0.3)`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(220,38,38,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.background = R; e.currentTarget.style.boxShadow = '0 4px 20px rgba(220,38,38,0.3)' }}
          >
            ⚡ INICIAR TREINO
          </button>
        </div>
      ) : (
        <NeonCard color={S} style={{ padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ color: S, fontSize: 9, letterSpacing: 3, marginBottom: 6 }}>DIA DE DESCANSO</div>
          <div style={{ color: '#d0d0d0', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Recuperação Ativa 😌</div>
          <div style={{ color: '#555', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
            Caminhada leve, mobilidade ou descanso total. O músculo cresce fora do treino.
          </div>
          <button onClick={() => onNavigate?.('activity')}
            style={{ padding: '10px 20px', background: `${S}10`, border: `1px solid ${S}30`, borderRadius: 6, color: S, fontFamily: "'Space Mono',monospace", fontSize: 11, cursor: 'pointer', letterSpacing: 2 }}>
            VER CARDIO →
          </button>
        </NeonCard>
      )}

      {/* ── Daily Progress ────────────────────────────────────────── */}
      <NeonCard color={R} style={{ padding: '18px 22px', marginBottom: 14 }}>
        <div style={{ color: '#333', fontSize: 9, letterSpacing: 3, marginBottom: 16 }}>PROGRESSO DO DIA</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Calorias */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ProgressRing pct={calPct} color={calPct >= 95 ? R : S} size={52} stroke={5} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#888', fontSize: 12 }}>🔥 Calorias</span>
                <span style={{ color: calPct >= 95 ? R2 : S, fontSize: 12, fontWeight: 700 }}>
                  {totalKcal.toLocaleString('pt-BR')} / {tdee.toLocaleString('pt-BR')} kcal
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <div style={{ width: `${calPct}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${R}70,${R})`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>

          {/* Água */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>💧</span>
              <span style={{ color: S, fontSize: 9, fontWeight: 700 }}>{Math.round(waterPct)}%</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#888', fontSize: 12 }}>Água</span>
                <span style={{ color: S, fontSize: 12, fontWeight: 700 }}>{todayWater}ml / {waterGoal}ml</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: Math.min(waterCups, 14) }).map((_, i) => {
                  const filled = i < Math.round(todayWater / 250)
                  return <div key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: filled ? S : 'rgba(255,255,255,0.05)', transition: 'background 0.3s' }} />
                })}
              </div>
            </div>
          </div>

          {/* Passos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ProgressRing pct={stepsPct} color={stepsPct >= 100 ? G : S} size={52} stroke={5} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#888', fontSize: 12 }}>👟 Passos</span>
                <span style={{ color: stepsPct >= 100 ? G : S, fontSize: 12, fontWeight: 700 }}>
                  {todaySteps.toLocaleString('pt-BR')} / 10.000
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <div style={{ width: `${stepsPct}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${S}70,${S})`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </NeonCard>

      {/* ── Quick metrics ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          {
            icon: '⚖️', label: 'IMC',
            value: bmi,
            color: +bmi < 18.5 ? S : +bmi < 25 ? G : +bmi < 30 ? '#f59e0b' : R2,
          },
          {
            icon: '😴', label: 'SONO',
            value: lastSleep ? `${lastSleep.hours}h` : '—',
            color: lastSleep ? (+lastSleep.hours >= 7 ? G : +lastSleep.hours >= 5 ? '#f59e0b' : R2) : S,
          },
          {
            icon: '🔥', label: 'SEQUÊNCIA',
            value: streak > 0 ? `${streak}d` : '—',
            color: streak >= 7 ? G : streak >= 3 ? '#f59e0b' : S,
          },
        ].map(s => (
          <NeonCard key={s.label} color={s.color} style={{ padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#444', fontSize: 8, letterSpacing: 2, marginTop: 5, textTransform: 'uppercase' }}>{s.label}</div>
          </NeonCard>
        ))}
      </div>

      {/* ── Quick nav ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Dieta', icon: '🍽', page: 'calories' },
          { label: 'Calendário', icon: '📅', page: 'calendar' },
          { label: 'Água', icon: '💧', page: 'water' },
          { label: 'Perfil', icon: '👤', page: 'profile' },
        ].map(n => (
          <button key={n.page} onClick={() => onNavigate?.(n.page)}
            style={{
              padding: '12px 4px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
              cursor: 'pointer', fontFamily: "'Space Mono',monospace",
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          >
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ color: '#444', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}