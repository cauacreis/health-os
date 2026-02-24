const USERS_KEY = 'healthos_users'
const ACTIVE_KEY = 'healthos_active'

export function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}
export function getUserById(id) { return getUsers().find(u => u.id === id) || null }
export function saveUser(user) {
  const users = getUsers()
  const idx = users.findIndex(u => u.id === user.id)
  if (idx >= 0) users[idx] = user; else users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return user
}
export function createUser(data) {
  const user = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), stepsToday: 0, waterToday: 0, mealsToday: 0, sleepHours: 0, photo: null, bioimpedance: null, ...data }
  return saveUser(user)
}
export function deleteUser(id) {
  const users = getUsers().filter(u => u.id !== id)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  Object.keys(localStorage).forEach(k => { if (k.startsWith(`hos_${id}_`)) localStorage.removeItem(k) })
  if (getActiveUserId() === id) clearActiveUser()
}
export function updateUser(id, patch) {
  const users = getUsers()
  const user = users.find(u => u.id === id)
  if (!user) return null
  Object.assign(user, patch)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return user
}
export function getActiveUserId() { return localStorage.getItem(ACTIVE_KEY) }
export function setActiveUser(id) { localStorage.setItem(ACTIVE_KEY, id) }
export function clearActiveUser() { localStorage.removeItem(ACTIVE_KEY) }

function uk(uid, key) { return `hos_${uid}_${key}` }
function uget(uid, key, def = null) {
  try { const v = localStorage.getItem(uk(uid, key)); return v ? JSON.parse(v) : def } catch { return def }
}
function uset(uid, key, value) { localStorage.setItem(uk(uid, key), JSON.stringify(value)) }

export function today() { return new Date().toISOString().split('T')[0] }

export function getCalendar(uid) { return uget(uid, 'calendar', []) }
export function addCalendarEntry(uid, entry) {
  const cal = getCalendar(uid)
  const idx = cal.findIndex(e => e.date === entry.date && e.type === entry.type)
  if (idx >= 0) cal[idx] = { ...cal[idx], ...entry }; else cal.push(entry)
  uset(uid, 'calendar', cal)
}
export function removeCalendarEntry(uid, date, type) {
  uset(uid, 'calendar', getCalendar(uid).filter(e => !(e.date === date && e.type === type)))
}

export function getWorkoutLogs(uid) { return uget(uid, 'workoutLogs', []) }
export function saveWorkoutLog(uid, log) {
  const logs = getWorkoutLogs(uid)
  const idx = logs.findIndex(l => l.id === log.id)
  if (idx >= 0) logs[idx] = log; else logs.unshift(log)
  uset(uid, 'workoutLogs', logs.slice(0, 90))
}

export function getFoodLog(uid, date) {
  const all = uget(uid, 'foodLog', [])
  return date ? all.filter(e => e.date === date) : all
}
export function addFoodEntry(uid, entry) {
  const all = uget(uid, 'foodLog', [])
  all.unshift({ id: crypto.randomUUID(), date: today(), time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), ...entry })
  uset(uid, 'foodLog', all.slice(0, 500))
  return all[0]
}
export function deleteFoodEntry(uid, id) {
  uset(uid, 'foodLog', uget(uid, 'foodLog', []).filter(e => e.id !== id))
}

export function getSleepLog(uid) { return uget(uid, 'sleepLog', []) }
export function saveSleepEntry(uid, entry) {
  const log = getSleepLog(uid)
  const idx = log.findIndex(e => e.date === entry.date)
  if (idx >= 0) log[idx] = entry; else log.unshift(entry)
  uset(uid, 'sleepLog', log.slice(0, 180))
}

export function getBioLog(uid) { return uget(uid, 'bioLog', []) }
export function saveBioEntry(uid, entry) {
  const log = getBioLog(uid)
  const e = { id: crypto.randomUUID(), ...entry }
  log.unshift(e)
  uset(uid, 'bioLog', log.slice(0, 60))
  return e
}

export function getCardioLog(uid) { return uget(uid, 'cardioLog', []) }
export function saveCardioEntry(uid, entry) {
  const log = getCardioLog(uid)
  log.unshift({ id: crypto.randomUUID(), ...entry })
  uset(uid, 'cardioLog', log.slice(0, 180))
}
