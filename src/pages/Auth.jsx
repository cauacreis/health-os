import { useState } from 'react'
import { signIn, signUp } from '../lib/db'
import { supabase } from '../lib/supabase'

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function sanitize(s) { return s.replace(/[<>'"]/g, '') }

export default function Auth() {
  const [mode, setMode] = useState('login') // login | register | forgot | sent
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creds, setCreds] = useState({ email:'', password:'', confirm:'', name:'' })
  const set = (k,v) => { setCreds(c=>({...c,[k]:v})); setError('') }

  async function handleLogin(e) {
    e.preventDefault()
    if (!validateEmail(creds.email)) return setError('E-mail inválido')
    if (!creds.password) return setError('Senha obrigatória')
    setLoading(true)
    try { await signIn(creds.email, creds.password) }
    catch (err) { setError(err.message.includes('Invalid') ? 'E-mail ou senha incorretos' : err.message) }
    finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!validateEmail(creds.email)) return setError('E-mail inválido')
    if (creds.password.length < 8) return setError('Senha precisa ter mínimo 8 caracteres')
    if (creds.password !== creds.confirm) return setError('Senhas não coincidem')
    if (!sanitize(creds.name).trim()) return setError('Nome obrigatório')
    setLoading(true)
    try { await signUp(creds.email, creds.password, sanitize(creds.name)); setMode('registered') }
    catch (err) { setError(err.message.includes('already') ? 'E-mail já cadastrado' : err.message) }
    finally { setLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!validateEmail(creds.email)) return setError('E-mail inválido')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(creds.email, {
        redirectTo: window.location.origin + '/?reset=true',
      })
      if (error) throw error
      setMode('sent')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inp = (err) => ({
    background: 'rgba(0,255,136,0.04)',
    border: `1px solid ${err ? '#ff6b6b50' : 'rgba(0,255,136,0.2)'}`,
    color: '#e0e0e0', padding: '12px 16px', borderRadius: 6,
    fontFamily: 'monospace', fontSize: 16, outline: 'none',
    width: '100%', boxSizing: 'border-box', transition: 'all 0.2s',
    WebkitAppearance: 'none',
  })

  const G = '#00ff88'

  return (
    <div style={{ minHeight:'100vh', minHeight:'100dvh', background:'#060608', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', padding:16, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, opacity:0.025, backgroundImage:'linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, animation:'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ color:G, fontSize:30, fontWeight:700, letterSpacing:6 }}>HEALTH OS</div>
          <div style={{ color:'#333', fontSize:10, letterSpacing:5, marginTop:6 }}>BIOMETRIC SYSTEM v2.5</div>
          <div style={{ width:100, height:1, background:`linear-gradient(90deg,transparent,${G},transparent)`, margin:'14px auto 0' }} />
        </div>

        {/* ── Login ── */}
        {mode === 'login' && (
          <div style={{ background:'rgba(0,0,0,0.7)', border:'1px solid rgba(0,255,136,0.12)', borderRadius:10, padding:28 }}>
            <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginBottom:22 }}>ACESSO AO SISTEMA</div>
            <form onSubmit={handleLogin} autoComplete="on">
              <div style={{ marginBottom:14 }}>
                <label className="label">E-MAIL</label>
                <input type="email" value={creds.email} onChange={e=>set('email',e.target.value)} placeholder="seu@email.com" autoComplete="email" style={inp()} />
              </div>
              <div style={{ marginBottom:8 }}>
                <label className="label">SENHA</label>
                <input type="password" value={creds.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" autoComplete="current-password" style={inp()} />
              </div>
              {/* Esqueci senha */}
              <div style={{ textAlign:'right', marginBottom:18 }}>
                <button type="button" onClick={()=>{setMode('forgot');setError('')}} style={{ background:'none', border:'none', color:'#444', fontFamily:'monospace', fontSize:10, cursor:'pointer', letterSpacing:1, textDecoration:'underline' }}>
                  Esqueci minha senha
                </button>
              </div>
              {error && <div style={{ color:'#ff6b6b', fontSize:11, marginBottom:14, padding:'8px 12px', background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:4 }}>⚠ {error}</div>}
              <button type="submit" disabled={loading} className="btn" style={{ width:'100%', padding:14, fontSize:12, letterSpacing:3, background:loading?'rgba(0,255,136,0.04)':'rgba(0,255,136,0.14)', borderColor:G, marginBottom:14 }}>
                {loading ? 'VERIFICANDO...' : 'ENTRAR →'}
              </button>
              <div style={{ textAlign:'center' }}>
                <span style={{ color:'#444', fontSize:11 }}>Não tem conta? </span>
                <button type="button" onClick={()=>{setMode('register');setError('')}} style={{ background:'none', border:'none', color:G, fontFamily:'monospace', fontSize:11, cursor:'pointer' }}>
                  CRIAR CONTA
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Register ── */}
        {mode === 'register' && (
          <div style={{ background:'rgba(0,0,0,0.7)', border:'1px solid rgba(0,255,136,0.12)', borderRadius:10, padding:28 }}>
            <div style={{ color:'#444', fontSize:10, letterSpacing:3, marginBottom:20 }}>CRIAR CONTA</div>
            <form onSubmit={handleRegister} autoComplete="off">
              {[
                {k:'name',    l:'NOME',               t:'text',     p:'Seu nome',      max:60},
                {k:'email',   l:'E-MAIL',              t:'email',    p:'seu@email.com'},
                {k:'password',l:'SENHA (mín. 8 chars)',t:'password', p:'••••••••'},
                {k:'confirm', l:'CONFIRMAR SENHA',     t:'password', p:'••••••••'},
              ].map(f=>(
                <div key={f.k} style={{ marginBottom:14 }}>
                  <label className="label">{f.l}</label>
                  <input type={f.t} value={creds[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.p} maxLength={f.max} autoComplete="new-password"
                    style={inp(f.k==='confirm'&&creds.confirm&&creds.confirm!==creds.password)} />
                  {f.k==='password'&&creds.password&&(
                    <div style={{ display:'flex', gap:4, marginTop:5 }}>
                      {[1,2,3,4].map(n=>(
                        <div key={n} style={{ flex:1, height:3, borderRadius:2, background:creds.password.length>=n*3?(creds.password.length>=12?G:'#ff9f43'):'#1a1a1a' }} />
                      ))}
                      <span style={{ color:'#555', fontSize:9, marginLeft:4 }}>{creds.password.length<8?'FRACA':creds.password.length<12?'BOA':'FORTE'}</span>
                    </div>
                  )}
                  {f.k==='confirm'&&creds.confirm&&creds.confirm!==creds.password&&(
                    <div style={{ color:'#ff6b6b', fontSize:10, marginTop:3 }}>⚠ Senhas não coincidem</div>
                  )}
                </div>
              ))}
              {error && <div style={{ color:'#ff6b6b', fontSize:11, marginBottom:14, padding:'8px 12px', background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:4 }}>⚠ {error}</div>}
              <button type="submit" disabled={loading} className="btn" style={{ width:'100%', padding:14, fontSize:12, letterSpacing:3, background:loading?'rgba(0,255,136,0.04)':'rgba(0,255,136,0.14)', borderColor:G, marginBottom:14 }}>
                {loading ? 'CRIANDO...' : 'CRIAR CONTA →'}
              </button>
              <div style={{ textAlign:'center' }}>
                <span style={{ color:'#444', fontSize:11 }}>Já tem conta? </span>
                <button type="button" onClick={()=>{setMode('login');setError('')}} style={{ background:'none', border:'none', color:G, fontFamily:'monospace', fontSize:11, cursor:'pointer' }}>FAZER LOGIN</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Esqueci senha ── */}
        {mode === 'forgot' && (
          <div style={{ background:'rgba(0,0,0,0.7)', border:'1px solid rgba(0,212,255,0.12)', borderRadius:10, padding:28 }}>
            <div style={{ color:'#00d4ff', fontSize:10, letterSpacing:3, marginBottom:8 }}>RECUPERAR SENHA</div>
            <div style={{ color:'#555', fontSize:11, marginBottom:20, lineHeight:1.6 }}>
              Digite seu e-mail. Se existir uma conta, você vai receber um link para criar uma nova senha.
            </div>
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom:16 }}>
                <label className="label">E-MAIL</label>
                <input type="email" value={creds.email} onChange={e=>set('email',e.target.value)} placeholder="seu@email.com" autoComplete="email"
                  style={{ ...inp(), border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }} />
              </div>
              {error && <div style={{ color:'#ff6b6b', fontSize:11, marginBottom:14, padding:'8px 12px', background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:4 }}>⚠ {error}</div>}
              <button type="submit" disabled={loading} className="btn" style={{ width:'100%', padding:14, fontSize:12, letterSpacing:3, background:'rgba(0,212,255,0.1)', borderColor:'#00d4ff', color:'#00d4ff', marginBottom:14 }}>
                {loading ? 'ENVIANDO...' : 'ENVIAR LINK →'}
              </button>
              <div style={{ textAlign:'center' }}>
                <button type="button" onClick={()=>{setMode('login');setError('')}} style={{ background:'none', border:'none', color:'#444', fontFamily:'monospace', fontSize:11, cursor:'pointer' }}>← VOLTAR AO LOGIN</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Email enviado ── */}
        {(mode === 'sent' || mode === 'registered') && (
          <div style={{ background:'rgba(0,0,0,0.7)', border:`1px solid ${mode==='sent'?'rgba(0,212,255,0.2)':'rgba(0,255,136,0.2)'}`, borderRadius:10, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:16 }}>{mode==='sent'?'📧':'✓'}</div>
            <div style={{ color: mode==='sent'?'#00d4ff':G, fontSize:15, fontWeight:700, marginBottom:10 }}>
              {mode==='sent' ? 'E-mail enviado!' : 'Conta criada!'}
            </div>
            <div style={{ color:'#666', fontSize:12, marginBottom:24, lineHeight:1.7 }}>
              {mode==='sent'
                ? 'Verifique sua caixa de entrada (e o spam). Clique no link para criar uma nova senha.'
                : 'Verifique seu e-mail para confirmar o cadastro, depois faça login.'}
            </div>
            <button onClick={()=>{setMode('login');setCreds(c=>({...c,password:'',confirm:''}))}} className="btn" style={{ width:'100%', background:`rgba(${mode==='sent'?'0,212,255':'0,255,136'},0.14)`, borderColor: mode==='sent'?'#00d4ff':G, color: mode==='sent'?'#00d4ff':G }}>
              IR PARA LOGIN
            </button>
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:20, color:'#222', fontSize:10, letterSpacing:1 }}>
          🔒 DADOS CRIPTOGRAFADOS · HTTPS · RLS ATIVO
        </div>
      </div>
    </div>
  )
}
