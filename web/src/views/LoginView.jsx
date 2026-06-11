import React, { useState } from 'react';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      onLogin(data.user);
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#0f0e2a',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 60, borderRight: '1px solid #1e1b4b',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(#1e1b4b 1px, transparent 1px), linear-gradient(90deg, #1e1b4b 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.4,
        }} />
        <div style={{
          position: 'absolute', top: '25%', left: '30%', width: 320, height: 320,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>
            TaskFlow
          </div>
          <div style={{ fontSize: 15, color: '#818cf8', marginBottom: 32 }}>
            Health Market Connect
          </div>
          <div style={{ fontSize: 14, color: '#6366f1', lineHeight: 1.7 }}>
            Your daily and weekly task hub.<br />
            Powered by Google Calendar, Slack, and your team.
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: 460, flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '60px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#e0e7ff' }}>
            Welcome back
          </h2>
          <p style={{ margin: '0 0 36px', fontSize: 14, color: '#6366f1' }}>
            Sign in with your apexhmc.com account
          </p>

          {error && (
            <div style={{
              background: '#2a0a0a', border: '1px solid #f87171', borderRadius: 10,
              padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#f87171',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#6366f1', marginBottom: 8,
              }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@apexhmc.com"
                autoFocus
                style={{
                  width: '100%', background: '#0d0b2a', border: '1px solid #312e81',
                  borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#e0e7ff',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#6366f1', marginBottom: 8,
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', background: '#0d0b2a', border: '1px solid #312e81',
                  borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#e0e7ff',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%', background: loading || !email || !password ? '#4338ca88' : '#6366f1',
                color: '#fff', border: 'none', borderRadius: 10, padding: '14px',
                fontSize: 15, fontWeight: 600,
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #1e1b4b', marginTop: 28, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#4338ca' }}>
              Need access? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
