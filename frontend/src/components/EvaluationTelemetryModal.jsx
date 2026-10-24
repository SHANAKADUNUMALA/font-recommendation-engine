import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function EvaluationTelemetryModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null)
  const [academicData, setAcademicData] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'latex' | 'markdown'
  const [copiedType, setCopiedType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, academicRes] = await Promise.all([
        axios.get('/api/evaluate/stats'),
        axios.get('/api/evaluate/academic-summary').catch(() => ({ data: null }))
      ])
      setStats(statsRes.data)
      setAcademicData(academicRes?.data)
    } catch (err) {
      console.error("Failed to load evaluation telemetry stats:", err)
      setError("Unable to load evaluation telemetry. Ensure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen])

  const handleCopy = (text, type) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2500)
  }

  if (!isOpen) return null

  const total = stats?.total_evaluations || 0
  const avg = stats?.average_rating || 0.0
  const dist = stats?.rating_distribution || {}

  const getPercent = (count) => {
    if (!total || !count) return 0
    return Math.round((count / total) * 100)
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px 14px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>📊</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Typographic AI Research Telemetry & Benchmark Exporter
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Academic Tier 3
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Empirical evaluation dataset for cross-script font pairing with one-click publication exports.
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '22px',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                lineHeight: 1
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              ×
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                border: 'none',
                borderBottom: activeTab === 'dashboard' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'dashboard' ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📊</span> Benchmark Dashboard
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('latex')}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'latex' ? 700 : 500,
                border: 'none',
                borderBottom: activeTab === 'latex' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'latex' ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📄</span> LaTeX Table (<code style={{ fontSize: '11px' }}>\begin&#123;table&#125;</code>)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('markdown')}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'markdown' ? 700 : 500,
                border: 'none',
                borderBottom: activeTab === 'markdown' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'markdown' ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📝</span> Markdown Report (.md)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading && !stats && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '14px' }}>
              Loading telemetry metrics...
            </div>
          )}

          {error && (
            <div style={{ padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13.5px' }}>
              {error}
            </div>
          )}

          {/* TAB 1: TELEMETRY DASHBOARD */}
          {activeTab === 'dashboard' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Top Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Ratings
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                    {total}
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px', fontWeight: 500 }}>
                    5-Star Likert
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mean Opinion Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>
                      {avg.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>/ 5.0</span>
                    <span style={{ color: '#f59e0b', fontSize: '18px' }}>★</span>
                  </div>
                  <div style={{ fontSize: '12px', color: avg >= 4 ? '#16a34a' : '#ca8a04', marginTop: '2px', fontWeight: 500 }}>
                    {avg >= 4 ? 'Exceptional Match' : 'Acceptable Match'}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pairwise A/B Votes
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6', marginTop: '6px' }}>
                    {stats?.total_pairwise_evaluations || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '2px', fontWeight: 500 }}>
                    Comparative Decisions
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Neural Matcher
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginTop: '10px' }}>
                    Siamese Loaded
                  </div>
                  <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px', fontWeight: 500 }}>
                    512-dim Metric Space
                  </div>
                </div>
              </div>

              {/* Rating Distribution Bar Chart */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>
                  Rating Distribution (1–5 Stars)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[5, 4, 3, 2, 1].map(stars => {
                    const count = dist[`${stars}_star`] || 0
                    const pct = getPercent(count)
                    return (
                      <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                        <span style={{ width: '50px', color: '#475569', fontWeight: 500 }}>{stars} Star</span>
                        <div style={{ flex: 1, height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${pct}%`, 
                              height: '100%', 
                              backgroundColor: stars >= 4 ? '#22c55e' : (stars >= 3 ? '#eab308' : '#ef4444'),
                              borderRadius: '5px',
                              transition: 'width 0.4s ease'
                            }} 
                          />
                        </div>
                        <span style={{ width: '60px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Pairwise A/B Comparative Decisions */}
              {stats.recent_pairwise && stats.recent_pairwise.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔀</span> Recent Pairwise A/B Decisions
                  </h4>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stats.recent_pairwise.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '10px 14px', 
                          backgroundColor: '#faf5ff', 
                          borderRadius: '8px', 
                          border: '1px solid #f3e8ff',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#6b21a8' }}>
                            Preferred Palette #{item.chosen_palette} over #{item.chosen_palette === item.palette_a ? item.palette_b : item.palette_a}
                          </span>
                          <span style={{ fontSize: '11px', color: '#a855f7' }}>
                            {item.timestamp?.slice(0, 16)}
                          </span>
                        </div>
                        {item.rationale && (
                          <div style={{ color: '#581c87', fontStyle: 'italic', marginBottom: '3px' }}>
                            "{item.rationale}"
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#9333ea' }}>
                          Prompt: "{item.user_prompt}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Qualitative Observations */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
                  Recent 5-Star Evaluator Notes
                </h4>
                {stats.recent_feedback?.length > 0 ? (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stats.recent_feedback.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '10px 14px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            Palette #{item.palette_number || 1} • <span style={{ color: '#f59e0b' }}>{'★'.repeat(item.rating)}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {item.timestamp?.slice(0, 16)}
                          </span>
                        </div>
                        <div style={{ color: '#475569', fontStyle: item.comments ? 'normal' : 'italic' }}>
                          {item.comments ? `"${item.comments}"` : 'No qualitative note added'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          Prompt: "{item.user_prompt}"
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px' }}>
                    No evaluations submitted yet. Rate palettes below the canvas to log data.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LATEX BENCHMARK TABLE EXPORTER */}
          {activeTab === 'latex' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>
                    Publication-Ready LaTeX Benchmark Table
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Standard IEEE / ACM table formatted with empirical MOS, sample sizes, and cross-script harmony metrics.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(academicData?.latex, 'latex')}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: copiedType === 'latex' ? '#15803d' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{copiedType === 'latex' ? '✓ Copied!' : '📋 Copy LaTeX Code'}</span>
                  </button>

                  <a
                    href="/api/evaluate/export-latex"
                    download="typographic_ai_benchmark.tex"
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>📥</span> .tex
                  </a>
                </div>
              </div>

              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                overflowX: 'auto',
                lineHeight: '1.6',
                border: '1px solid #1e293b'
              }}>
                {academicData?.latex || "% Loading LaTeX table..."}
              </pre>
            </div>
          )}

          {/* TAB 3: MARKDOWN BENCHMARK REPORT EXPORTER */}
          {activeTab === 'markdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>
                    Formatted Markdown Benchmark Report
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Ready to paste into GitHub README, research documentation, or thesis reports.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(academicData?.markdown, 'markdown')}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: copiedType === 'markdown' ? '#15803d' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{copiedType === 'markdown' ? '✓ Copied!' : '📋 Copy Markdown'}</span>
                  </button>

                  <a
                    href="/api/evaluate/export-markdown"
                    download="typographic_ai_benchmark_report.md"
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>📥</span> .md
                  </a>
                </div>
              </div>

              <pre style={{
                backgroundColor: '#f8fafc',
                color: '#334155',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                overflowX: 'auto',
                lineHeight: '1.6',
                border: '1px solid #cbd5e1',
                whiteSpace: 'pre-wrap'
              }}>
                {academicData?.markdown || "# Loading Markdown report..."}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer with Direct Download Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={fetchStats}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="/api/evaluate/export-csv"
              download="typographic_ai_evaluation_dataset.csv"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>📥</span> Raw (.CSV)
            </a>

            <a
              href="/api/evaluate/export-latex"
              download="typographic_ai_benchmark.tex"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>📄</span> LaTeX (.tex)
            </a>

            <a
              href="/api/evaluate/export-markdown"
              download="typographic_ai_benchmark_report.md"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                backgroundColor: '#475569',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>📝</span> Report (.md)
            </a>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
