import { useState } from 'react'
import { GLOSSARY } from '../data/glossary'

// ── NeonCard ─────────────────────────────────────────────────────────────────
export function NeonCard({ children, color = '#dc2626', className = '', style = {}, onClick }) {
  return (
    <div onClick={onClick} className={className} style={{ background: 'var(--card-bg)', border: `1px solid ${color}20`, borderRadius: 8, transition: 'all 0.25s', ...style }}>
      {children}
    </div>
  )
}

// ── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({ children, color = '#dc2626' }) {
  return <div className="section-title" style={{ color }}>{children}</div>
}

// ── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, label }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
        <span style={{ color: '#888' }}>{label}</span>
        <span style={{ color }}>{value} / {max}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: 6, borderRadius: 3, background: `linear-gradient(90deg,${color}70,${color})`, boxShadow: `0 0 8px ${color}40`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, color }) {
  return (
    <span style={{ background: `${color}15`, border: `1px solid ${color}30`, color, padding: '3px 10px', borderRadius: 3, fontSize: 10, letterSpacing: 2, fontFamily: 'monospace', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

// ── Tooltip — mostra definição de termo técnico ───────────────────────────────
export function Tooltip({ term, children }) {
  const [show, setShow] = useState(false)
  const entry = GLOSSARY[term]
  if (!entry) return <span>{children || term}</span>

  return (
    <span className="tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(s => !s)}
    >
      <span style={{ borderBottom: '1px dashed rgba(148,163,184,0.4)', cursor: 'help' }}>
        {children || term}
      </span>
      <em className="tooltip-icon">?</em>
      {show && (
        <span className="tooltip-box">
          <div className="tooltip-box-title">{entry.full}</div>
          <div className="tooltip-box-desc">{entry.desc}</div>
        </span>
      )}
    </span>
  )
}

// ── GlossaryPage — página completa de termos ─────────────────────────────────
export function GlossaryPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)

  const categories = {
    'Metabolismo':   ['TMB','TDEE','IMC','Déficit calórico','Superávit calórico','Kcal','Macros'],
    'Treino':        ['RIR','Dropset','Rest-pause','Myo-reps','Cluster','HIIT','DOMS'],
    'Cardio':        ['FC Máx','Z1','Z2','Z3','Z4','Z5','VO2 Máx'],
    'Bioimpedância': ['Gordura Visceral','Gordura Corporal','Massa Muscular','Idade Metabólica','Água Corporal'],
    'Nutrição':      ['Proteína','Carboidrato','Gordura','Kcal','Macros'],
  }

  const filtered = search.trim()
    ? Object.entries(GLOSSARY).filter(([k,v]) =>
        k.toLowerCase().includes(search.toLowerCase()) ||
        v.full.toLowerCase().includes(search.toLowerCase()) ||
        v.desc.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: '#94a3b8', fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>GLOSSÁRIO</div>
        <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>EXPLICAÇÃO DOS TERMOS TÉCNICOS</div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar termo... ex: TDEE, RIR, Z2"
        className="input" style={{ marginBottom: 20 }} />

      {filtered ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(([key, val]) => (
            <TermCard key={key} termKey={key} val={val} open={open} setOpen={setOpen} />
          ))}
          {filtered.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Nenhum termo encontrado</div>
          )}
        </div>
      ) : (
        Object.entries(categories).map(([cat, terms]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 3, marginBottom: 10, textTransform: 'uppercase' }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {terms.map(t => GLOSSARY[t] && (
                <TermCard key={t} termKey={t} val={GLOSSARY[t]} open={open} setOpen={setOpen} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TermCard({ termKey, val, open, setOpen }) {
  const isOpen = open === termKey
  return (
    <div onClick={() => setOpen(isOpen ? null : termKey)}
      style={{ background: 'var(--card-bg)', border: `1px solid ${isOpen ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, marginRight: 10 }}>{termKey}</span>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{val.full}</span>
        </div>
        <span style={{ color: isOpen ? '#ef4444' : '#555', fontSize: 14, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </div>
      {isOpen && (
        <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {val.desc}
        </div>
      )}
    </div>
  )
}



// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, color = '#dc2626', onClose, children, wide = false }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div style={{
        background: '#0e0e10',
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: '24px 28px',
        width: '100%',
        maxWidth: wide ? 780 : 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 0.25s ease',
        boxShadow: `0 32px 80px rgba(0,0,0,0.98)`,
        flexShrink: 0,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
          <div style={{ color, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:18, minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── FunFactBanner ─────────────────────────────────────────────────────────────
export function FunFactBanner({ facts }) {
  const [idx, setIdx] = useState(0)
  const fact = facts[idx % facts.length]
  return (
    <div onClick={() => setIdx(i => i + 1)}
      style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.1)', display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginBottom: 16, WebkitTapHighlightColor: 'transparent' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{fact.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#94a3b8', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>💡 {fact.category} — toque para próximo</div>
        <div style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.6 }}>{fact.fact}</div>
      </div>
    </div>
  )
}
