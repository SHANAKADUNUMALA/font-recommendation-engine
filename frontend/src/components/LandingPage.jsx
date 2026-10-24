import React from 'react'

export default function LandingPage({ 
  currentUser, 
  onLaunchStudio, 
  onOpenLogin, 
  onSignOut,
  onOpenAdminPortal 
}) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 50,
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 800
          }}>
            Aa
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Typographic AI
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              Bi-Script Latin-Sinhala Matching Engine
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#features" style={{ fontSize: '13.5px', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>Features</a>
          <a href="#bi-script-ai" style={{ fontSize: '13.5px', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>AI Architecture</a>
          <a href="#academic-research" style={{ fontSize: '13.5px', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>Research Telemetry</a>
        </nav>

        {/* Right Auth / Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: currentUser.role === 'admin' ? '#f5f3ff' : '#eff6ff',
                color: currentUser.role === 'admin' ? '#7c3aed' : '#1d4ed8',
                border: currentUser.role === 'admin' ? '1px solid #ddd6fe' : '1px solid #bfdbfe'
              }}>
                {currentUser.role === 'admin' ? '🛡️ Admin' : '👤 Designer'}: {currentUser.name}
              </span>
              
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={onOpenAdminPortal}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #334155',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                >
                  <span>🛡️</span>
                  <span>Admin Console</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLaunchStudio}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Open Studio →
              </button>

              <button
                type="button"
                onClick={onSignOut}
                title="Sign out of current account"
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  color: '#64748b',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={onOpenLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#334155',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 12px'
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onLaunchStudio}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Launch Studio 🚀
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '70px 24px 60px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Research Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '12.5px',
          fontWeight: 600,
          marginBottom: '24px'
        }}>
          <span>✨</span>
          <span>Dual-Stream Siamese Deep Learning & Cross-Lingual Typographic Synthesis</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 62px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          margin: '0 0 16px 0'
        }}>
          Harmonizing Latin & Sinhala Typography with AI
        </h1>

        <div style={{
          fontSize: 'clamp(18px, 3vw, 24px)',
          color: '#0369a1',
          fontWeight: 600,
          marginBottom: '20px',
          letterSpacing: '-0.01em'
        }}>
          ද්විභාෂා මුද්‍රණ ශිල්පය සඳහා කෘතිම බුද්ධියෙන් බලගැන්වුණු අතිනවීන මෝස්තර නිර්මාණ පද්ධතිය.
        </div>

        <p style={{
          fontSize: '17px',
          color: '#475569',
          maxWidth: '780px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          An end-to-end intelligent design engine that bridges optical stroke contrast, physical x-height ratios, and cultural sociolinguistic hierarchy between English and Sinhala letterforms.
        </p>

        {/* CTA Button Group */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button
            type="button"
            onClick={onLaunchStudio}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            <span>🚀</span> Launch Interactive Studio
          </button>

          <button
            type="button"
            onClick={onOpenAdminPortal}
            style={{
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1.5px solid #cbd5e1',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <span>🛡️</span> {currentUser?.role === 'admin' ? 'Admin Command Console' : 'Research Telemetry Portal'}
          </button>
        </div>

        {/* Proof Metric Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          backgroundColor: '#f8fafc',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          textAlign: 'left'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>512-D</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
              Siamese Visual Feature Space
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb' }}>600+</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
              Curated OFL 1.1 Typefaces
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>100%</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
              WCAG 2.1 AA/AAA Contrast Pass
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed' }}>WinANSI ↔ Unicode</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
              Zero-Loss FM Keystroke Bridge
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Showcase */}
      <section id="features" style={{
        padding: '60px 24px',
        backgroundColor: '#fafafa',
        borderTop: '1px solid #f1f5f9',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              Complete Bilingual Design & Evaluation Suite
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
              Built specifically to address the complex morphological and sociolinguistic divergence of Latin and Indic scripts.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Card 1 */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>📊</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                5-Axis Explainable AI Radar
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Transparent mathematical evaluation across optical x-height, geometric cohesion, stroke weight balance, semantic intent, and bounding box symmetry.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>📏</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                Optical Baseline & x-Height Guides
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Fabric.js inspection overlay displaying Cap-height, Mean-height, Baseline, and Descender guides with physical normalization ratios.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>🔀</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                Pairwise A/B Scientific Voting
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Direct candidate comparison engine based on the Bradley-Terry model with real-time SQLite preference telemetry.
              </p>
            </div>

            {/* Card 4 */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>👁️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                WCAG 2.1 Contrast Auditor
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Real-time W3C relative luminance validation with specialized optical clearance heuristics for subtle Sinhala diacritics.
              </p>
            </div>

            {/* Card 5 */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>📑</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                1-Click LaTeX & Markdown Exporters
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Instant export of IEEE/ACM-ready LaTeX tables (<code style={{ fontSize: '12px' }}>\begin&#123;table&#125;</code>) and full evaluation datasets for academic papers.
              </p>
            </div>

            {/* Card 6 */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>🎨</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                Curated Brand Themes & OFL Bundle
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Studio, Luxury, Parchment, Organic, and Carbon palettes with 1-click batch font downloads for Figma and Photoshop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '30px 24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        marginTop: 'auto',
        fontSize: '13px',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          © 2026 Typographic AI Engine • Cross-Lingual Bi-Script Typographic Synthesis Research
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Free Commercial OFL 1.1 Fonts</span>
          <span>•</span>
          <span>FastAPI + PyTorch + React + Fabric.js</span>
        </div>
      </footer>
    </div>
  )
}

