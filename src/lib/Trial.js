// ─── Helpers de trial / assinatura ───────────────────────────────────────────
// Separado de App.jsx para evitar importações circulares.
// Import aqui em vez de em App.jsx quando precisar dessas funções.

export function isTrialActive(profile) {
  if (!profile) return false
  if (profile.is_premium) return true
  const start = profile.trial_start_date ? new Date(profile.trial_start_date) : null
  if (!start) return true // sem data = novo usuário, trial ativo
  return (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24) <= 30
}

export function trialDaysLeft(profile) {
  if (profile?.is_premium) return null
  const start = profile?.trial_start_date ? new Date(profile.trial_start_date) : null
  if (!start) return 30
  return Math.max(0, 30 - Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)))
}