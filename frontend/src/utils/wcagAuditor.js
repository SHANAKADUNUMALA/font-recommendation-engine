/**
 * WCAG 2.1 Cross-Lingual Contrast & Typographic Legibility Auditor
 * Implements W3C relative luminance and contrast ratio algorithms with
 * specialized optical heuristics for Sinhala diacritics (kombuva, hal lakuna, etc.)
 */

// Convert hex string (#ffffff or #fff) to RGB [0-255]
export function hexToRgb(hex) {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

// Compute relative luminance L in [0, 1] per WCAG 2.1 specifications
export function getRelativeLuminance({ r, g, b }) {
  const [sR, sG, sB] = [r, g, b].map(val => {
    const v = val / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB
}

// Compute contrast ratio CR = (L1 + 0.05) / (L2 + 0.05)
export function getContrastRatio(hexColor1, hexColor2) {
  try {
    const rgb1 = hexToRgb(hexColor1)
    const rgb2 = hexToRgb(hexColor2)
    const l1 = getRelativeLuminance(rgb1)
    const l2 = getRelativeLuminance(rgb2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  } catch (e) {
    return 21.0
  }
}

/**
 * Audits all typographic roles in a palette against WCAG 2.1 AA and AAA standards
 * and evaluates Sinhala diacritic legibility risk.
 */
export function auditPaletteAccessibility(palette, themeConfig) {
  if (!palette || !palette.fonts) return null

  const bg = themeConfig?.bg || '#ffffff'
  const primaryText = themeConfig?.textPrimary || '#0f172a'
  const secondaryText = themeConfig?.textSecondary || '#334155'

  const roleAudits = palette.fonts.map(f => {
    const roleLower = f.role.toLowerCase()
    const isPrimaryRole = roleLower === 'header' || roleLower === 'cta'
    const textColor = isPrimaryRole ? primaryText : secondaryText
    const contrastRatio = getContrastRatio(textColor, bg)

    // WCAG defines "Large Text" as >= 18pt (approx 24px) or >= 14pt bold (approx 18.6px bold)
    const enSize = f.english_size || 16
    const siSize = f.sinhala_size || 16
    const maxFontSize = Math.max(enSize, siSize)
    const isLargeText = maxFontSize >= 24 || (maxFontSize >= 18 && (roleLower === 'header' || roleLower === 'subhead'))

    const aaThreshold = isLargeText ? 3.0 : 4.5
    const aaaThreshold = isLargeText ? 4.5 : 7.0

    const passAA = contrastRatio >= aaThreshold
    const passAAA = contrastRatio >= aaaThreshold

    // Sinhala Diacritic Legibility Heuristic
    // Sinhala complex diacritics (kombuva, hal lakuna, ispilla, papilla)
    // require sufficient stroke density and optical contrast at smaller sizes (< 16px).
    let diacriticLegibility = "Optimal"
    let diacriticWarning = null

    if (siSize < 13 && contrastRatio < 7.0) {
      diacriticLegibility = "Warning"
      diacriticWarning = "Small font size (< 13px) with sub-AAA contrast may blur Sinhala diacritics."
    } else if (siSize < 15 && contrastRatio < 4.5) {
      diacriticLegibility = "Poor"
      diacriticWarning = "Sub-AA contrast (< 4.5:1) will obscure subtle Sinhala diacritics on digital displays."
    } else if (contrastRatio >= 7.0) {
      diacriticLegibility = "Exceptional"
    }

    return {
      role: f.role,
      englishFont: f.english_font,
      sinhalaFont: f.sinhala_font,
      englishSize: enSize,
      sinhalaSize: siSize,
      textColor,
      bgColor: bg,
      contrastRatio: Number(contrastRatio.toFixed(2)),
      isLargeText,
      aaThreshold,
      aaaThreshold,
      passAA,
      passAAA,
      diacriticLegibility,
      diacriticWarning
    }
  })

  const totalRoles = roleAudits.length
  const aaPassedCount = roleAudits.filter(r => r.passAA).length
  const aaaPassedCount = roleAudits.filter(r => r.passAAA).length

  const overallStatus = aaaPassedCount === totalRoles 
    ? "AAA Compliant" 
    : (aaPassedCount === totalRoles ? "AA Compliant" : "Needs Review")

  const overallScore = Math.round((aaPassedCount / totalRoles) * 50 + (aaaPassedCount / totalRoles) * 50)

  return {
    themeName: themeConfig?.name || 'Studio White',
    bg,
    overallStatus,
    overallScore,
    aaPassedCount,
    aaaPassedCount,
    totalRoles,
    roleAudits
  }
}

