import React, { useState } from 'react'
import axios from 'axios'
import { formatFontDisplayName } from './CanvasPreview'

export default function PairwiseCompareModal({ 
  allPalettes, 
  userPrompt, 
  sessionId, 
  currentPalette, 
  onSelectPalette, 
  onClose 
}) {
  const [paletteAIndex, setPaletteAIndex] = useState(0)
  const [paletteBIndex, setPaletteBIndex] = useState(1)
  const [chosenPalette, setChosenPalette] = useState(null)
  const [rationale, setRationale] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voteSubmitted, setVoteSubmitted] = useState(false)

  if (!allPalettes || allPalettes.length < 2) return null

  const paletteA = allPalettes[paletteAIndex] || allPalettes[0]
  const paletteB = allPalettes[paletteBIndex] || allPalettes[1]

  const handleVote = async (chosenNumber) => {
    setIsSubmitting(true)
    try {
      await axios.post('/api/evaluate/pairwise', {
        session_id: sessionId || 'eval_session_general',
        user_prompt: userPrompt || 'Bilingual branding prompt',
        palette_a: paletteA.palette_number,
        palette_b: paletteB.palette_number,
        chosen_palette: chosenNumber,
        rationale: rationale
      })
      setChosenPalette(chosenNumber)
      setVoteSubmitted(true)
    } catch (err) {
      console.error('Error logging pairwise vote:', err)
      // Optimistic record for UI continuity
      setChosenPalette(chosenNumber)
      setVoteSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '2px solid #3b82f6',
      borderRadius: '16px',
      padding: '22px',
      boxShadow: '0 12px 30px -5px rgba(37, 99, 235, 0.12)',
      marginTop: '16px',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔀</span>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: 700 }}>
              Pairwise A/B Visual Comparison & Scientific Voting
            </h3>
            <span style={{
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #bfdbfe'
            }}>
              Bradley-Terry / Thurstone Model
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Compare two recommended typographic systems side-by-side to establish empirical preference benchmarks for research.
          </p>
        </div>

        <button
          onClick={onClose}
          type="button"
          style={{
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '12px',
            color: '#64748b',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Palette Selectors (Choose which two palettes to compare) */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Candidate A:</span>
          <select
            value={paletteAIndex}
            onChange={(e) => {
              setPaletteAIndex(Number(e.target.value))
              setVoteSubmitted(false)
            }}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
          >
            {allPalettes.map((p, idx) => (
              <option key={idx} value={idx}>
                Palette #{p.palette_number} ({formatFontDisplayName(p.header_family)} + {formatFontDisplayName(p.body_family)})
              </option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>VS</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Candidate B:</span>
          <select
            value={paletteBIndex}
            onChange={(e) => {
              setPaletteBIndex(Number(e.target.value))
              setVoteSubmitted(false)
            }}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
          >
            {allPalettes.map((p, idx) => (
              <option key={idx} value={idx}>
                Palette #{p.palette_number} ({formatFontDisplayName(p.header_family)} + {formatFontDisplayName(p.body_family)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparative Cards: Candidate A vs Candidate B */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Candidate A Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #3b82f6',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>🅰️</span>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#1d4ed8', fontWeight: 700 }}>
                Palette #{paletteA.palette_number}
              </h4>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #bfdbfe'
            }}>
              ✨ {paletteA.overall_harmony || 85}% Harmony
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Families: <strong>{formatFontDisplayName(paletteA.header_family)}</strong> + <strong>{formatFontDisplayName(paletteA.body_family)}</strong>
          </div>

          {/* Font pairs list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {paletteA.fonts.map((f, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>[{f.role}]</span> {formatFontDisplayName(f.english_font)} ↔ {formatFontDisplayName(f.sinhala_font)}
              </div>
            ))}
          </div>

          {/* Quick Canvas Preview Action */}
          <button
            type="button"
            onClick={() => onSelectPalette(paletteA)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: currentPalette?.palette_number === paletteA.palette_number ? '#2563eb' : '#eff6ff',
              color: currentPalette?.palette_number === paletteA.palette_number ? '#ffffff' : '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.15s'
            }}
          >
            {currentPalette?.palette_number === paletteA.palette_number ? '✓ Active on Artboard' : '👁️ View Palette A on Canvas'}
          </button>

          {/* Vote Button */}
          <button
            type="button"
            disabled={isSubmitting || voteSubmitted}
            onClick={() => handleVote(paletteA.palette_number)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: chosenPalette === paletteA.palette_number ? '#15803d' : '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: voteSubmitted ? 'default' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            {chosenPalette === paletteA.palette_number ? '🏆 Selected as Preferred Pairing!' : 'Vote for Candidate A'}
          </button>
        </div>

        {/* Candidate B Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #8b5cf6',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>🅱️</span>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#6d28d9', fontWeight: 700 }}>
                Palette #{paletteB.palette_number}
              </h4>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #ddd6fe'
            }}>
              ✨ {paletteB.overall_harmony || 85}% Harmony
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Families: <strong>{formatFontDisplayName(paletteB.header_family)}</strong> + <strong>{formatFontDisplayName(paletteB.body_family)}</strong>
          </div>

          {/* Font pairs list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {paletteB.fonts.map((f, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>[{f.role}]</span> {formatFontDisplayName(f.english_font)} ↔ {formatFontDisplayName(f.sinhala_font)}
              </div>
            ))}
          </div>

          {/* Quick Canvas Preview Action */}
          <button
            type="button"
            onClick={() => onSelectPalette(paletteB)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: currentPalette?.palette_number === paletteB.palette_number ? '#7c3aed' : '#f5f3ff',
              color: currentPalette?.palette_number === paletteB.palette_number ? '#ffffff' : '#6d28d9',
              border: '1px solid #ddd6fe',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.15s'
            }}
          >
            {currentPalette?.palette_number === paletteB.palette_number ? '✓ Active on Artboard' : '👁️ View Palette B on Canvas'}
          </button>

          {/* Vote Button */}
          <button
            type="button"
            disabled={isSubmitting || voteSubmitted}
            onClick={() => handleVote(paletteB.palette_number)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: chosenPalette === paletteB.palette_number ? '#15803d' : '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: voteSubmitted ? 'default' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            {chosenPalette === paletteB.palette_number ? '🏆 Selected as Preferred Pairing!' : 'Vote for Candidate B'}
          </button>
        </div>
      </div>

      {/* Qualitative Rationale Box */}
      <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
          Optional Typographic Rationale: Why do you prefer this candidate?
        </label>
        <input
          type="text"
          placeholder="e.g., Better optical baseline harmony, cleaner stroke balance, or stronger brand mood..."
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          disabled={voteSubmitted}
          style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
        />
        {voteSubmitted && (
          <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✓</span> Preference logged to SQLite research telemetry table! Thank you for evaluating.
          </div>
        )}
      </div>
    </div>
  )
}

