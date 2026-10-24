// Multi-Tenant Account-Scoped Session Storage Manager

export const createInitialSession = () => ({
  id: Date.now().toString(),
  title: 'New Design Session',
  createdAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  messages: [
    {
      id: 1,
      sender: 'ai',
      type: 'text',
      text: "Hello! I am your Typographic AI Engine. Describe your design intent (e.g. 'I want to create an Instagram poster for a modern tech startup' or 'FB food poster with header: Yummy Food'), and I'll generate bilingual font pairings and interactive layouts."
    }
  ],
  latestPalette: null
})

// Returns isolated storage key unique to each authenticated user account
export const getStorageKeyForUser = (user) => {
  if (!user) return 'typographic_ai_sessions_guest'
  const userKey = (user.email || user.name || String(user.id) || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `typographic_ai_sessions_${userKey}`
}

// Loads isolated sessions for a given user account with seamless backward compatibility
export const loadSessionsForUser = (user) => {
  const userKey = getStorageKeyForUser(user)
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(userKey) : null
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
    // Backward-compatible migration:
    // If user-specific key is empty but legacy shared sessions exist, migrate them to this user
    const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem('typographic_ai_sessions') : null
    if (legacy && user) {
      const parsedLegacy = JSON.parse(legacy)
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        localStorage.setItem(userKey, legacy)
        return parsedLegacy
      }
    }
  } catch (e) {
    console.warn("Could not read stored user sessions:", e)
  }
  return [createInitialSession()]
}

