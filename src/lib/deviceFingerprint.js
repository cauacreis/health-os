// src/lib/deviceFingerprint.js
// Gera um fingerprint estável do dispositivo para limitar 1 trial por device.
// Não é perfeito (VPN/modo privado pode burlar), mas é o suficiente para uso casual.

/**
 * Gera um hash simples baseado em características estáveis do navegador/device.
 * Persiste no localStorage para ser consistente entre sessões.
 */
export function getDeviceFingerprint() {
  const STORAGE_KEY = 'healthos_device_fp'

  // Tenta recuperar fingerprint já gerado
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  // Coleta características do dispositivo
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillText('HealthOS', 2, 2)
  const canvasHash = canvas.toDataURL().slice(-50)

  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
    navigator.deviceMemory || '',
    canvasHash,
  ].join('|')

  // Hash simples (djb2)
  let hash = 5381
  for (let i = 0; i < components.length; i++) {
    hash = ((hash << 5) + hash) + components.charCodeAt(i)
    hash = hash & hash // converte para 32bit int
  }
  const fp = Math.abs(hash).toString(36) + Date.now().toString(36)

  localStorage.setItem(STORAGE_KEY, fp)
  return fp
}

/**
 * Verifica se o dispositivo já usou trial.
 * Retorna: { used: boolean, userId: string|null }
 */
export async function checkDeviceTrialUsed(supabase) {
  try {
    const fp = getDeviceFingerprint()
    const { data, error } = await supabase
      .from('device_trials')
      .select('user_id')
      .eq('fingerprint', fp)
      .maybeSingle()

    if (error) return { used: false, userId: null }
    return { used: !!data, userId: data?.user_id || null }
  } catch {
    return { used: false, userId: null }
  }
}

/**
 * Registra o dispositivo como "trial usado" no banco.
 * Chamar após o cadastro do usuário ser concluído.
 */
export async function registerDeviceTrial(supabase, userId) {
  try {
    const fp = getDeviceFingerprint()
    await supabase.from('device_trials').upsert(
      { fingerprint: fp, user_id: userId },
      { onConflict: 'fingerprint' }
    )
    // Salva no profile também para referência
    await supabase.from('profiles')
      .update({ device_fingerprint: fp })
      .eq('id', userId)
  } catch (e) {
    console.warn('registerDeviceTrial:', e)
  }
}