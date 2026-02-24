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

export function Modal({ title, color = '#00ff88', onClose, children, wide = false }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0a0a0c', border: `1px solid ${color}25`, borderRadius: 10, padding: 28, width: '100%', maxWidth: wide ? 680 : 440, maxHeight: '92vh', overflow: 'auto', boxShadow: `0 0 40px ${color}10` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ color, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FunFactBanner({ facts }) {
  const [idx, setIdx] = useState(0)
  const fact = facts[idx % facts.length]
  return (
    <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', marginBottom: 16 }}
      onClick={() => setIdx(i => i + 1)}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{fact.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#00d4ff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>💡 FATO CURIOSO · {fact.category.toUpperCase()} — clique para próximo</div>
        <div style={{ color: '#888', fontSize: 11, lineHeight: 1.6 }}>{fact.fact}</div>
      </div>
    </div>
  )
}
