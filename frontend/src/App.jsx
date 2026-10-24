import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import CanvasPreview, { formatFontDisplayName } from './components/CanvasPreview.jsx'
import EvaluationTelemetryModal from './components/EvaluationTelemetryModal.jsx'
import LandingPage from './components/LandingPage.jsx'
import AuthModal from './components/AuthModal.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import { createInitialSession, getStorageKeyForUser, loadSessionsForUser } from './utils/sessionStorage.js'

// Levenshtein distance for fuzzy typo matching in language preferences
function minDistance(s1, s2) {
  const m = s1.length, n = s2.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function detectStrategyIntent(text) {
  const clean = text.toLowerCase().trim()

  // 1. Direct keywords combining strategy/preference/hierarchy/language with direction descriptors
  if (/\b(strategy|strategies|preference|preferences|prefercnce|prefercnces|hierarchy|dominance|language|languages|linguistic|lang|layout)\b/i.test(clean)) {
    if (/\b(local|traditional|cultural|heritage|village|domestic|rural|sinhala|sinhalese|native)\b/i.test(clean)) return true
    if (/\b(global|corporate|international|foreign|premium|english|worldwide)\b/i.test(clean)) return true
    if (/\b(bilingual|balanced|balance|equal|dual|both)\b/i.test(clean)) return true
  }

  // 2. Direct action phrases like "make the strategy feel very global and corporate", "use local preferences"
  if (/\b(make|feel|look|set|use|apply|switch|turn|change|prefer|prioritize)\b.*?\b(global|corporate|international|local|traditional|cultural|bilingual|balanced|sinhala|english)\b/i.test(clean)) {
    return true
  }

  // 3. Compound language strategy phrases & patterns
  const strategyPhrases = [
    /\b(sinhala|english|bilingual|local|global)\s*[- ]\s*(dominant|dominance|balanced|balance|preference|preferences|priority|first|primary|lead|version)\b/i,
    /\b(dominant|dominance|balanced|priority)\s+(sinhala|english|bilingual|local|global)\b/i,
    // References to previous/prior design + language/preference
    /\b(previous|previouse|prior|last|earlier|this)\b.*?\b(language|languages|lang|preference|preferences|prefercnce|prefercnces|strategy|hierarchy)\b/i,
    /\b(language|languages|lang|preference|preferences|prefercnce|prefercnces|strategy|hierarchy)\b.*?\b(previous|previouse|prior|last|earlier|this)\b/i,
    /\b(typographic|typography)\s+(strategy|hierarchy|dominance|balance)\b/i,
    /\b(more|less|only)\s+(sinhala|english)\b/i,
    /\b(sinhala|english)\s+(only|mode|focus)\b/i,
    /\b(what\s+language|which\s+language|language\s+should|language\s+hierarchy)\b/i,
    /\b(sinhala-dominant|english-dominant|bilingual-balanced)\b/i
  ]
  if (strategyPhrases.some(pattern => pattern.test(clean))) return true

  // 4. Standalone dominance keywords
  if (/\b(dominant|dominance)\b/i.test(clean)) return true
  if (/\b(bilingual\s+balance|bilingual\s+balanced)\b/i.test(clean)) return true

  // 5. Typo-tolerant checks for domain terms (allowing Levenshtein distance <= 2 for words like prefercnces)
  const typoTolerantKeywords = ['dominant', 'dominance', 'bilingual', 'preference', 'preferences', 'strategy', 'language']
  const words = clean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 5)
  for (const w of words) {
    for (const kw of typoTolerantKeywords) {
      if (minDistance(w, kw) <= 2) {
        if (kw === 'dominant' || kw === 'dominance' || kw === 'bilingual') return true
        if (clean.includes('lang') || clean.includes('sinh') || clean.includes('eng') || clean.includes('poster') || clean.includes('hotel') || clean.includes('previous') || clean.includes('prefer') || clean.includes('global') || clean.includes('local') || clean.includes('corporate')) return true
      }
    }
  }

  return false
}

function extractReferencedTopic(text) {
  const clean = text.toLowerCase()
  const stopWords = new Set([
    'i', 'want', 'to', 'can', 'you', 'please', 'give', 'me', 'tell', 'show', 'what', 'which', 'how', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'on', 'with',
    'language', 'languages', 'lang', 'linguistic', 'preference', 'preferences', 'prefercnce', 'prefercnces', 'prefrences', 'prefrence', 'preferance', 'preferances', 'strategy', 'strategies', 'hierarchy', 'dominance', 'dominant', 'balanced', 'balance',
    'previous', 'previouse', 'prior', 'last', 'earlier', 'existing', 'this', 'that', 'these', 'those', 'poster', 'posters', 'post', 'design', 'designs', 'flyer', 'flyers', 'banner', 'banners', 'layout', 'layouts', 'card', 'cards',
    // Strategy direction modifiers - these describe the strategy style, NOT a topic
    'local', 'traditional', 'cultural', 'heritage', 'village', 'domestic', 'rural', 'sinhala', 'sinhalese', 'native',
    'global', 'corporate', 'international', 'foreign', 'premium', 'english', 'worldwide',
    'bilingual', 'balanced', 'equal', 'dual', 'both', 'neutral',
    'make', 'feel', 'look', 'very', 'use', 'set', 'apply', 'switch', 'turn', 'change', 'prefer', 'prioritize', 'more', 'less', 'only',
    // Test benchmark & conversational meta-words
    'intent', 'intents', 'expects', 'expect', 'expected', 'related', 'handle', 'handled', 'handling', 'please', 'buddy', 'now', 'test', 'testing', 'case', 'cases', 'role', 'roles', 'version', 'option', 'recommendation'
  ])
  const tokens = clean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => {
    if (w.length < 3) return false
    if (stopWords.has(w)) return false
    if (minDistance(w, 'preference') <= 2 || minDistance(w, 'preferences') <= 2) return false
    if (minDistance(w, 'strategy') <= 2 || minDistance(w, 'language') <= 2 || minDistance(w, 'dominant') <= 2) return false
    return true
  })
  return tokens
}

// 5-Star Telemetry Evaluation Module
function FeedbackModule({ session, palette }) {
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [isHovering, setIsHovering] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!palette) return null

  const ratingLabels = [
    "",
    "Poor Harmony",
    "Fair Match",
    "Good Balance",
    "Strong Match",
    "Exceptional Pairing"
  ]

  const quickTags = [
    "Baseline Aligned",
    "Proportional x-Height",
    "Authentic Cultural Resonance",
    "Clear Hierarchy",
    "Balanced Visual Weight",
    "Clean Stroke Contrast"
  ]

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setIsSubmitting(true)
    try {
      const combinedComments = [
        ...selectedTags,
        comments.trim()
      ].filter(Boolean).join(" | ")

      await axios.post('/api/evaluate', {
        session_id: session.id,
        user_prompt: palette.userPrompt || "N/A",
        palette_number: palette.palette_number || 1,
        rating: rating,
        comments: combinedComments || "No additional comments"
      })
      setSubmitted(true)
    } catch (error) {
      console.error("Evaluation submission failed", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ 
        marginTop: '20px', 
        padding: '16px 20px', 
        backgroundColor: '#f0fdf4', 
        color: '#166534', 
        borderRadius: '12px', 
        border: '1px solid #bbf7d0', 
        fontSize: '14px', 
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <span style={{ fontSize: '20px' }}>✓</span>
        <div>
          <div style={{ fontWeight: 600 }}>Thank you! Your feedback has been recorded.</div>
          <div style={{ fontSize: '13px', color: '#15803d', marginTop: '2px' }}>
            Your rating directly evaluates and benchmarks the Siamese Network's font matching accuracy.
          </div>
        </div>
      </div>
    )
  }

  const activeStar = isHovering || rating

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '20px 24px', 
      backgroundColor: '#f8fafc', 
      borderRadius: '14px', 
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px' }}>📊</span>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 600 }}>
              Rate this Typographic Match (Palette {palette.palette_number || 1})
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Your feedback directly evaluates the Siamese Network's structural cross-script alignment.
          </p>
        </div>

        {activeStar > 0 && (
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: activeStar >= 4 ? '#16a34a' : (activeStar >= 3 ? '#ca8a04' : '#dc2626'),
            backgroundColor: activeStar >= 4 ? '#dcfce7' : (activeStar >= 3 ? '#fef9c3' : '#fee2e2'),
            padding: '4px 10px',
            borderRadius: '12px',
            border: `1px solid ${activeStar >= 4 ? '#bbf7d0' : (activeStar >= 3 ? '#fde047' : '#fecaca')}`
          }}>
            {activeStar} / 5 • {ratingLabels[activeStar]}
          </span>
        )}
      </div>
      
      {/* Star Row */}
      <div style={{ display: 'flex', gap: '6px', margin: '12px 0 14px 0' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button 
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setIsHovering(star)}
            onMouseLeave={() => setIsHovering(0)}
            aria-label={`Rate ${star} star`}
            style={{
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '28px', 
              padding: '2px',
              lineHeight: 1,
              color: star <= activeStar ? '#f59e0b' : '#cbd5e1',
              transition: 'color 0.15s, transform 0.1s',
              transform: star === isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            ★
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Quick Alignment Notes (optional):
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {quickTags.map(tag => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      fontSize: '12px',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#1d4ed8' : '#475569',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isSelected ? `✓ ${tag}` : tag}
                  </button>
                )
              })}
            </div>
          </div>

          <textarea 
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Any specific observations on baseline alignment, visual weight balance, stroke contrast, or cultural fit?"
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              fontSize: '13.5px', 
              fontFamily: 'inherit', 
              resize: 'vertical', 
              minHeight: '65px', 
              outlineColor: '#2563eb',
              backgroundColor: '#ffffff'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ 
                padding: '9px 20px', 
                backgroundColor: '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 600, 
                fontSize: '13.5px', 
                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit Evaluation'}</span>
            </button>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Logs directly to the SQLite research telemetry database</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('typographic_ai_user')
      if (savedUser) return JSON.parse(savedUser)
    } catch (e) {}
    return null
  })

  const [sessions, setSessions] = useState(() => {
    return loadSessionsForUser(currentUser)
  })

  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || '')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTelemetryModal, setShowTelemetryModal] = useState(false)
  const [currentView, setCurrentView] = useState('landing') // 'landing' | 'studio'
  const [showAuthModal, setShowAuthModal] = useState(false)
  const messagesEndRef = useRef(null)

  const handleLoginSuccess = (user) => {
    // 1. Save current active workspace before switching
    try {
      const currentKey = getStorageKeyForUser(currentUser)
      localStorage.setItem(currentKey, JSON.stringify(sessions))
    } catch (e) {}

    // 2. Persist new user
    setCurrentUser(user)
    try {
      localStorage.setItem('typographic_ai_user', JSON.stringify(user))
    } catch (e) {}

    // 3. Load target user's private sessions
    const userSessions = loadSessionsForUser(user)
    setSessions(userSessions)
    setActiveSessionId(userSessions[0]?.id || '')

    // 4. Route to studio
    setCurrentView('studio')
  }

  const handleSignOut = () => {
    // 1. Save current user's workspace before logging out
    try {
      const currentKey = getStorageKeyForUser(currentUser)
      localStorage.setItem(currentKey, JSON.stringify(sessions))
    } catch (e) {}

    // 2. Clear current user
    setCurrentUser(null)
    try {
      localStorage.removeItem('typographic_ai_user')
    } catch (e) {}

    // 3. Load guest sessions
    const guestSessions = loadSessionsForUser(null)
    setSessions(guestSessions)
    setActiveSessionId(guestSessions[0]?.id || '')

    // 4. Return to landing page
    setCurrentView('landing')
  }

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0]

  useEffect(() => {
    try {
      const key = getStorageKeyForUser(currentUser)
      localStorage.setItem(key, JSON.stringify(sessions))
    } catch (e) {
      console.warn("Could not sync user sessions to localStorage:", e)
    }
  }, [sessions, currentUser])

  const prevMessagesLengthRef = useRef(activeSession?.messages?.length || 0)
  const prevSessionIdRef = useRef(activeSession?.id)

  useEffect(() => {
    const currentLength = activeSession?.messages?.length || 0
    const sessionChanged = activeSession?.id !== prevSessionIdRef.current

    // Only auto-scroll when a new message is added or when switching sessions
    if (sessionChanged || currentLength > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    prevMessagesLengthRef.current = currentLength
    prevSessionIdRef.current = activeSession?.id
  }, [activeSession?.messages?.length, activeSession?.id])

  const handleNewSession = () => {
    const newSession = createInitialSession()
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
  }

  const handleDeleteSession = (e, id) => {
    e.stopPropagation()
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id)
      if (filtered.length === 0) {
        const fresh = createInitialSession()
        setActiveSessionId(fresh.id)
        return [fresh]
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id)
      }
      return filtered
    })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userText = input.trim()
    const lowerInput = userText.toLowerCase()
    const userMsg = { id: Date.now(), sender: 'user', type: 'text', text: userText }

    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        const shouldUpdateTitle = s.title === 'New Design Session'
        const newTitle = shouldUpdateTitle 
          ? (userText.length > 28 ? userText.slice(0, 25) + '...' : userText)
          : s.title
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg]
        }
      }
      return s
    }))

    setInput("")
    setLoading(true)

    try {
      // 1. Quick greetings handler
      if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|good night)/.test(lowerInput) && lowerInput.length < 25) {
        setTimeout(() => {
          setSessions(prev => prev.map(s => s.id === activeSession.id ? {
            ...s,
            messages: [...s.messages, {
              id: Date.now() + 1,
              sender: 'ai',
              type: 'text',
              text: "Hi there! I am your Typographic AI Engine. What kind of design are we crafting today? (e.g. 'Instagram poster for a coffee shop')"
            }]
          } : s))
          setLoading(false)
        }, 300)
        return
      }

      // Quick small talk handler
      if (/^(thanks|thank you|great|awesome|good job|ok|okay|cool|perfect)/.test(lowerInput) && lowerInput.length < 30) {
        setTimeout(() => {
          setSessions(prev => prev.map(s => s.id === activeSession.id ? {
            ...s,
            messages: [...s.messages, {
              id: Date.now() + 1,
              sender: 'ai',
              type: 'text',
              text: "You're welcome! Feel free to ask for another design, adjust the language hierarchy, or test typography pairings anytime."
            }]
          } : s))
          setLoading(false)
        }, 300)
        return
      }

      const isAskingForStrategy = detectStrategyIntent(lowerInput)
      const isExplicitNewDesign = /(create\s+a\s+new|start\s+from\s+scratch|start\s+over|generate\s+another\s+new|brand\s+new\s+poster|brand\s+new\s+design)/i.test(lowerInput)
      const isAskingForNew = isExplicitNewDesign || /(create a new|start from scratch|another poster|new poster|start over|new design)/i.test(lowerInput)
      const isQuestion = /^(what|how|why|who|when|where|explain|tell me)/.test(lowerInput) || lowerInput.includes("?")
      const isRationaleQuery = /(rationale|pairings?\s+rationale|why\s+(were|are)\s+these\s+fonts|font\s+pairing|why\s+this\s+font|why\s+these\s+fonts|paired\s+together|optical\s+compensation|x-height|baseline\s+alignment)/i.test(lowerInput)
      const isGenerativeAction = /(create|design|generate|make a|make an|need a|want a|give me|recommend\s+(fonts?|a\s+palette|pairings?))/i.test(lowerInput)
      const isGenerativeIntent = isGenerativeAction || /(poster|post\b|flyer|banner|card\b|ad\b|advertisement|layout|palette|pairing|instergram|instagram|facebook|\bfb\b|social media|social medio|coffee|cafe|restaurant|startup|bakery|gym|hotel|boutique|clinic|salon|shop|store|brand|company|business|fashion|food|event|festival|wedding|tech\b|modern|traditional|vintage|luxury|minimalist)/i.test(lowerInput)

      const isExplicitStrategyChange = isAskingForStrategy && !isExplicitNewDesign

      // 2. Language Strategy route (referencing current or previous design from memory)
      if (isExplicitStrategyChange) {
        const topicTokens = extractReferencedTopic(lowerInput)

        // 1. If user specified topic tokens (e.g. ["modern", "spa"] or ["hotel"]), search memory for matching palette
        let targetPalette = null
        if (topicTokens.length > 0) {
          let maxScore = 0
          for (const msg of activeSession.messages) {
            if (msg.type === 'palettes' && msg.selectedPalette) {
              const pLower = (msg.selectedPalette.userPrompt || '').toLowerCase()
              const score = topicTokens.filter(t => pLower.includes(t)).length
              if (score > maxScore) {
                maxScore = score
                targetPalette = msg.selectedPalette
              }
            }
          }
          // Search across all other sessions if not found in current session
          if (!targetPalette && sessions) {
            for (const s of sessions) {
              if (s.id === activeSession.id) continue
              for (const msg of s.messages) {
                if (msg.type === 'palettes' && msg.selectedPalette) {
                  const pLower = (msg.selectedPalette.userPrompt || '').toLowerCase()
                  const score = topicTokens.filter(t => pLower.includes(t)).length
                  if (score > maxScore) {
                    maxScore = score
                    targetPalette = msg.selectedPalette
                  }
                }
              }
            }
          }
        }

        // Fallback: If no topic-specific prior poster matched or no tokens were provided,
        // use the active session's latest poster if one exists.
        if (!targetPalette) {
          targetPalette = activeSession.latestPalette
        }

        // Case A: A matching or active design was found in session memory
        if (targetPalette) {
          const response = await axios.post('/api/language-strategy', {
            follow_up_prompt: userText,
            selected_palette: targetPalette,
            design_context: targetPalette.userPrompt || ""
          })

          const strategyData = response.data
          const updatedPalette = {
            ...targetPalette,
            activeStrategy: strategyData
          }

          setSessions(prev => prev.map(s => s.id === activeSession.id ? {
            ...s,
            latestPalette: updatedPalette,
            messages: [...s.messages, {
              id: Date.now() + 1,
              sender: 'ai',
              type: 'strategy',
              data: strategyData,
              selectedPalette: updatedPalette,
              platformSpec: updatedPalette.platformSpec
            }]
          } : s))
        } else {
          // Case B: User requested language preferences for a design that does NOT exist in memory yet
          let fallbackTopic = "creative promotional poster"
          if (/\b(local|traditional|cultural|heritage|sinhala)\b/i.test(lowerInput)) {
            fallbackTopic = "traditional cultural poster"
          } else if (/\b(global|corporate|international|english|business)\b/i.test(lowerInput)) {
            fallbackTopic = "modern corporate poster"
          }
          const generatedTopic = topicTokens.length > 0 ? `${topicTokens.join(' ')} poster` : fallbackTopic
          const recResponse = await axios.post('/api/recommend', { prompt: generatedTopic })
          const messageId = Date.now() + 1
          const platformSpec = recResponse.data.platform_spec || { platform: 'facebook', canvas_width: 1200, canvas_height: 630 }
          const backendSlots = recResponse.data.content_slots || null

          const basePalette = recResponse.data.palettes[0]
          const enrichedPalette = {
            ...basePalette,
            userPrompt: generatedTopic,
            selectionId: `${messageId}-${basePalette.palette_number}`,
            platformSpec: platformSpec,
            contentSlots: backendSlots
          }

          const stratResponse = await axios.post('/api/language-strategy', {
            follow_up_prompt: userText,
            selected_palette: enrichedPalette,
            design_context: generatedTopic
          })

          const finalPalette = {
            ...enrichedPalette,
            activeStrategy: stratResponse.data
          }

          const allPalettes = recResponse.data.palettes.map(p => ({
            ...p,
            userPrompt: generatedTopic,
            selectionId: `${messageId}-${p.palette_number}`,
            platformSpec: platformSpec,
            contentSlots: backendSlots,
            activeStrategy: stratResponse.data
          }))

          setSessions(prev => prev.map(s => s.id === activeSession.id ? {
            ...s,
            latestPalette: finalPalette,
            messages: [
              ...s.messages,
              {
                id: messageId,
                sender: 'ai',
                type: 'palettes',
                data: allPalettes,
                platformSpec: platformSpec,
                selectedPalette: finalPalette
              },
              {
                id: messageId + 1,
                sender: 'ai',
                type: 'strategy',
                data: stratResponse.data,
                selectedPalette: finalPalette,
                platformSpec: platformSpec
              }
            ]
          } : s))
        }
        setLoading(false)
        return
      }
      // 3. Educational / Typographic Rationale Question with conversational memory
      else if ((isQuestion || isRationaleQuery) && !isGenerativeAction) {
        const currentPalette = activeSession.latestPalette || 
          [...activeSession.messages].reverse().find(m => m.selectedPalette || (m.type === 'palettes' && m.data?.[0]))?.selectedPalette ||
          [...activeSession.messages].reverse().find(m => m.type === 'palettes' && m.data?.[0])?.data?.[0] || null

        const chatContext = {
          design_prompt: currentPalette?.userPrompt,
          platform: currentPalette?.platformSpec?.platform,
          active_palette: currentPalette,
          active_strategy: currentPalette?.activeStrategy
        }
        const response = await axios.post('/api/chat', { 
          prompt: userText,
          context: chatContext,
          history: activeSession.messages 
        })
        setSessions(prev => prev.map(s => s.id === activeSession.id ? {
          ...s,
          messages: [...s.messages, {
            id: Date.now() + 1,
            sender: 'ai',
            type: 'text',
            text: response.data.reply
          }]
        } : s))
      }
      // 4. Generative Font Recommendation route (Siamese Network + Modular Scale + Layout)
      else if (isGenerativeIntent || isAskingForNew || (!activeSession.latestPalette && !isQuestion)) {
        const response = await axios.post('/api/recommend', { prompt: userText })
        const messageId = Date.now() + 1
        const platformSpec = response.data.platform_spec || { platform: 'facebook', canvas_width: 1200, canvas_height: 630 }
        
        // Authoritative backend content slots with full bilingual translations
        const backendSlots = response.data.content_slots || null

        const enrichedPalettes = response.data.palettes.map(palette => ({
          ...palette,
          userPrompt: userText,
          selectionId: `${messageId}-${palette.palette_number}`,
          platformSpec: platformSpec,
          contentSlots: backendSlots,
          activeStrategy: null
        }))

        setSessions(prev => prev.map(s => s.id === activeSession.id ? {
          ...s,
          latestPalette: enrichedPalettes[0],
          messages: [...s.messages, {
            id: messageId,
            sender: 'ai',
            type: 'palettes',
            data: enrichedPalettes,
            platformSpec: platformSpec,
            selectedPalette: enrichedPalettes[0]
          }]
        } : s))
      } 
      // 5. Fallback LLM / Typography Q&A route with session memory
      else {
        const chatContext = {
          design_prompt: activeSession.latestPalette?.userPrompt,
          platform: activeSession.latestPalette?.platformSpec?.platform,
          active_palette: activeSession.latestPalette,
          active_strategy: activeSession.latestPalette?.activeStrategy
        }
        const response = await axios.post('/api/chat', { 
          prompt: userText,
          context: chatContext,
          history: activeSession.messages 
        })
        setSessions(prev => prev.map(s => s.id === activeSession.id ? {
          ...s,
          messages: [...s.messages, {
            id: Date.now() + 1,
            sender: 'ai',
            type: 'text',
            text: response.data.reply
          }]
        } : s))
      }
    } catch (error) {
      console.error("API Gateway error:", error)
      setSessions(prev => prev.map(s => s.id === activeSession.id ? {
        ...s,
        messages: [...s.messages, {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'text',
          text: "I was unable to complete that request. Please verify the backend servers are running."
        }]
      } : s))
    }

    setLoading(false)
  }

  const updateMessagePalette = (msgId, newPalette) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSession.id) return s

      const msgIndex = s.messages.findIndex(m => m.id === msgId)
      if (msgIndex === -1) return s

      const newMessages = [...s.messages]
      newMessages[msgIndex] = { ...newMessages[msgIndex], selectedPalette: newPalette }

      for (let i = msgIndex + 1; i < newMessages.length; i++) {
        if (newMessages[i].type === 'palettes') break
        if (newMessages[i].type === 'strategy') {
          newMessages[i] = {
            ...newMessages[i],
            selectedPalette: { ...newPalette, activeStrategy: newMessages[i].data }
          }
        }
      }

      // Only update session's latestPalette if this is the newest recommendation card
      const isLatestPaletteMessage = !s.messages.slice(msgIndex + 1).some(m => m.type === 'palettes')

      return {
        ...s,
        latestPalette: isLatestPaletteMessage ? newPalette : s.latestPalette,
        messages: newMessages
      }
    }))
  }

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          currentUser={currentUser}
          onLaunchStudio={() => setCurrentView('studio')}
          onOpenLogin={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
          onOpenAdminPortal={() => {
            if (currentUser?.role === 'admin') {
              setCurrentView('admin')
            } else {
              setShowAuthModal(true)
            }
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user) => {
            handleLoginSuccess(user)
            if (user?.role === 'admin') {
              setCurrentView('admin')
            }
          }}
        />
      </>
    )
  }

  if (currentView === 'admin') {
    return (
      <>
        <AdminDashboard
          currentUser={currentUser}
          onLaunchStudio={() => setCurrentView('studio')}
          onReturnHome={() => setCurrentView('landing')}
          onSignOut={handleSignOut}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#ffffff', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '280px' : '0px',
        minWidth: isSidebarOpen ? '280px' : '0px',
        height: '100%',
        backgroundColor: '#f0f4f9',
        borderRight: isSidebarOpen ? '1px solid #e1e7ee' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        zIndex: 20
      }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={handleNewSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              backgroundColor: '#e3ebf6',
              color: '#1e293b',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              width: '100%',
              transition: 'background-color 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d5e2f1'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e3ebf6'}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
            <span>New design</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            padding: '8px 12px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Recent Sessions</span>
            {currentUser ? (
              <span style={{
                fontSize: '10.5px',
                color: currentUser.role === 'admin' ? '#7c3aed' : '#2563eb',
                backgroundColor: currentUser.role === 'admin' ? '#f5f3ff' : '#eff6ff',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'none'
              }}>
                {currentUser.name.split(' ')[0]}
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>
                Guest
              </span>
            )}
          </div>
          {sessions.map(s => {
            const isActive = s.id === activeSession.id
            return (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '20px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#dbe7f6' : 'transparent',
                  color: isActive ? '#0f172a' : '#475569',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => !isActive && (e.currentTarget.style.backgroundColor = '#e6edf5')}
                onMouseOut={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    title="Delete session"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '2px 6px',
                      borderRadius: '50%',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #e1e7ee', fontSize: '11.5px', color: '#64748b' }}>
          <div>Dual-Stream Siamese AI</div>
          <div style={{ color: '#0ea5e9', fontWeight: 600, marginTop: '2px' }}>● Offline Vectors & Fallback LLM</div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff' }}>
        
        <header style={{
          height: '60px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: '#ffffff',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title="Toggle Menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '17px', fontWeight: 600, color: '#1e293b' }}>Typographic AI Engine</span>
            </div>

            <button
              onClick={() => setCurrentView('landing')}
              title="Return to Product Home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <span>🏠</span>
              <span>Home</span>
            </button>

            {/* Active session title indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ opacity: 0.6 }}>💬</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeSession.title}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Dedicated Admin Console Button for Admins */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                title="Launch Enterprise Admin Command Center"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: '1px solid #1e293b',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; }}
              >
                <span>🛡️</span>
                <span>Admin Console</span>
              </button>
            )}

            <button
              onClick={() => setShowTelemetryModal(true)}
              title="Open Research Telemetry & Evaluation Benchmark Dataset"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <span>📊</span>
              <span>Research Telemetry</span>
            </button>

            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  backgroundColor: currentUser.role === 'admin' ? '#f5f3ff' : '#f0fdf4',
                  border: currentUser.role === 'admin' ? '1px solid #ddd6fe' : '1px solid #bbf7d0',
                  fontSize: '12px',
                  color: currentUser.role === 'admin' ? '#7c3aed' : '#15803d',
                  fontWeight: 600
                }}>
                  <span>{currentUser.role === 'admin' ? '🛡️' : '👤'}</span>
                  <span>{currentUser.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>({currentUser.role})</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <span>↪</span>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #2563eb',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                <span>🔐</span>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Central Chat Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem 0rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {activeSession.messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%' 
                }}
              >
                {msg.type === 'text' && (
                  <div style={{
                    maxWidth: msg.sender === 'user' ? '75%' : '100%',
                    padding: msg.sender === 'user' ? '12px 18px' : '8px 0',
                    borderRadius: msg.sender === 'user' ? '22px' : '0',
                    backgroundColor: msg.sender === 'user' ? '#f0f4f9' : 'transparent',
                    color: '#1e293b',
                    fontSize: '15px',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap',
                    fontWeight: 400
                  }}>
                    {msg.text}
                  </div>
                )}

                {msg.type === 'palettes' && (
                  <div style={{ width: '100%' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
                      Recommendations for <strong>{msg.platformSpec?.platform?.toUpperCase()}</strong>:
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '16px' }}>
                      {msg.data.map((palette) => {
                        const isSelected = msg.selectedPalette?.selectionId === palette.selectionId
                        return (
                          <div 
                            key={palette.selectionId} 
                            onClick={(e) => {
                              e.stopPropagation()
                              updateMessagePalette(msg.id, palette)
                            }}
                            style={{ 
                              flex: '0 0 290px', 
                              border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0', 
                              backgroundColor: '#ffffff', 
                              padding: '1.25rem', 
                              borderRadius: '16px', 
                              cursor: 'pointer', 
                              boxShadow: isSelected ? '0 8px 20px -4px rgba(37, 99, 235, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)', 
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>Palette {palette.palette_number}</h4>
                                {palette.overall_harmony && (
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    padding: '2px 7px',
                                    borderRadius: '999px',
                                    border: '1px solid #bfdbfe'
                                  }} title="5-Axis Cross-Lingual Typographic Harmony Index">
                                    ✨ {palette.overall_harmony}%
                                  </span>
                                )}
                              </div>
                              {isSelected && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Active</span>}
                            </div>
                            {palette.fonts.map((f, idx) => (
                              <div key={idx} style={{ marginBottom: '8px', fontSize: '12.5px', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                <strong style={{ color: '#0f172a' }}>[{f.role.toUpperCase()}]</strong> {formatFontDisplayName(f.english_font)} + {formatFontDisplayName(f.sinhala_font)}
                                {f.encoding_type && (
                                  <span style={{
                                    fontSize: '9.5px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: f.encoding_type === 'LEGACY' ? '#fef2f2' : '#eff6ff',
                                    color: f.encoding_type === 'LEGACY' ? '#991b1b' : '#1d4ed8',
                                    fontWeight: 600,
                                    marginLeft: '6px',
                                    border: f.encoding_type === 'LEGACY' ? '1px solid #fecaca' : '1px solid #bfdbfe'
                                  }}>
                                    {f.encoding_type === 'LEGACY' ? 'FM' : 'Unicode'}
                                  </span>
                                )}
                                <div style={{ color: '#64748b', marginTop: '2px' }}>EN {f.english_size}px | SI {f.sinhala_size}px</div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                    <CanvasPreview 
                      key={msg.selectedPalette?.selectionId || `${msg.id}-${msg.selectedPalette?.palette_number}`} 
                      palette={msg.selectedPalette} 
                      platformSpec={msg.platformSpec} 
                      allPalettes={msg.data}
                      sessionId={activeSession.id}
                      userPrompt={msg.selectedPalette?.userPrompt || activeSession.title}
                      onSelectPalette={(newPalette) => updateMessagePalette(msg.id, newPalette)}
                    />
                    <FeedbackModule session={activeSession} palette={msg.selectedPalette} />
                  </div>
                )}

                {msg.type === 'strategy' && (
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #bae6fd', 
                      borderRadius: '16px', 
                      padding: '1.25rem 1.5rem', 
                      marginBottom: '1.5rem' 
                    }}>
                      {msg.data.design_context && (
                        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Target Design: "{msg.data.design_context}"
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px' }}>✨</span>
                        <h4 style={{ margin: 0, color: '#0369a1', fontSize: '15px' }}>Applied Strategy: {msg.data.overall_strategy}</h4>
                      </div>
                      {msg.data.strategic_rationale && (
                        <div style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#0369a1', lineHeight: '1.5', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e0f2fe' }}>
                          💡 <strong>Sociolinguistic Rationale:</strong> {msg.data.strategic_rationale}
                        </div>
                      )}
                      {msg.data.role_breakdown.map((roleInfo, idx) => (
                        <div key={idx} style={{ marginBottom: '10px', fontSize: '13.5px' }}>
                          <strong style={{ color: '#0f172a' }}>[{roleInfo.role.toUpperCase()}]</strong> {roleInfo.language_preference} Layout
                          <p style={{ margin: '3px 0 0 0', color: '#475569' }}>{roleInfo.explanation}</p>
                        </div>
                      ))}
                    </div>
                    <CanvasPreview 
                      key={`strategy-${msg.selectedPalette?.selectionId || msg.id}`} 
                      palette={msg.selectedPalette} 
                      platformSpec={msg.platformSpec} 
                      allPalettes={activeSession.messages.find(m => m.type === 'palettes' && m.data)?.data || [msg.selectedPalette]}
                      sessionId={activeSession.id}
                      userPrompt={msg.selectedPalette?.userPrompt || activeSession.title}
                      onSelectPalette={(newPalette) => updateMessagePalette(msg.id, newPalette)}
                    />
                    <FeedbackModule session={activeSession} palette={msg.selectedPalette} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }}></span>
                Processing layout & typography...
              </div>
            )}
            
            {/* Minimal scroll spacer */}
            <div ref={messagesEndRef} style={{ height: '24px' }} />
          </div>
        </div>

        {/* Anchored Bottom Prompt Dock (Non-overlapping flex footer) */}
        <footer style={{
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 24px 14px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.03)',
          zIndex: 10
        }}>
          {/* Quick Action Discovery & Refinement Chips */}
          <div style={{
            width: '100%',
            maxWidth: '860px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '4px'
          }}>
            {activeSession.latestPalette ? (
              <>
                <button
                  type="button"
                  onClick={() => setInput("Please use local language preferences for this design.")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  🇱🇰 Local Sinhala-Dominant
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Make the strategy feel very global and corporate.")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  🌐 Global English-Dominant
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Keep it balanced bilingual")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  ⚖️ Balanced Bilingual
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Why were these fonts paired together?")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  💡 Typographic Rationale
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setInput("Instagram poster for a modern boutique cafe")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  ☕ Modern Cafe Poster
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Facebook banner for a luxury wellness hotel")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  🏨 Luxury Hotel Banner
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Traditional Sinhala cultural festival announcement poster")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  🏛️ Traditional Festival
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Global corporate tech product launch flyer")}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  💼 Corporate Tech Ad
                </button>
              </>
            )}
          </div>

          {/* Main Input Field Container */}
          <div style={{
            width: '100%',
            maxWidth: '860px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '28px',
            padding: '6px 12px 6px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: '1.5px solid #cbd5e1',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={activeSession.latestPalette ? "Refine language preferences (e.g. 'local Sinhala', 'global corporate') or ask a question..." : "Enter your design intent (e.g. 'Instagram poster for a modern spa')..."}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '14.5px',
                color: '#0f172a',
                padding: '8px 0'
              }}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              title="Send prompt (Enter)"
              style={{
                background: input.trim() && !loading ? '#2563eb' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                marginLeft: '8px',
                flexShrink: 0
              }}
              onMouseOver={(e) => input.trim() && !loading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => input.trim() && !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
            Dual-Stream Typographic Engine • Fabric.js Editable Canvas • OFL Verified Typography
          </div>
        </footer>

        {/* Research Telemetry & Evaluation Benchmark Modal */}
        <EvaluationTelemetryModal 
          isOpen={showTelemetryModal} 
          onClose={() => setShowTelemetryModal(false)} 
        />

        {/* Role-Based Authentication & Guest Demo Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />

      </main>
    </div>
  )
}