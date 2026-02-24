import { useState } from 'react'

export function NeonCard({ children, color = '#00ff88', className = '', style = {}, onClick }) {
  return (
    <div onClick={onClick} className={className} style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${color}20`, borderRadius: 8, transition: 'all 0.25s', ...style }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, color = '#00ff88' }) {
  return <div className="section-title" style={{ color }}>{children}</div>
}

export function ProgressBar({ value, max, color, label }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
        <span style={{ color: '#888' }}>{label}</span>
        <span style={{ color }}>{value} / {max}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: '#111', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${color}70, ${color})`, boxShadow: `0 0 8px ${color}50`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export function Tag({ children, color }) {
  return (
    <span style={{ background: `${color}15`, border: `1px solid ${color}30`, color, padding: '3px 10px', borderRadius: 3, fontSize: 10, letterSpacing: 2, fontFamily: 'monospace', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

// Modal — sheet deslizante no mobile, centralizado no desktop
export function Modal({ title, color = '#00ff88', onClose, children, wide = false }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: 0 }}>
      <div style={{ background: '#0a0a0c', border: `1px solid ${color}20`, borderRadius: '16px 16px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', width: '100%', maxWidth: wide ? 680 : 500, maxHeight: '92vh', maxHeight: '92dvh', overflow: 'auto', animation: 'slideUp 0.28s ease', boxShadow: `0 0 40px ${color}08` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 6, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {children}
      </div>
      <style>{`
        @media (min-width: 600px) {
          .modal-inner { border-radius: 10px !important; max-width: ${wide ? '680px' : '480px'} !important; }
        }
      `}</style>
    </div>
  )
}

export function FunFactBanner({ facts }) {
  const [idx, setIdx] = useState(0)
  const fact = facts[idx % facts.length]
  return (
    <div onClick={() => setIdx(i => i + 1)} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginBottom: 16, WebkitTapHighlightColor: 'transparent' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{fact.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#00d4ff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>💡 {fact.category} — toque para próximo</div>
        <div style={{ color: '#888', fontSize: 11, lineHeight: 1.6 }}>{fact.fact}</div>
      </div>
    </div>
  )
}
