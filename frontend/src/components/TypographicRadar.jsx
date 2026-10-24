import React, { useState } from 'react'
import { formatFontDisplayName } from './CanvasPreview'

const AXES_CONFIG = [
  { key: 'x_height_alignment', label: 'Optical x-Height', shortLabel: 'x-Height', icon: '📐', desc: 'Ratio of normalized lowercase x-height to cap-height between Latin and Sinhala letterforms.' },
  { key: 'geometric_cohesion', label: 'Geometric Cohesion', shortLabel: 'Structure', icon: '🧬', desc: 'Curvature and angular stroke similarity computed via 512-D ResNet-18 visual embeddings.' },
  { key: 'stroke_weight_balance', label: 'Stroke Weight Balance', shortLabel: 'Weight', icon: '⚖️', desc: 'Equilibrium of physical stem thicknesses between scripts.' },
  { key: 'semantic_mood_match', label: 'Semantic Mood Match', shortLabel: 'Semantic', icon: '🎭', desc: 'Cosine similarity between prompt brand context and font intent via SBERT embeddings.' },
  { key: 'bounding_box_symmetry', label: 'Bounding Box Symmetry', shortLabel: 'Proportion', icon: '📦', desc: 'Harmonization of glyph aspect ratios and horizontal proportions.' }
]

export default function TypographicRadar({ palette, onClose }) {
  const [selectedRole, setSelectedRole] = useState('ALL') // 'ALL' | 'Header' | 'Subhead' | 'Body' | 'CTA'

  if (!palette || !palette.fonts) return null

  // Calculate metrics for selected role or aggregate across all roles
  let activeMetrics = {
    x_height_alignment: 85,
    geometric_cohesion: 85,
    stroke_weight_balance: 85,
    semantic_mood_match: 85,
    bounding_box_symmetry: 85,
    overall_harmony: palette.overall_harmony || 85
  }

  let activePairLabel = "Whole Palette Composite Average"
  let activePairSub = `${palette.header_family || 'Header'} + ${palette.body_family || 'Body'}`

  if (selectedRole === 'ALL') {
    // Average metrics across all fonts that have harmony_metrics
    const validFonts = palette.fonts.filter(f => f.harmony_metrics)
    if (validFonts.length > 0) {
      AXES_CONFIG.forEach(axis => {
        const sum = validFonts.reduce((acc, f) => acc + (f.harmony_metrics[axis.key] || 85), 0)
        activeMetrics[axis.key] = Math.round((sum / validFonts.length) * 10) / 10
      })
      const overallSum = validFonts.reduce((acc, f) => acc + (f.harmony_metrics.overall_harmony || 85), 0)
      activeMetrics.overall_harmony = Math.round((overallSum / validFonts.length) * 10) / 10
    }
  } else {
    const fontItem = palette.fonts.find(f => f.role.toLowerCase() === selectedRole.toLowerCase())
    if (fontItem && fontItem.harmony_metrics) {
      activeMetrics = fontItem.harmony_metrics
      activePairLabel = `Role: ${fontItem.role}`
      activePairSub = `${formatFontDisplayName(fontItem.english_font)} ↔ ${formatFontDisplayName(fontItem.sinhala_font)}`
    }
  }

  // SVG Radar Geometry Constants
  const size = 320
  const center = size / 2
  const radius = 105
  const numAxes = AXES_CONFIG.length
  const angleStep = (2 * Math.PI) / numAxes
  // Start from top (-PI / 2)
  const startAngle = -Math.PI / 2

  // Concentric polygon points generator
  const getPolygonPoints = (scale) => {
    return AXES_CONFIG.map((_, i) => {
      const angle = startAngle + i * angleStep
      const x = center + radius * scale * Math.cos(angle)
      const y = center + radius * scale * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  // Data polygon points
  const dataPoints = AXES_CONFIG.map((axis, i) => {
    const val = (activeMetrics[axis.key] || 80) / 100 // 0 to 1
    const angle = startAngle + i * angleStep
    const x = center + radius * val * Math.cos(angle)
    const y = center + radius * val * Math.sin(angle)
    return { x, y, val: activeMetrics[axis.key] || 80 }
  })
  const dataPolygonString = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
      marginTop: '16px',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
              Explainable AI (XAI) Typographic Harmony Radar
            </h3>
            <span style={{
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #bfdbfe'
            }}>
              Palette #{palette.palette_number}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Cross-lingual dimensional analysis derived from dual-stream ResNet-18 & SBERT feature vectors.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            type="button"
            title="Close Radar"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              color: '#64748b',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Role Switcher */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {['ALL', 'Header', 'Subhead', 'Body', 'CTA'].map(r => {
          const isSel = selectedRole.toLowerCase() === r.toLowerCase()
          return (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: isSel ? 700 : 500,
                borderRadius: '8px',
                border: isSel ? '1px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isSel ? '#eff6ff' : '#f8fafc',
                color: isSel ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {r === 'ALL' ? '⭐ Aggregate (All Roles)' : r}
            </button>
          )
        })}
      </div>

      {/* Center Layout: Radar Chart + Metric Breakdown Grid */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* SVG Radar */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ overflow: 'visible' }}>
            {/* Concentric Reference Rings */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => (
              <polygon
                key={idx}
                points={getPolygonPoints(scale)}
                fill={idx === 4 ? '#f8fafc' : 'none'}
                stroke="#e2e8f0"
                strokeWidth={idx === 4 ? "1.5" : "1"}
                strokeDasharray={idx < 4 ? "3,3" : "none"}
              />
            ))}

            {/* Axis Spoke Lines */}
            {AXES_CONFIG.map((_, i) => {
              const angle = startAngle + i * angleStep
              const x2 = center + radius * Math.cos(angle)
              const y2 = center + radius * Math.sin(angle)
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              )
            })}

            {/* Filled Data Polygon */}
            <polygon
              points={dataPolygonString}
              fill="rgba(37, 99, 235, 0.22)"
              stroke="#2563eb"
              strokeWidth="2.5"
            />

            {/* Data Vertex Dots */}
            {dataPoints.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
              </g>
            ))}

            {/* Axis Labels Around Radar */}
            {AXES_CONFIG.map((axis, i) => {
              const angle = startAngle + i * angleStep
              // Position labels just outside outer circle
              const labelRadius = radius + 28
              const lx = center + labelRadius * Math.cos(angle)
              const ly = center + labelRadius * Math.sin(angle)
              const val = activeMetrics[axis.key] || 80
              return (
                <text
                  key={i}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    fill: '#334155',
                    userSelect: 'none'
                  }}
                >
                  {axis.icon} {axis.shortLabel} ({val}%)
                </text>
              )
            })}
          </svg>

          {/* Center Badge: Overall Score */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            borderRadius: '999px',
            padding: '6px 10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #bfdbfe',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Harmony
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>
              {activeMetrics.overall_harmony}%
            </div>
          </div>
        </div>

        {/* Metric Detail Cards */}
        <div style={{ flex: '1', minWidth: '280px', maxWidth: '420px' }}>
          <div style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Inspected Target
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {activePairLabel}
            </div>
            <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '1px', fontWeight: 500 }}>
              {activePairSub}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AXES_CONFIG.map(axis => {
              const val = activeMetrics[axis.key] || 85
              return (
                <div 
                  key={axis.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>{axis.icon}</span> {axis.label}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: val >= 90 ? '#15803d' : '#2563eb' }}>
                      {val}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '5px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${val}%`,
                      height: '100%',
                      backgroundColor: val >= 90 ? '#22c55e' : '#3b82f6',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                    {axis.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

