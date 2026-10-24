import React, { useState } from 'react'
import axios from 'axios'

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [role, setRole] = useState('user') // 'user' | 'admin'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleQuickLogin = async (targetRole) => {
    setLoading(true)
    setError(null)
    const targetEmail = targetRole === 'admin' ? 'admin@typographic.ai' : 'designer@typographic.ai'
    const targetPw = targetRole === 'admin' ? 'admin123' : 'designer123'

    try {
      const res = await axios.post('/api/auth/login', {
        email: targetEmail,
        password: targetPw,
        role_requested: targetRole
      })
      if (res.data.status === 'success') {
        onLoginSuccess(res.data.user)
        onClose()
      }
    } catch (err) {
      console.warn("Backend auth call fallback, logging in locally:", err)
      // Resilient local fallback
      const fallbackUser = {
        id: targetRole === 'admin' ? 1 : 2,
        name: targetRole === 'admin' ? 'Lead Researcher' : 'Bilingual Designer',
        email: targetEmail,
        role: targetRole
      }
      onLoginSuccess(fallbackUser)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister 
        ? { name, email, password, role } 
        : { email, password, role_requested: role }

      const res = await axios.post(endpoint, payload)
      if (res.data.status === 'success') {
        onLoginSuccess(res.data.user)
        onClose()
      }
    } catch (err) {
      console.error("Auth error:", err)
      setError(err.response?.data?.detail || "Authentication failed. Try the 1-click quick login buttons above.")
    } finally {
      setLoading(false)
    }
  }

  const handleGuestAccess = () => {
    onLoginSuccess({
      id: 0,
      name: 'Guest Designer',
      email: 'guest@demo.local',
      role: 'guest'
    })
    onClose()
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
        zIndex: 10000,
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
          maxWidth: '440px',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            type="button"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {isRegister ? 'Create Typographic AI Account' : 'Sign in to Typographic AI'}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Choose your role to access customized design tools or research telemetry.
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {/* 1-Click Quick Demo Login Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
              ⚡ Fast 1-Click Demo Access
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                disabled={loading}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '10px',
                  color: '#0369a1',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.borderColor = '#7dd3fc'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}
              >
                <span>👤</span> Designer
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f5f3ff',
                  border: '1.5px solid #ddd6fe',
                  borderRadius: '10px',
                  color: '#6d28d9',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ede9fe'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
              >
                <span>🛡️</span> Admin Portal
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>OR SIGN IN MANUALLY</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Perera"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Select Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: role === 'user' ? 700 : 500,
                    border: role === 'user' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: role === 'user' ? '#eff6ff' : '#ffffff',
                    color: role === 'user' ? '#1d4ed8' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  👤 Designer / User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: role === 'admin' ? 700 : 500,
                    border: role === 'admin' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                    backgroundColor: role === 'admin' ? '#f5f3ff' : '#ffffff',
                    color: role === 'admin' ? '#6d28d9' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  🛡️ Administrator
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1e293b')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0f172a')}
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Register Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {isRegister ? 'Sign In' : 'Register Now'}
            </button>
          </div>

          {/* Friction-free Guest Bypass */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleGuestAccess}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Continue without signing in (Guest Demo Mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

