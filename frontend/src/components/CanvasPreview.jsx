import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { unicodeToLegacyFM, isLegacyFont } from '../utils/sinhalaConverter'
import TypographicRadar from './TypographicRadar'
import CopyEditorDrawer from './CopyEditorDrawer'
import PairwiseCompareModal from './PairwiseCompareModal'
import WcagAuditorDrawer from './WcagAuditorDrawer'

export const CANVAS_THEMES = {
  studio: { id: 'studio', name: 'Studio White', icon: '⚪', bg: '#ffffff', textPrimary: '#0f172a', textSecondary: '#334155' },
  midnight: { id: 'midnight', name: 'Midnight Luxury', icon: '🌙', bg: '#090d16', textPrimary: '#fde047', textSecondary: '#f1f5f9' },
  editorial: { id: 'editorial', name: 'Warm Parchment', icon: '☕', bg: '#faf5ef', textPrimary: '#291809', textSecondary: '#4a3b32' },
  organic: { id: 'organic', name: 'Modern Organic', icon: '🌿', bg: '#f0fdf4', textPrimary: '#14532d', textSecondary: '#166534' },
  cyber: { id: 'cyber', name: 'Deep Carbon', icon: '⚡', bg: '#0f172a', textPrimary: '#38bdf8', textSecondary: '#e2e8f0' }
}

const DEFAULT_EN_SLOTS = {
  header: "Main Headline",
  subhead: "Your Campaign Subtitle or Slogan",
  body: "Your primary body content, features, or details will appear here.",
  cta: "CALL TO ACTION"
}

const DEFAULT_SI_SLOTS = {
  header: "ප්‍රධාන මාතෘකාව",
  subhead: "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව",
  body: "වැඩිදුර විස්තර, සේවාවන් සහ අන්තර්ගතය මෙහි ඇතුළත් කරන්න.",
  cta: "මෙතනින් පිවිසෙන්න"
}

export function formatFontDisplayName(fontName) {
  if (!fontName) return ""
  let clean = fontName.replace(/\.ttf$/i, '')
  // Strip 16-hex artifact hashes (e.g. -f1f5d0b6e472a85b)
  clean = clean.replace(/-[a-f0-9]{16}$/i, '')
  // Replace _7E encoded characters
  clean = clean.replace(/_7E/gi, '')
  if (clean.toLowerCase().startsWith('akasa_')) {
    clean = 'Akasa ' + clean.slice(6).replace(/[_-]+/g, ' ')
  }
  return clean.trim()
}

export function getSafeFontFamily(fileName) {
  if (!fileName) return "sans-serif"
  // Strip file extension and replace characters like brackets, spaces, dots, pluses with underscores
  return fileName.replace(/\.ttf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_')
}

export default function CanvasPreview({ 
  palette, 
  platformSpec, 
  allPalettes = [], 
  sessionId, 
  userPrompt, 
  onSelectPalette 
}) {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [loadingFonts, setLoadingFonts] = useState(false)
  const [layoutAlign, setLayoutAlign] = useState('left') // 'left' | 'center'
  const [showMetricGuides, setShowMetricGuides] = useState(false)
  const [showRadar, setShowRadar] = useState(false)
  const [activeTheme, setActiveTheme] = useState('studio')
  const [showCopyEditor, setShowCopyEditor] = useState(false)
  const [customSlots, setCustomSlots] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showWcagAuditor, setShowWcagAuditor] = useState(false)
  const themeConfig = CANVAS_THEMES[activeTheme] || CANVAS_THEMES.studio

  useEffect(() => {
    if (!palette || !palette.fonts || !canvasRef.current) return
    let isMounted = true
    setLoadingFonts(true)

    const render = async () => {
      // 1. Asynchronously load all custom fonts for the active palette
      const fontPromises = []
      palette.fonts.forEach((f) => {
        const enFamily = getSafeFontFamily(f.english_font)
        const siFamily = getSafeFontFamily(f.sinhala_font)

        try {
          fontPromises.push(
            new FontFace(enFamily, `url('/fonts/${encodeURIComponent(f.english_font)}')`)
              .load()
              .then(font => {
                document.fonts.add(font)
              })
              .catch(e => console.warn(`Font load note: ${enFamily}`, e))
          )
          fontPromises.push(
            new FontFace(siFamily, `url('/fonts/${encodeURIComponent(f.sinhala_font)}')`)
              .load()
              .then(font => {
                document.fonts.add(font)
              })
              .catch(e => console.warn(`Font load note: ${siFamily}`, e))
          )
        } catch (err) {
          console.warn("FontFace creation error:", err)
        }
      })

      await Promise.all(fontPromises)
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready
        } catch (e) {}
      }

      if (!isMounted || !canvasRef.current) return

      // Clean up previous fabric canvas instance if any
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }

      const targetWidth = platformSpec?.canvas_width || 1200
      const targetHeight = platformSpec?.canvas_height || 630

      const themeConfig = CANVAS_THEMES[activeTheme] || CANVAS_THEMES.studio

      // 2. Initialize Fabric Canvas
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: targetWidth,
        height: targetHeight,
        backgroundColor: themeConfig.bg,
        selection: true
      })
      fabricCanvasRef.current = canvas

      // Responsive container scaling
      const maxContainerWidth = 720
      const displayScale = Math.min(1, maxContainerWidth / targetWidth)
      canvas.setZoom(displayScale)
      canvas.setDimensions(
        { width: targetWidth * displayScale, height: targetHeight * displayScale },
        { cssOnly: true }
      )

      const isStrategyMode = Boolean(palette.activeStrategy)
      const isLeftAlign = layoutAlign === 'left'

      let currentY = (!isStrategyMode && !isLeftAlign) ? Math.round(targetHeight * 0.05) : Math.round(targetHeight * 0.10)
      const leftColX = Math.round(targetWidth * 0.08)
      const rightColX = Math.round(targetWidth * 0.54)
      const colWidth = Math.round(targetWidth * 0.38)

      const centerX = targetWidth / 2
      const centerColWidth = Math.round(targetWidth * 0.8)

      // Merge backend copy slots with custom overrides and safe defaults
      const backendSlots = palette.contentSlots || {}
      const activeEnSlots = customSlots?.en || backendSlots.en || {}
      const activeSiSlots = customSlots?.si || backendSlots.si || {}
      const enSlots = { ...DEFAULT_EN_SLOTS, ...activeEnSlots }
      const siSlots = { ...DEFAULT_SI_SLOTS, ...activeSiSlots }

      const trackedGuideRows = []
      palette.fonts.forEach((f) => {
        const rowStartY = currentY
        const roleLower = f.role.toLowerCase()
        const enCopy = enSlots[roleLower] || DEFAULT_EN_SLOTS[roleLower]
        const rawSiCopy = siSlots[roleLower] || DEFAULT_SI_SLOTS[roleLower]
        const isLegacy = isLegacyFont(f)
        const siCopy = isLegacy ? unicodeToLegacyFM(rawSiCopy) : rawSiCopy

        const enFamily = getSafeFontFamily(f.english_font)
        const siFamily = getSafeFontFamily(f.sinhala_font)

        const rawEnName = f.english_font.split('.')[0]
        const rawSiName = f.sinhala_font.split('.')[0]

        const enWeight = rawEnName.toLowerCase().includes('bold') ? 'bold' : (rawEnName.toLowerCase().includes('medium') ? 500 : 'normal')
        const enStyle = rawEnName.toLowerCase().includes('italic') ? 'italic' : 'normal'
        const siWeight = rawSiName.toLowerCase().includes('bold') ? 'bold' : 'normal'

        let activeLangPref = "Bilingual"
        if (isStrategyMode && palette.activeStrategy?.role_breakdown) {
          const roleData = palette.activeStrategy.role_breakdown.find(r => r.role === f.role)
          if (roleData) activeLangPref = roleData.language_preference
        }

        const isLeftAlign = layoutAlign === 'left'

        if (isStrategyMode && activeLangPref === "English") {
          const enText = new fabric.Textbox(enCopy, { 
            left: isLeftAlign ? leftColX : centerX,
            originX: isLeftAlign ? 'left' : 'center',
            top: currentY,
            width: isLeftAlign ? Math.round(targetWidth * 0.84) : centerColWidth,
            fontSize: f.english_size,
            fontWeight: enWeight,
            fontStyle: enStyle,
            fill: themeConfig.textPrimary,
            fontFamily: enFamily,
            textAlign: isLeftAlign ? 'left' : 'center',
            lineHeight: 1.18,
            editable: true 
          })
          canvas.add(enText)
          currentY += Math.max(enText.height || f.english_size, f.english_size) + 32
        } 
        else if (isStrategyMode && activeLangPref === "Sinhala") {
          const siText = new fabric.Textbox(siCopy, { 
            left: isLeftAlign ? leftColX : centerX,
            originX: isLeftAlign ? 'left' : 'center',
            top: currentY,
            width: isLeftAlign ? Math.round(targetWidth * 0.84) : centerColWidth,
            fontSize: f.sinhala_size,
            fontWeight: siWeight,
            fill: themeConfig.textPrimary,
            fontFamily: siFamily,
            textAlign: isLeftAlign ? 'left' : 'center',
            lineHeight: 1.25,
            editable: true 
          })
          canvas.add(siText)
          currentY += Math.max(siText.height || f.sinhala_size, f.sinhala_size) + 32
        } 
        else {
          // Standard Bilingual Mode
          if (isLeftAlign) {
            // Left-Aligned: 2-Column Editorial Grid (English on left column, Sinhala on right column)
            const enText = new fabric.Textbox(enCopy, { 
              left: leftColX,
              top: currentY,
              width: colWidth,
              fontSize: f.english_size,
              fontWeight: enWeight,
              fontStyle: enStyle,
              fill: themeConfig.textPrimary,
              fontFamily: enFamily,
              lineHeight: 1.18,
              textAlign: 'left',
              editable: true 
            })
            const siText = new fabric.Textbox(siCopy, { 
              left: rightColX,
              top: currentY,
              width: colWidth,
              fontSize: f.sinhala_size,
              fontWeight: siWeight,
              fill: themeConfig.textSecondary,
              fontFamily: siFamily,
              lineHeight: 1.25,
              textAlign: 'left',
              editable: true 
            })
            canvas.add(enText, siText)
            currentY += Math.max(enText.height || f.english_size, siText.height || f.sinhala_size) + 28
          } else {
            // Centered: Symmetrical Central Axis Layout (both languages centered down the middle)
            const enText = new fabric.Textbox(enCopy, { 
              left: centerX,
              originX: 'center',
              top: currentY,
              width: centerColWidth,
              fontSize: f.english_size,
              fontWeight: enWeight,
              fontStyle: enStyle,
              fill: themeConfig.textPrimary,
              fontFamily: enFamily,
              textAlign: 'center',
              lineHeight: 1.18,
              editable: true 
            })
            canvas.add(enText)
            currentY += Math.max(enText.height || f.english_size, f.english_size) + 6

            const siText = new fabric.Textbox(siCopy, { 
              left: centerX,
              originX: 'center',
              top: currentY,
              width: centerColWidth,
              fontSize: f.sinhala_size,
              fontWeight: siWeight,
              fill: themeConfig.textSecondary,
              fontFamily: siFamily,
              textAlign: 'center',
              lineHeight: 1.25,
              editable: true 
            })
            canvas.add(siText)
            currentY += Math.max(siText.height || f.sinhala_size, f.sinhala_size) + 22
          }

          if (showMetricGuides && (roleLower === 'header' || roleLower === 'subhead')) {
            const activeFontSize = Math.max(f.english_size, f.sinhala_size)
            trackedGuideRows.push({
              role: f.role,
              top: rowStartY,
              fontSize: activeFontSize,
              x_ratio: f.x_ratio || 1.0
            })
          }
        }
      })

      // Draw Optical Typographic Metric Guides if toggled
      if (showMetricGuides && trackedGuideRows.length > 0) {
        const drawGuideLine = (yPos, color, isDashed = true, strokeWidth = 1.5) => {
          const line = new fabric.Line([Math.round(targetWidth * 0.04), yPos, Math.round(targetWidth * 0.96), yPos], {
            stroke: color,
            strokeWidth: strokeWidth,
            strokeDashArray: isDashed ? [6, 4] : undefined,
            selectable: false,
            evented: false,
            opacity: 0.8
          })
          canvas.add(line)
        }

        const drawGuideBadge = (label, yPos, color) => {
          const isDarkTheme = activeTheme === 'midnight' || activeTheme === 'cyber'
          const tag = new fabric.Text(label, {
            left: Math.round(targetWidth * 0.04) + 6,
            top: yPos - 12,
            fontSize: 10,
            fill: color,
            fontWeight: 'bold',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            selectable: false,
            evented: false,
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            padding: 2
          })
          canvas.add(tag)
        }

        trackedGuideRows.forEach(row => {
          const baseY = Math.round(row.top + row.fontSize * 0.82)
          const capY = Math.round(baseY - row.fontSize * 0.72)
          const normXHeight = row.fontSize * 0.72 * 0.68 * (row.x_ratio || 1.0)
          const meanY = Math.round(baseY - normXHeight)
          const descY = Math.round(baseY + row.fontSize * 0.22)

          // 1. Cap-Height Guide (Cyan dashed)
          drawGuideLine(capY, '#0284c7', true, 1.5)
          drawGuideBadge(`Cap-Height [${row.role}]`, capY, '#0284c7')

          // 2. Mean (x-Height) Guide (Emerald dashed)
          drawGuideLine(meanY, '#059669', true, 1.5)
          drawGuideBadge(`Mean (x-Height) [${row.role}] • ${(row.x_ratio * 100).toFixed(1)}% Ratio`, meanY, '#059669')

          // 3. Baseline Guide (Amber solid)
          drawGuideLine(baseY, '#d97706', false, 2)
          drawGuideBadge(`Baseline [${row.role}]`, baseY, '#d97706')

          // 4. Descender Guide (Purple dashed)
          drawGuideLine(descY, '#7c3aed', true, 1.5)
          drawGuideBadge(`Descender [${row.role}]`, descY, '#7c3aed')
        })

        // Overlay Summary Banner at top of canvas
        const isDarkTheme = activeTheme === 'midnight' || activeTheme === 'cyber'
        const bannerRect = new fabric.Rect({
          left: Math.round(targetWidth * 0.04),
          top: 14,
          width: Math.round(targetWidth * 0.92),
          height: 28,
          fill: isDarkTheme ? '#1e293b' : '#0f172a',
          rx: 6,
          ry: 6,
          selectable: false,
          evented: false,
          opacity: 0.92
        })
        const bannerText = new fabric.Text(
          `📏 OPTICAL METRICS OVERLAY ACTIVE • Physical Baseline Normalization (${palette.fonts[0]?.x_ratio ? (palette.fonts[0].x_ratio * 100).toFixed(1) : '100.0'}% Ratio) • Cap (Cyan) | x-Height (Green) | Baseline (Amber)`,
          {
            left: Math.round(targetWidth * 0.04) + 14,
            top: 21,
            fontSize: 11,
            fill: '#f8fafc',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            selectable: false,
            evented: false
          }
        )
        canvas.add(bannerRect, bannerText)
      }

      canvas.renderAll()
      if (isMounted) {
        setLoadingFonts(false)
      }
    }

    render()

    return () => {
      isMounted = false
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [palette, platformSpec, layoutAlign, showMetricGuides, activeTheme, customSlots])

  // High-Resolution PNG Exporter
  const handleExportPNG = () => {
    if (!fabricCanvasRef.current) return
    const currentZoom = fabricCanvasRef.current.getZoom() || 1
    // Scale multiplier to guarantee 2x native platform resolution
    const exportMultiplier = 2 / currentZoom

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: exportMultiplier
    })
    const link = document.createElement('a')
    link.href = dataURL
    link.download = `Typographic_AI_${platformSpec?.platform || 'Design'}_${Date.now()}.png`
    link.click()
  }

  if (!palette) return null
  const platformLabel = platformSpec?.platform ? platformSpec.platform.toUpperCase() : 'FACEBOOK'

  const uniqueEnglish = Array.from(new Set(palette.fonts.map(f => f.english_font))).map(fontFile => ({
    fileName: fontFile,
    displayName: formatFontDisplayName(fontFile),
    googleUrl: `https://fonts.google.com/specimen/${fontFile.replace(/\.ttf$/i, '').replace(/-(Regular|Bold|Italic|Medium|Light|Black|Thin|SemiBold)/ig, '').replace(/_/g, '+')}`,
    downloadUrl: `/fonts/${encodeURIComponent(fontFile)}`
  }))

  const uniqueSinhala = Array.from(new Set(palette.fonts.map(f => f.sinhala_font))).map(fontFile => {
    const fObj = palette.fonts.find(f => f.sinhala_font === fontFile)
    const isLegacy = isLegacyFont(fObj)
    return {
      fileName: fontFile,
      displayName: formatFontDisplayName(fontFile),
      isLegacy,
      encodingLabel: isLegacy ? 'FM' : 'Unicode',
      downloadUrl: `/fonts/${encodeURIComponent(fontFile)}`
    }
  })

  const handleDownloadAllFonts = () => {
    const allFiles = [...uniqueEnglish, ...uniqueSinhala]
    allFiles.forEach((f, idx) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = f.downloadUrl
        link.download = f.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, idx * 220)
    })
  }

  return (
    <div style={{ 
      marginTop: '2rem', 
      padding: '1.5rem', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      border: palette.activeStrategy ? '2px solid #0ea5e9' : '1px solid #cbd5e1',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{palette.activeStrategy ? "✨" : "🎨"}</span>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 600 }}>
            {palette.activeStrategy ? "Strategic Layout Rendered" : "Editable Interactive Layout"}
          </h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Alignment Preset Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setLayoutAlign('left')}
              title="Align text to the left margin"
              style={{
                padding: '3px 10px',
                fontSize: '11.5px',
                fontWeight: layoutAlign === 'left' ? 600 : 500,
                border: 'none',
                borderRadius: '6px',
                backgroundColor: layoutAlign === 'left' ? '#ffffff' : 'transparent',
                color: layoutAlign === 'left' ? '#0f172a' : '#64748b',
                boxShadow: layoutAlign === 'left' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              ≡ Left
            </button>
            <button
              type="button"
              onClick={() => setLayoutAlign('center')}
              title="Center-align typography"
              style={{
                padding: '3px 10px',
                fontSize: '11.5px',
                fontWeight: layoutAlign === 'center' ? 600 : 500,
                border: 'none',
                borderRadius: '6px',
                backgroundColor: layoutAlign === 'center' ? '#ffffff' : 'transparent',
                color: layoutAlign === 'center' ? '#0f172a' : '#64748b',
                boxShadow: layoutAlign === 'center' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              ☷ Center
            </button>
          </div>

          {/* Curated Brand Color Themes */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '2px' }}>
            {Object.values(CANVAS_THEMES).map(t => {
              const isSelected = activeTheme === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTheme(t.id)}
                  title={`Brand Theme: ${t.name}`}
                  style={{
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#0f172a' : '#64748b',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Custom Copy Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowCopyEditor(!showCopyEditor)}
            title="Open Bilingual Copy Editor drawer"
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: showCopyEditor || customSlots ? 700 : 500,
              border: customSlots ? '1px solid #f59e0b' : (showCopyEditor ? '1px solid #6366f1' : '1px solid #cbd5e1'),
              borderRadius: '8px',
              backgroundColor: customSlots ? '#fef3c7' : (showCopyEditor ? '#eef2ff' : '#ffffff'),
              color: customSlots ? '#92400e' : (showCopyEditor ? '#4338ca' : '#64748b'),
              boxShadow: showCopyEditor ? '0 1px 2px rgba(99, 102, 241, 0.2)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            <span>✏️</span> {customSlots ? 'Custom Copy' : 'Edit Copy'}
          </button>

          {/* Pairwise A/B Compare Toggle (if multiple candidate palettes available) */}
          {allPalettes && allPalettes.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowCompare(!showCompare)}
              title="Open Side-by-Side A/B Pairwise Comparison & Scientific Preference Voting"
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: showCompare ? 700 : 500,
                border: showCompare ? '1px solid #8b5cf6' : '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: showCompare ? '#f5f3ff' : '#ffffff',
                color: showCompare ? '#6d28d9' : '#64748b',
                boxShadow: showCompare ? '0 1px 2px rgba(139, 92, 246, 0.2)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              <span>🔀</span> {showCompare ? 'Close Compare' : 'A/B Compare'}
            </button>
          )}

          {/* Explainable AI & Alignment Inspection Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setShowMetricGuides(!showMetricGuides)}
              title="Overlay optical baseline and x-height inspection guides"
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: showMetricGuides ? 700 : 500,
                border: showMetricGuides ? '1px solid #10b981' : '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: showMetricGuides ? '#ecfdf5' : '#ffffff',
                color: showMetricGuides ? '#065f46' : '#64748b',
                boxShadow: showMetricGuides ? '0 1px 2px rgba(16, 185, 129, 0.2)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              <span>📏</span> {showMetricGuides ? 'Hide Guides' : 'Guides'}
            </button>

            <button
              type="button"
              onClick={() => setShowRadar(!showRadar)}
              title="Toggle 5-axis Explainable AI Typographic Harmony Radar"
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: showRadar ? 700 : 500,
                border: showRadar ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: showRadar ? '#eff6ff' : '#ffffff',
                color: showRadar ? '#1d4ed8' : '#64748b',
                boxShadow: showRadar ? '0 1px 2px rgba(59, 130, 246, 0.2)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              <span>📊</span> {showRadar ? 'Hide Radar' : 'Radar'}
            </button>

            <button
              type="button"
              onClick={() => setShowWcagAuditor(!showWcagAuditor)}
              title="Toggle WCAG 2.1 Contrast & Sinhala Diacritic Legibility Audit"
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: showWcagAuditor ? 700 : 500,
                border: showWcagAuditor ? '1px solid #059669' : '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: showWcagAuditor ? '#ecfdf5' : '#ffffff',
                color: showWcagAuditor ? '#047857' : '#64748b',
                boxShadow: showWcagAuditor ? '0 1px 2px rgba(5, 150, 105, 0.2)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              <span>👁️</span> {showWcagAuditor ? 'Hide WCAG' : 'WCAG Audit'}
            </button>
          </div>

          <span style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {platformLabel} • {platformSpec?.canvas_width || 1200} × {platformSpec?.canvas_height || 630}px
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: '#64748b', fontSize: '13px' }}>
        <span>✏️</span>
        <span><strong>Double-click any text layer</strong> to edit copy live on the artboard. Drag to reposition.</span>
      </div>

      {/* WCAG 2.1 Contrast & Legibility Auditor */}
      {showWcagAuditor && (
        <WcagAuditorDrawer
          palette={palette}
          themeConfig={themeConfig}
          onClose={() => setShowWcagAuditor(false)}
        />
      )}

      {/* Custom Bilingual Copy Editor Drawer */}
      {showCopyEditor && (
        <CopyEditorDrawer
          currentSlots={customSlots || palette.contentSlots || { en: DEFAULT_EN_SLOTS, si: DEFAULT_SI_SLOTS }}
          onApplySlots={(newSlots) => {
            setCustomSlots(newSlots)
            setShowCopyEditor(false)
          }}
          onResetSlots={() => {
            setCustomSlots(null)
            setShowCopyEditor(false)
          }}
          onClose={() => setShowCopyEditor(false)}
        />
      )}

      {/* Pairwise A/B Comparison Modal */}
      {showCompare && allPalettes && allPalettes.length >= 2 && (
        <PairwiseCompareModal
          allPalettes={allPalettes}
          userPrompt={userPrompt}
          sessionId={sessionId}
          currentPalette={palette}
          onSelectPalette={(selected) => {
            if (onSelectPalette) onSelectPalette(selected)
          }}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* Explainable AI Typographic Harmony Radar */}
      {showRadar && (
        <TypographicRadar palette={palette} onClose={() => setShowRadar(false)} />
      )}

      {/* Artboard Wrapper */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        backgroundColor: (activeTheme === 'midnight' || activeTheme === 'cyber') ? '#020617' : '#f8fafc', 
        padding: '30px 0', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        transition: 'background-color 0.2s ease'
      }}>
        <div style={{ 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
          borderRadius: '4px', 
          overflow: 'hidden', 
          display: 'inline-block',
          backgroundColor: themeConfig.bg,
          transition: 'background-color 0.2s ease'
        }}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Canvas Exporter & OFL Links */}
      <div style={{ 
        marginTop: '20px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Font Links Section */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>Recommended Typeface Bundle (OFL 1.1)</h4>
            <span style={{ fontSize: '11px', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
              Free Commercial Use
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {uniqueEnglish.map(item => (
              <div
                key={item.fileName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '16px',
                  border: '1px solid #bae6fd',
                  overflow: 'hidden'
                }}
              >
                <a 
                  href={item.googleUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="View Specimen on Google Fonts"
                  style={{ 
                    fontSize: '12px', 
                    padding: '5px 8px 5px 12px', 
                    color: '#0284c7', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontWeight: 500 
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  {item.displayName}
                </a>
                <a
                  href={item.downloadUrl}
                  download={item.fileName}
                  title={`Direct Download ${item.fileName}`}
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '5px 9px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderLeft: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  📥 .ttf
                </a>
              </div>
            ))}

            {uniqueSinhala.map(item => (
              <div
                key={item.fileName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#fef2f2',
                  borderRadius: '16px',
                  border: '1px solid #fecaca',
                  overflow: 'hidden'
                }}
              >
                <span 
                  style={{ 
                    fontSize: '12px', 
                    padding: '5px 8px 5px 12px', 
                    color: '#b91c1c', 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={item.isLegacy ? "Legacy FM (WinANSI) Font - Rendered via Dynamic Keystroke Bridge" : "Modern Unicode Font"}
                >
                  <span>🇱🇰 {item.displayName}</span>
                  <span style={{
                    fontSize: '9.5px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: item.isLegacy ? '#fee2e2' : '#dbeafe',
                    color: item.isLegacy ? '#991b1b' : '#1e40af',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    border: item.isLegacy ? '1px solid #fca5a5' : '1px solid #bfdbfe'
                  }}>
                    {item.encodingLabel}
                  </span>
                </span>
                <a
                  href={item.downloadUrl}
                  download={item.fileName}
                  title={`Direct Download ${item.fileName}`}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '5px 9px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderLeft: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  📥 .ttf
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Export PNG & Download Font Bundle */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadAllFonts}
            title="Download all recommended English and Sinhala font files for Figma/Photoshop"
            style={{
              backgroundColor: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <span>📥</span> Font Bundle (.ttf)
          </button>

          <button 
            onClick={handleExportPNG}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'background-color 0.2s, transform 0.1s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export HD Poster (2x)
          </button>
        </div>
      </div>
    </div>
  )
}