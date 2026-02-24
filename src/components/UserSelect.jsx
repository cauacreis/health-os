import { useState } from 'react'
import { getUsers, deleteUser, setActiveUser } from '../lib/storage'

export default function UserSelect({ onSelect, onAdd }) {
  const [users, setUsers] = useState(getUsers)
  const [confirm, setConfirm] = useState(null)

  function handleDelete(id) {
    deleteUser(id)
    setUsers(getUsers())
    setConfirm(null)
  }

  function handleSelect(user) {
    setActiveUser(user.id)
    onSelect(user)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060608',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Scanline */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ff8830, transparent)',
        animation: 'scanline 4s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div className="animate-fade" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8, color: '#00ff88' }}>HEALTH OS</div>
        <div style={{ fontSize: 11, letterSpacing: 6, color: '#333', marginTop: 6 }}>v2.5 · BIOMETRIC SYSTEM</div>
        <div style={{ width: 200, height: 1, background: 'linear-gradient(90deg, transparent, #00ff88, transparent)', margin: '16px auto 0' }} />
      </div>

      {users.length === 0 ? (
        /* Empty state */
        <div className="animate-fade" style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '2px dashed #00ff8830', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#333', fontSize: 32,
          }}>⊕</div>
          <div style={{ color: '#555', fontSize: 12, letterSpacing: 2, marginBottom: 8 }}>NENHUM USUÁRIO CADASTRADO</div>
          <div style={{ color: '#333', fontSize: 11, marginBottom: 32 }}>Crie seu perfil para começar o acompanhamento biométrico.</div>
          <button className="btn" onClick={onAdd} style={{ fontSize: 13, padding: '12px 36px', letterSpacing: 3 }}>
            ⊕ CRIAR PERFIL
          </button>
        </div>
      ) : (
        /* User grid */
        <div className="animate-fade" style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: 3, textAlign: 'center', marginBottom: 24 }}>
            SELECIONE SEU PERFIL
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {users.map((user, i) => (
              <div
                key={user.id}
                className="animate-fade"
                style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                <div
                  onClick={() => handleSelect(user)}
                  style={{
                    background: 'rgba(0,255,136,0.04)',
                    border: '1px solid rgba(0,255,136,0.15)',
                    borderRadius: 8,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,255,136,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(0,255,136,0.4)'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,255,136,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,255,136,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(0,255,136,0.15)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(0,255,136,0.1)',
                    border: '2px solid rgba(0,255,136,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: 22, color: '#00ff88',
                  }}>
                    {user.name[0].toUpperCase()}
                  </div>

                  <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{user.name}</div>
                  <div style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>
                    {user.age}a · {user.weight}kg · {user.height}cm
                  </div>
                  <div style={{ color: '#333', fontSize: 9, marginTop: 6, letterSpacing: 1 }}>
                    {user.goal === 'weightLoss' ? 'PERDA DE PESO'
                      : user.goal === 'muscleGain' ? 'GANHO MUSCULAR'
                      : user.goal === 'endurance' ? 'RESISTÊNCIA'
                      : 'MANUTENÇÃO'}
                  </div>

                  {/* Delete btn */}
                  <button
                    onClick={e => { e.stopPropagation(); setConfirm(user.id) }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'transparent', border: 'none',
                      color: '#333', cursor: 'pointer', fontSize: 14,
                      lineHeight: 1, padding: 4, borderRadius: 4,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                    onMouseLeave={e => e.currentTarget.style.color = '#333'}
                    title="Excluir usuário"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn" onClick={onAdd}>⊕ NOVO PERFIL</button>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: '#0a0a0c',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 8,
            padding: 32,
            maxWidth: 320,
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(255,107,107,0.1)',
          }}>
            <div style={{ color: '#ff6b6b', fontSize: 24, marginBottom: 12 }}>⚠</div>
            <div style={{ color: '#e0e0e0', fontSize: 14, marginBottom: 8 }}>Excluir usuário?</div>
            <div style={{ color: '#555', fontSize: 11, marginBottom: 24 }}>
              Todos os dados serão removidos permanentemente.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setConfirm(null)}>CANCELAR</button>
              <button className="btn btn-red" onClick={() => handleDelete(confirm)}>EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
