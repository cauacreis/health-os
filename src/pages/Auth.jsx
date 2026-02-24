import { useState } from 'react'
import { signIn, signUp } from '../lib/db'

// Validações de segurança no frontend (o backend também valida)
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function validatePassword(p) { return p.length >= 8 }
function sanitize(str) { return str.replace(/[<>'"]/g, '') }

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // login | register
  const [step, setStep] = useState(1) // register step 1=creds, 2=bio
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [creds, setCreds] = useState({ email: '', password: '', confirm: '', name: '' })
  const set = (k, v) => { setCreds(c => ({ ...c, [k]: v })); setError('') }

  async function handleLogin(e) {
    e.preventDefault()
    if (!validateEmail(creds.email)) return setError('E-mail inválido')
    if (!creds.password) return setError('Senha obrigatória')
    setLoading(true)
    try {
      await signIn(creds.email, creds.password)
      // onAuth será chamado pelo listener de auth state no App.jsx
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : err.message)
    } finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!validateEmail(creds.email)) return setError('E-mail inválido')
    if (!validatePassword(creds.password)) return setError('Senha precisa ter no mínimo 8 caracteres')
    if (creds.password !== creds.confirm) return setError('Senhas não coincidem')
    if (!sanitize(creds.name).trim()) return setError('Nome obrigatório')
    setLoading(true)
    try {
      await signUp(creds.email, creds.password, sanitize(creds.name))
      setError('')
      setMode('registered')
    } catch (err) {
      if (err.message.includes('already registered')) setError('E-mail já cadastrado')
      else setError(err.message)
    } finally { setLoading(false) }
  }

  const inputStyle = (err) => ({
    background: 'rgba(0,255,136,0.04)',
    border: `1px solid ${err ? '#ff6b6b50' : 'rgba(0,255,136,0.2)'}`,
    color: '#e0e0e0',
    padding: '12px 16px',
    borderRadius: 6,
    fontFamily: 'monospace',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 16, position: 'relative', overflow: 'hidden' }}>
      {/* Grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      {/* Scanline */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00ff8830,transparent)', animation: 'scanline 5s linear infinite', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ color: '#00ff88', fontSize: 32, fontWeight: 700, letterSpacing: 6 }}>HEALTH OS</div>
          <div style={{ color: '#333', fontSize: 10, letterSpacing: 5, marginTop: 6 }}>v2.5 · BIOMETRIC SYSTEM</div>
          <div style={{ width: 120, height: 1, background: 'linear-gradient(90deg,transparent,#00ff88,transparent)', margin: '14px auto 0' }} />
        </div>

        {/* Registered confirmation */}
        {mode === 'registered' && (
          <div style={{ textAlign: 'center', padding: 32, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
            <div style={{ color: '#00ff88', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Conta criada!</div>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
              Verifique seu e-mail para confirmar o cadastro, depois faça login.
            </div>
            <button onClick={() => { setMode('login'); setCreds(c => ({ ...c, password: '', confirm: '' })) }}
              className="btn" style={{ width: '100%', background: 'rgba(0,255,136,0.15)', borderColor: '#00ff88' }}>
              IR PARA LOGIN
            </button>
          </div>
        )}

        {/* Login */}
        {mode === 'login' && (
          <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 10, padding: 32 }}>
            <div style={{ color: '#00ff88', fontSize: 11, letterSpacing: 3, marginBottom: 24 }}>ACESSO AO SISTEMA</div>
            <form onSubmit={handleLogin} autoComplete="on">
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#555', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>E-MAIL</label>
                <input type="email" value={creds.email} onChange={e => set('email', e.target.value)}
                  placeholder="seu@email.com" autoComplete="email" style={inputStyle(error && error.includes('mail'))}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: '#555', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>SENHA</label>
                <input type="password" value={creds.password} onChange={e => set('password', e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" style={inputStyle(error && error.includes('senha'))}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'} />
              </div>

              {error && (
                <div style={{ color: '#ff6b6b', fontSize: 11, marginBottom: 14, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 4 }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn"
                style={{ width: '100%', padding: 14, fontSize: 12, letterSpacing: 3, background: loading ? 'rgba(0,255,136,0.06)' : 'rgba(0,255,136,0.15)', borderColor: '#00ff88', marginBottom: 16 }}>
                {loading ? 'VERIFICANDO...' : 'ENTRAR →'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#444', fontSize: 11 }}>Não tem conta? </span>
                <button type="button" onClick={() => { setMode('register'); setError('') }}
                  style={{ background: 'none', border: 'none', color: '#00ff88', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                  CRIAR CONTA
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Register */}
        {mode === 'register' && (
          <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 10, padding: 32 }}>
            <div style={{ color: '#00ff88', fontSize: 11, letterSpacing: 3, marginBottom: 6 }}>CRIAR CONTA</div>
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 20 }}>
              Seus dados ficam protegidos e acessíveis só por você
            </div>
            <form onSubmit={handleRegister} autoComplete="off">
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#555', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>NOME</label>
                <input value={creds.name} onChange={e => set('name', e.target.value)}
                  placeholder="Seu nome" style={inputStyle()} maxLength={60}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#555', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>E-MAIL</label>
                <input type="email" value={creds.email} onChange={e => set('email', e.target.value)}
                  placeholder="seu@email.com" autoComplete="off" style={inputStyle()}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#555', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>SENHA (mínimo 8 caracteres)</label>
                <input type="password" value={creds.password} onChange={e => set('password', e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" style={inputStyle()}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'} />
                {/* Strength indicator */}
                {creds.password && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: creds.password.length >= n*3 ? (creds.password.length >= 12 ? '#00ff88' : '#ff9f43') : '#1a1a1a' }} />
                    ))}
                    <span style={{ color: '#555', fontSize: 9, letterSpacing: 1, marginLeft: 4 }}>
                      {creds.password.length < 8 ? 'FRACA' : creds.password.length < 12 ? 'OK' : 'FORTE'}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: '#555', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>CONFIRMAR SENHA</label>
                <input type="password" value={creds.confirm} onChange={e => set('confirm', e.target.value)}
                  placeholder="••••••••" autoComplete="new-password"
                  style={inputStyle(creds.confirm && creds.confirm !== creds.password)}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'} />
                {creds.confirm && creds.confirm !== creds.password && (
                  <div style={{ color: '#ff6b6b', fontSize: 10, marginTop: 4 }}>⚠ Senhas não coincidem</div>
                )}
              </div>

              {error && (
                <div style={{ color: '#ff6b6b', fontSize: 11, marginBottom: 14, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 4 }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn"
                style={{ width: '100%', padding: 14, fontSize: 12, letterSpacing: 3, background: loading ? 'rgba(0,255,136,0.06)' : 'rgba(0,255,136,0.15)', borderColor: '#00ff88', marginBottom: 16 }}>
                {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA →'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#444', fontSize: 11 }}>Já tem conta? </span>
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  style={{ background: 'none', border: 'none', color: '#00ff88', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                  FAZER LOGIN
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security note */}
        <div style={{ textAlign: 'center', marginTop: 20, color: '#2a2a2a', fontSize: 10, letterSpacing: 1 }}>
          🔒 DADOS CRIPTOGRAFADOS · PROTEÇÃO RLS · HTTPS
        </div>
      </div>
    </div>
  )
}
