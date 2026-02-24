// Gerenciamento de tema claro/escuro
const THEME_KEY = 'healthos_theme'

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function setTheme(t) {
  localStorage.setItem(THEME_KEY, t)
  applyTheme(t)
}

export function applyTheme(t) {
  const root = document.documentElement
  if (t === 'light') {
    root.style.setProperty('--bg',       '#f0f2f5')
    root.style.setProperty('--bg-card',  'rgba(255,255,255,0.9)')
    root.style.setProperty('--text',     '#1a1a2e')
    root.style.setProperty('--muted',    '#888')
    root.style.setProperty('--dim',      '#bbb')
    root.style.setProperty('--green',    '#00aa55')
    root.style.setProperty('--cyan',     '#0099cc')
    root.style.setProperty('--red',      '#cc3333')
    root.style.setProperty('--orange',   '#cc7700')
    root.style.setProperty('--peach',    '#aa6633')
    root.style.setProperty('--teal',     '#009988')
    root.style.setProperty('--sidebar-bg', 'rgba(240,242,245,0.97)')
    root.style.setProperty('--sidebar-border', 'rgba(0,170,85,0.15)')
    root.style.setProperty('--input-bg', 'rgba(0,0,0,0.04)')
    root.style.setProperty('--card-bg',  'rgba(255,255,255,0.85)')
  } else {
    root.style.setProperty('--bg',       '#060608')
    root.style.setProperty('--bg-card',  'rgba(0,0,0,0.6)')
    root.style.setProperty('--text',     '#e0e0e0')
    root.style.setProperty('--muted',    '#666')
    root.style.setProperty('--dim',      '#333')
    root.style.setProperty('--green',    '#00ff88')
    root.style.setProperty('--cyan',     '#00d4ff')
    root.style.setProperty('--red',      '#ff6b6b')
    root.style.setProperty('--orange',   '#ff9f43')
    root.style.setProperty('--peach',    '#f7c59f')
    root.style.setProperty('--teal',     '#4ecdc4')
    root.style.setProperty('--sidebar-bg', 'rgba(0,0,0,0.85)')
    root.style.setProperty('--sidebar-border', 'rgba(0,255,136,0.07)')
    root.style.setProperty('--input-bg', 'rgba(0,255,136,0.04)')
    root.style.setProperty('--card-bg',  'rgba(0,0,0,0.6)')
  }
}
