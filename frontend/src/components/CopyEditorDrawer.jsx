import React, { useState, useEffect } from 'react'

const COPY_PRESETS = [
  {
    name: 'Hotel & Hospitality',
    icon: '🏨',
    en: {
      header: 'Serenity & Luxury Awaits',
      subhead: 'Experience World-Class Comfort in the Hill Country',
      body: 'Indulge in handcrafted suites, organic dining, and panoramic misty views tailored for unforgettable stays.',
      cta: 'BOOK YOUR STAY'
    },
    si: {
      header: 'සුවපහසු සුඛෝපභෝගී අත්දැකීමක්',
      subhead: 'කඳුකර මනරම් පරිසරයක උසස්ම ආගන්තුක සත්කාරය',
      body: 'ස්වභාවික සුවය, පිරිසිදු ආහාර පාන සහ නවීන පහසුකම් සමඟ ඔබගේ නිවාඩුව අමතක නොවන මතකයක් කරගන්න.',
      cta: 'දැන්ම වෙන්කරවා ගන්න'
    }
  },
  {
    name: 'Artisan Cafe & Bakery',
    icon: '☕',
    en: {
      header: 'Roasted to Perfection',
      subhead: 'Fresh Single-Origin Brews & Sourdough Pastries',
      body: 'Every cup is brewed with locally sourced Arabica beans, accompanied by artisanal pastries baked fresh every morning.',
      cta: 'EXPLORE OUR MENU'
    },
    si: {
      header: 'නැවුම් රසයෙන් පිරි කෝපි',
      subhead: 'සුවිශේෂී තේරීම් සහ දේශීය රසැති බේකරි නිෂ්පාදන',
      body: 'උසස් ප්‍රමිතියේ ඇරබිකා කෝපි ඇටවලින් සකස් කළ රසවත් පාන වර්ග රැසක් දිනපතා නැවුම්ව ඔබ වෙත.',
      cta: 'මෙනුව බලන්න'
    }
  },
  {
    name: 'Tech & Conference',
    icon: '💻',
    en: {
      header: 'Innovate the Future of AI',
      subhead: 'South Asia Typographic & AI Leadership Summit 2026',
      body: 'Connect with leading researchers, engineers, and typographers shaping the next generation of bi-script design systems.',
      cta: 'REGISTER FOR SUMMIT'
    },
    si: {
      header: 'කෘතිම බුද්ධියේ නව යුගය',
      subhead: 'දකුණු ආසියාතික මුද්‍රණ ශිල්ප හා තාක්ෂණික සමුළුව 2026',
      body: 'ද්විභාෂා තාක්ෂණය සහ මුද්‍රණ ශිල්පය නව මානයකට ගෙන යන පුරෝගාමී පර්යේෂකයින් සමඟ එක්වන්න.',
      cta: 'නොමිලේ ලියාපදිංචි වන්න'
    }
  }
]

export default function CopyEditorDrawer({ currentSlots, onApplySlots, onResetSlots, onClose }) {
  const [enSlots, setEnSlots] = useState({
    header: currentSlots?.en?.header || "Main Headline",
    subhead: currentSlots?.en?.subhead || "Your Campaign Subtitle or Slogan",
    body: currentSlots?.en?.body || "Your primary body content, features, or details will appear here.",
    cta: currentSlots?.en?.cta || "CALL TO ACTION"
  })

  const [siSlots, setSiSlots] = useState({
    header: currentSlots?.si?.header || "ප්‍රධාන මාතෘකාව",
    subhead: currentSlots?.si?.subhead || "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව",
    body: currentSlots?.si?.body || "වැඩිදුර විස්තර, සේවාවන් සහ අන්තර්ගතය මෙහි ඇතුළත් කරන්න.",
    cta: currentSlots?.si?.cta || "මෙතනින් පිවිසෙන්න"
  })

  useEffect(() => {
    if (currentSlots) {
      if (currentSlots.en) setEnSlots(prev => ({ ...prev, ...currentSlots.en }))
      if (currentSlots.si) setSiSlots(prev => ({ ...prev, ...currentSlots.si }))
    }
  }, [currentSlots])

  const handleApplyPreset = (preset) => {
    setEnSlots(preset.en)
    setSiSlots(preset.si)
  }

  const handleReset = () => {
    setEnSlots({
      header: "Main Headline",
      subhead: "Your Campaign Subtitle or Slogan",
      body: "Your primary body content, features, or details will appear here.",
      cta: "CALL TO ACTION"
    })
    setSiSlots({
      header: "ප්‍රධාන මාතෘකාව",
      subhead: "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව",
      body: "වැඩිදුර විස්තර, සේවාවන් සහ අන්තර්ගතය මෙහි ඇතුළත් කරන්න.",
      cta: "මෙතනින් පිවිසෙන්න"
    })
    if (onResetSlots) onResetSlots()
  }

  const handleSave = (e) => {
    e.preventDefault()
    onApplySlots({ en: enSlots, si: siSlots })
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>✏️</span>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
            Custom Bilingual Copy Editor
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
            Auto-converted for FM/Legacy fonts
          </span>
        </div>
        <button
          onClick={onClose}
          type="button"
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
      </div>

      {/* Preset Quick-Buttons */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Apply Preset:</span>
        {COPY_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleApplyPreset(p)}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 500,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <span>{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      {/* Form Fields: English (Left) and Sinhala (Right) */}
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {/* English Inputs */}
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🇬🇧</span> English Copy Slots
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Headline [Header]
              </label>
              <input
                type="text"
                value={enSlots.header}
                onChange={(e) => setEnSlots({ ...enSlots, header: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Subtitle / Slogan [Subhead]
              </label>
              <input
                type="text"
                value={enSlots.subhead}
                onChange={(e) => setEnSlots({ ...enSlots, subhead: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Body Paragraph [Body]
              </label>
              <textarea
                rows={2}
                value={enSlots.body}
                onChange={(e) => setEnSlots({ ...enSlots, body: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Call-to-Action [CTA]
              </label>
              <input
                type="text"
                value={enSlots.cta}
                onChange={(e) => setEnSlots({ ...enSlots, cta: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Sinhala Inputs */}
          <div style={{ backgroundColor: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🇱🇰</span> Sinhala Copy Slots (Unicode)
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7f1d1d', marginBottom: '4px' }}>
                ප්‍රධාන මාතෘකාව [Header]
              </label>
              <input
                type="text"
                value={siSlots.header}
                onChange={(e) => setSiSlots({ ...siSlots, header: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #fecaca', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7f1d1d', marginBottom: '4px' }}>
                උප මාතෘකාව හෝ සටන්පාඨය [Subhead]
              </label>
              <input
                type="text"
                value={siSlots.subhead}
                onChange={(e) => setSiSlots({ ...siSlots, subhead: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #fecaca', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7f1d1d', marginBottom: '4px' }}>
                විස්තර ඡේදය [Body]
              </label>
              <textarea
                rows={2}
                value={siSlots.body}
                onChange={(e) => setSiSlots({ ...siSlots, body: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #fecaca', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7f1d1d', marginBottom: '4px' }}>
                ක්‍රියාන්විත පාඨය [CTA]
              </label>
              <input
                type="text"
                value={siSlots.cta}
                onChange={(e) => setSiSlots({ ...siSlots, cta: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #fecaca', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 500,
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            ✓ Apply to Artboard
          </button>
        </div>
      </form>
    </div>
  )
}

