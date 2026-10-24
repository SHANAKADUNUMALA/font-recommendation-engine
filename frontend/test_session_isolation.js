// Automated Unit Test Suite for Multi-Tenant Account-Scoped Session Isolation
import assert from 'assert'
import { getStorageKeyForUser, loadSessionsForUser, createInitialSession } from './src/utils/sessionStorage.js'

// Mock global localStorage in Node environment
const mockStorage = {}
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val) },
  removeItem: (key) => { delete mockStorage[key] },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) }
}

console.log("=================================================================")
console.log("🧪 STARTING SESSION ISOLATION & MULTI-TENANCY TEST SUITE")
console.log("=================================================================\n")

// Test 1: Verify Storage Key Isolation
console.log("▶ TEST 1: Storage Key Namespacing per Account")
const userGuest = null
const userHeshan = { id: 101, name: 'Heshan', email: 'heshan@example.com', role: 'user' }
const userDunumala = { id: 102, name: 'Dunumala', email: 'admin@typographic.ai', role: 'admin' }

const keyGuest = getStorageKeyForUser(userGuest)
const keyHeshan = getStorageKeyForUser(userHeshan)
const keyDunumala = getStorageKeyForUser(userDunumala)

console.log(`  Guest Storage Key:    ${keyGuest}`)
console.log(`  Heshan Storage Key:   ${keyHeshan}`)
console.log(`  Dunumala Storage Key: ${keyDunumala}`)

assert.strictEqual(keyGuest, 'typographic_ai_sessions_guest')
assert.strictEqual(keyHeshan, 'typographic_ai_sessions_heshan_example_com')
assert.strictEqual(keyDunumala, 'typographic_ai_sessions_admin_typographic_ai')
assert.notStrictEqual(keyHeshan, keyDunumala, "Heshan and Dunumala must have completely distinct keys!")
console.log("  ✅ PASS: Storage keys are strictly isolated per account.\n")

// Test 2: Verify Cross-Account Privacy Isolation
console.log("▶ TEST 2: Multi-Tenant Data Isolation (No Session Leaking)")
localStorage.clear()

// Heshan enters the studio and creates 2 sessions
const heshanSession1 = { id: 'h-1', title: 'i want to create social media poster for luxury hotel', messages: [] }
const heshanSession2 = { id: 'h-2', title: 'luxury boutique hotel in Kandy', messages: [] }
localStorage.setItem(keyHeshan, JSON.stringify([heshanSession1, heshanSession2]))

// Now Dunumala logs in
const dunumalaLoadedSessions = loadSessionsForUser(userDunumala)
console.log(`  Dunumala logs in -> Number of sessions loaded: ${dunumalaLoadedSessions.length}`)
console.log(`  Dunumala session titles:`, dunumalaLoadedSessions.map(s => s.title))

// Verify Dunumala does NOT see Heshan's sessions
const containsHeshanSessions = dunumalaLoadedSessions.some(s => s.id === 'h-1' || s.id === 'h-2')
assert.strictEqual(containsHeshanSessions, false, "CRITICAL: Dunumala must NEVER see Heshan's sessions!")
console.log("  ✅ PASS: Dunumala cannot see Heshan's private sessions.")

// Dunumala creates an Admin session
const dunumalaSession1 = { id: 'd-1', title: 'Admin Telemetry Benchmark Review', messages: [] }
localStorage.setItem(keyDunumala, JSON.stringify([dunumalaSession1]))

// Now Heshan logs back in
const heshanReloadedSessions = loadSessionsForUser(userHeshan)
console.log(`  Heshan logs back in -> Number of sessions loaded: ${heshanReloadedSessions.length}`)
console.log(`  Heshan session titles:`, heshanReloadedSessions.map(s => s.title))

assert.strictEqual(heshanReloadedSessions.length, 2)
assert.strictEqual(heshanReloadedSessions[0].id, 'h-1')
assert.strictEqual(heshanReloadedSessions[1].id, 'h-2')
assert.strictEqual(heshanReloadedSessions.some(s => s.id === 'd-1'), false, "CRITICAL: Heshan must NEVER see Dunumala's admin session!")
console.log("  ✅ PASS: Heshan's sessions are completely preserved and isolated from Dunumala.\n")

// Test 3: Backward-Compatible Legacy Migration (No Data Loss)
console.log("▶ TEST 3: Backward-Compatible Legacy Session Migration")
localStorage.clear()

// Suppose prior to this fix, the browser had legacy sessions in 'typographic_ai_sessions'
const legacySession = { id: 'legacy-99', title: 'Previous working design before auth', messages: [] }
localStorage.setItem('typographic_ai_sessions', JSON.stringify([legacySession]))

// A new user 'Alex' logs in for the first time
const userAlex = { id: 103, name: 'Alex', email: 'designer@typographic.ai', role: 'user' }
const alexSessions = loadSessionsForUser(userAlex)

console.log(`  Alex logs in for first time -> Sessions loaded:`, alexSessions.map(s => s.title))
assert.strictEqual(alexSessions.length, 1)
assert.strictEqual(alexSessions[0].id, 'legacy-99')
assert.strictEqual(alexSessions[0].title, 'Previous working design before auth')

// Check that it was saved into Alex's private key
const keyAlex = getStorageKeyForUser(userAlex)
const savedInAlexKey = JSON.parse(localStorage.getItem(keyAlex))
assert.strictEqual(savedInAlexKey[0].id, 'legacy-99')
console.log("  ✅ PASS: Existing legacy sessions are migrated into the user's account with zero data loss.\n")

// Test 4: Guest Workspace Isolation
console.log("▶ TEST 4: Guest Workspace Isolation")
const guestSessions = loadSessionsForUser(null)
console.log(`  Guest sessions loaded:`, guestSessions.map(s => s.title))
assert.ok(guestSessions.length >= 1)
assert.strictEqual(guestSessions[0].title, 'New Design Session')
console.log("  ✅ PASS: Guest workspace operates independently without polluting authenticated accounts.\n")

console.log("=================================================================")
console.log("🎉 ALL 4/4 SESSION ISOLATION & MULTI-TENANCY TESTS PASSED!")
console.log("=================================================================")

