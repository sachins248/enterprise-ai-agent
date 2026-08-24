import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text-1)',
  fontSize: '14px',
  fontFamily: 'Outfit, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export default function Register() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('DEVELOPER');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await apiFetch('/auth/register', { method: 'POST', body: { email, password, role } });
      const data = await res.json();
      login(data.accessToken);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* ── Left panel: brand ──────────────────────── */}
      <div
        className="dot-grid"
        style={{
          background: 'var(--surface)',
          padding: '56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.22em',
            color: 'var(--accent)',
          }}>
            {'<AGENT/>'}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.05,
            color: 'var(--text-1)',
            marginBottom: '22px',
            letterSpacing: '-0.02em',
          }}>
            Join the<br />
            <span style={{ color: 'var(--accent)' }}>future</span><br />
            of code.
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-2)',
            lineHeight: 1.75,
            maxWidth: '340px',
          }}>
            Create your account and start chatting with your AI coding agent.
            Roles control what you can see and do across the platform.
          </p>

          <div style={{
            marginTop: '40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {['ADMIN', 'DEVELOPER', 'VIEWER'].map(r => (
              <div key={r} style={{
                background: 'rgba(0,230,118,0.06)',
                border: '1px solid rgba(0,230,118,0.14)',
                borderRadius: '10px',
                padding: '14px 12px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  color: 'var(--accent)',
                  marginBottom: '6px',
                }}>
                  {r}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                  {r === 'ADMIN' && 'Full access\nall teams'}
                  {r === 'DEVELOPER' && 'Chat +\nanalytics'}
                  {r === 'VIEWER' && 'Read-only\naccess'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--text-3)',
          letterSpacing: '0.15em',
        }}>
          POWERED BY GEMINI · SPRING BOOT · REACT
        </div>
      </div>

      {/* ── Right panel: form ──────────────────────── */}
      <div style={{
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '30px',
            fontWeight: 700,
            color: 'var(--text-1)',
            marginBottom: '8px',
          }}>
            Create account
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '40px' }}>
            Join the Enterprise AI Agent platform
          </p>

          <form onSubmit={handleSubmit}>
            <FieldLabel label="Email" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={{ ...inputStyle, marginBottom: '20px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            <FieldLabel label="Password" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ ...inputStyle, marginBottom: '20px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            <FieldLabel label="Role" />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, marginBottom: '28px', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
            </select>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'var(--error-bg)',
                border: '1px solid rgba(255,82,82,0.22)',
                borderRadius: '10px',
                color: 'var(--error)',
                fontSize: '13px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'rgba(0,230,118,0.35)' : 'var(--accent)',
                border: 'none',
                borderRadius: '10px',
                color: '#07080e',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1aff88'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-2)', marginTop: '28px' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent)', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ label }) {
  return (
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 500,
      color: 'var(--text-2)',
      marginBottom: '8px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {label}
    </label>
  );
}
