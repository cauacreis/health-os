// ─── Camada de acesso ao banco (Supabase) ─────────────────────────────────────
// Todas as queries usam o cliente Supabase, que internamente usa
// prepared statements — imune a SQL injection por design.
import { supabase } from './supabase'

export function today() {
  return new Date().toISOString().split('T')[0]
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name } },
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertProfile(userId, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(userId, file) {
  const ext  = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  await upsertProfile(userId, { photo_url: data.publicUrl + '?t=' + Date.now() })
  return data.publicUrl
}

// ── Calendar ─────────────────────────────────────────────────────────────────
export async function getCalendar(userId) {
  const { data, error } = await supabase
    .from('calendar_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addCalendarEntry(userId, entry) {
  const { data, error } = await supabase
    .from('calendar_entries')
    .upsert({ user_id: userId, ...entry }, { onConflict: 'user_id,date,type' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeCalendarEntry(userId, date, type) {
  const { error } = await supabase
    .from('calendar_entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)
    .eq('type', type)
  if (error) throw error
}

// ── Workout logs ──────────────────────────────────────────────────────────────
export async function getWorkoutLogs(userId, limit = 30) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function saveWorkoutLog(userId, log) {
  const { data, error } = await supabase
    .from('workout_logs')
    .upsert({ user_id: userId, ...log })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Food log ──────────────────────────────────────────────────────────────────
export async function getFoodLog(userId, date) {
  let q = supabase.from('food_log').select('*').eq('user_id', userId)
  if (date) q = q.eq('date', date)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addFoodEntry(userId, entry) {
  const { data, error } = await supabase
    .from('food_log')
    .insert({ user_id: userId, date: today(), ...entry })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFoodEntry(userId, id) {
  const { error } = await supabase
    .from('food_log')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)   // garante que só deleta o próprio
  if (error) throw error
}

// ── Sleep log ─────────────────────────────────────────────────────────────────
export async function getSleepLog(userId, limit = 30) {
  const { data, error } = await supabase
    .from('sleep_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function saveSleepEntry(userId, entry) {
  const { data, error } = await supabase
    .from('sleep_log')
    .upsert({ user_id: userId, ...entry }, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Bio log ───────────────────────────────────────────────────────────────────
export async function getBioLog(userId, limit = 20) {
  const { data, error } = await supabase
    .from('bio_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function saveBioEntry(userId, entry) {
  const { data, error } = await supabase
    .from('bio_log')
    .insert({ user_id: userId, ...entry })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Cardio log ────────────────────────────────────────────────────────────────
export async function getCardioLog(userId, limit = 30) {
  const { data, error } = await supabase
    .from('cardio_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function saveCardioEntry(userId, entry) {
  const { data, error } = await supabase
    .from('cardio_log')
    .insert({ user_id: userId, ...entry })
    .select()
    .single()
  if (error) throw error
  return data
}
